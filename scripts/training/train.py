"""
NailXR Nail Segmentation Training Script

Usage:
    # Train with synthetic data (no dataset needed)
    python scripts/training/train.py --synthetic --epochs 50

    # Train with scraped dataset
    python scripts/training/train.py --dataset ./data/dataset --epochs 100

    # Resume training from checkpoint
    python scripts/training/train.py --dataset ./data/dataset --resume checkpoints/best_model.pth

    # Train with custom settings
    python scripts/training/train.py --dataset ./data/dataset --lr 0.0001 --batch-size 32 --epochs 200
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts, ReduceLROnPlateau
from tqdm import tqdm

# Add parent dir to path
sys.path.insert(0, str(Path(__file__).parent))

from model import NailSegmentationUNet, NailSegmentationLoss, count_parameters, estimate_model_size
from dataset import create_dataloaders, SyntheticNailDataset, NailSegmentationDataset
from torch.utils.data import DataLoader


def parse_args():
    parser = argparse.ArgumentParser(description='Train Nail Segmentation Model')
    
    # Data
    parser.add_argument('--dataset', type=str, default='./data/dataset',
                        help='Path to dataset directory')
    parser.add_argument('--synthetic', action='store_true',
                        help='Use synthetic data for training (no dataset required)')
    parser.add_argument('--synthetic-samples', type=int, default=10000,
                        help='Number of synthetic samples to generate')
    
    # Model
    parser.add_argument('--image-size', type=int, default=256,
                        help='Input image size (square)')
    parser.add_argument('--features', type=int, nargs='+', default=[16, 32, 64, 128],
                        help='Feature channels per encoder level')
    
    # Training
    parser.add_argument('--epochs', type=int, default=100,
                        help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=16,
                        help='Batch size')
    parser.add_argument('--lr', type=float, default=1e-3,
                        help='Initial learning rate')
    parser.add_argument('--weight-decay', type=float, default=1e-4,
                        help='Weight decay')
    parser.add_argument('--scheduler', type=str, default='cosine',
                        choices=['cosine', 'plateau'],
                        help='LR scheduler')
    
    # Output
    parser.add_argument('--output-dir', type=str, default='./checkpoints',
                        help='Directory to save checkpoints')
    parser.add_argument('--run-name', type=str, default=None,
                        help='Name for this training run')
    
    # Misc
    parser.add_argument('--resume', type=str, default=None,
                        help='Path to checkpoint to resume from')
    parser.add_argument('--num-workers', type=int, default=4,
                        help='DataLoader workers')
    parser.add_argument('--log-interval', type=int, default=10,
                        help='Log every N batches')
    parser.add_argument('--save-interval', type=int, default=10,
                        help='Save checkpoint every N epochs')
    parser.add_argument('--early-stopping', type=int, default=20,
                        help='Early stopping patience (epochs)')
    
    return parser.parse_args()


def compute_metrics(pred, target, threshold=0.5):
    """Compute segmentation metrics"""
    pred_binary = (pred > threshold).float()
    target_binary = (target > threshold).float()
    
    # Intersection over Union (IoU)
    intersection = (pred_binary * target_binary).sum()
    union = pred_binary.sum() + target_binary.sum() - intersection
    iou = (intersection + 1e-6) / (union + 1e-6)
    
    # Dice coefficient
    dice = (2 * intersection + 1e-6) / (pred_binary.sum() + target_binary.sum() + 1e-6)
    
    # Pixel accuracy
    correct = (pred_binary == target_binary).float().sum()
    total = target_binary.numel()
    accuracy = correct / total
    
    # Precision & Recall
    tp = (pred_binary * target_binary).sum()
    fp = (pred_binary * (1 - target_binary)).sum()
    fn = ((1 - pred_binary) * target_binary).sum()
    
    precision = (tp + 1e-6) / (tp + fp + 1e-6)
    recall = (tp + 1e-6) / (tp + fn + 1e-6)
    
    return {
        'iou': iou.item(),
        'dice': dice.item(),
        'accuracy': accuracy.item(),
        'precision': precision.item(),
        'recall': recall.item(),
    }


def train_epoch(model, loader, criterion, optimizer, device, log_interval=10):
    """Train for one epoch"""
    model.train()
    total_loss = 0
    total_metrics = {'iou': 0, 'dice': 0, 'accuracy': 0, 'precision': 0, 'recall': 0}
    num_batches = 0
    
    pbar = tqdm(loader, desc='Training', leave=False)
    for batch_idx, batch in enumerate(pbar):
        images = batch['image'].to(device)
        masks = batch['mask'].to(device)
        
        # Forward pass
        predictions = model(images)
        loss = criterion(predictions, masks)
        
        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        
        # Gradient clipping
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        optimizer.step()
        
        # Metrics
        total_loss += loss.item()
        metrics = compute_metrics(predictions.detach(), masks.detach())
        for k, v in metrics.items():
            total_metrics[k] += v
        num_batches += 1
        
        if batch_idx % log_interval == 0:
            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'IoU': f'{metrics["iou"]:.4f}',
                'Dice': f'{metrics["dice"]:.4f}',
            })
    
    # Average
    avg_loss = total_loss / max(1, num_batches)
    avg_metrics = {k: v / max(1, num_batches) for k, v in total_metrics.items()}
    
    return avg_loss, avg_metrics


@torch.no_grad()
def validate(model, loader, criterion, device):
    """Validate the model"""
    model.eval()
    total_loss = 0
    total_metrics = {'iou': 0, 'dice': 0, 'accuracy': 0, 'precision': 0, 'recall': 0}
    num_batches = 0
    
    for batch in tqdm(loader, desc='Validating', leave=False):
        images = batch['image'].to(device)
        masks = batch['mask'].to(device)
        
        predictions = model(images)
        loss = criterion(predictions, masks)
        
        total_loss += loss.item()
        metrics = compute_metrics(predictions, masks)
        for k, v in metrics.items():
            total_metrics[k] += v
        num_batches += 1
    
    avg_loss = total_loss / max(1, num_batches)
    avg_metrics = {k: v / max(1, num_batches) for k, v in total_metrics.items()}
    
    return avg_loss, avg_metrics


def save_checkpoint(model, optimizer, scheduler, epoch, metrics, path):
    """Save training checkpoint"""
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'scheduler_state_dict': scheduler.state_dict() if scheduler else None,
        'metrics': metrics,
    }, path)


def main():
    args = parse_args()
    
    # Setup
    run_name = args.run_name or f"nail_seg_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    output_dir = Path(args.output_dir) / run_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Device
    if torch.cuda.is_available():
        device = torch.device('cuda')
        print(f"🚀 Using GPU: {torch.cuda.get_device_name(0)}")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        device = torch.device('mps')
        print("🍎 Using Apple Silicon GPU (MPS)")
    else:
        device = torch.device('cpu')
        print("💻 Using CPU")
    
    # Model
    model = NailSegmentationUNet(
        in_channels=3,
        out_channels=1,
        features=args.features,
    ).to(device)
    
    total_params, trainable_params = count_parameters(model)
    est_size = estimate_model_size(model)
    
    print(f"\n📊 Model: NailSegmentationUNet")
    print(f"   Parameters: {total_params:,} ({trainable_params:,} trainable)")
    print(f"   Estimated ONNX size: {est_size:.2f} MB")
    
    # Data
    if args.synthetic:
        print(f"\n🎨 Using synthetic data ({args.synthetic_samples} samples)")
        train_dataset = SyntheticNailDataset(
            num_samples=args.synthetic_samples,
            image_size=args.image_size,
        )
        val_dataset = SyntheticNailDataset(
            num_samples=args.synthetic_samples // 5,
            image_size=args.image_size,
            augment=False,
        )
        
        train_loader = DataLoader(
            train_dataset, batch_size=args.batch_size,
            shuffle=True, num_workers=args.num_workers, pin_memory=True,
        )
        val_loader = DataLoader(
            val_dataset, batch_size=args.batch_size,
            shuffle=False, num_workers=args.num_workers, pin_memory=True,
        )
    else:
        print(f"\n📂 Dataset: {args.dataset}")
        train_loader, val_loader, _ = create_dataloaders(
            dataset_dir=args.dataset,
            batch_size=args.batch_size,
            image_size=args.image_size,
            num_workers=args.num_workers,
        )
    
    # Loss, optimizer, scheduler
    criterion = NailSegmentationLoss(bce_weight=0.5, dice_weight=0.5)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    
    if args.scheduler == 'cosine':
        scheduler = CosineAnnealingWarmRestarts(optimizer, T_0=10, T_mult=2)
    else:
        scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)
    
    # Resume
    start_epoch = 0
    best_val_iou = 0
    
    if args.resume:
        print(f"\n📦 Resuming from: {args.resume}")
        checkpoint = torch.load(args.resume, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        if checkpoint.get('scheduler_state_dict') and scheduler:
            scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        start_epoch = checkpoint['epoch'] + 1
        best_val_iou = checkpoint.get('metrics', {}).get('val_iou', 0)
        print(f"   Resumed at epoch {start_epoch}, best IoU: {best_val_iou:.4f}")
    
    # Training loop
    print(f"\n🏋️ Training for {args.epochs} epochs...")
    print(f"   Batch size: {args.batch_size}")
    print(f"   Learning rate: {args.lr}")
    print(f"   Output: {output_dir}")
    print()
    
    training_log = []
    patience_counter = 0
    
    for epoch in range(start_epoch, args.epochs):
        epoch_start = time.time()
        
        # Train
        train_loss, train_metrics = train_epoch(
            model, train_loader, criterion, optimizer, device, args.log_interval
        )
        
        # Validate
        val_loss, val_metrics = validate(model, val_loader, criterion, device)
        
        # Update scheduler
        if args.scheduler == 'cosine':
            scheduler.step()
        else:
            scheduler.step(val_loss)
        
        epoch_time = time.time() - epoch_start
        lr = optimizer.param_groups[0]['lr']
        
        # Log
        log_entry = {
            'epoch': epoch,
            'train_loss': train_loss,
            'val_loss': val_loss,
            'train_iou': train_metrics['iou'],
            'val_iou': val_metrics['iou'],
            'train_dice': train_metrics['dice'],
            'val_dice': val_metrics['dice'],
            'lr': lr,
            'time': epoch_time,
        }
        training_log.append(log_entry)
        
        print(
            f"Epoch {epoch:3d}/{args.epochs} | "
            f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"Train IoU: {train_metrics['iou']:.4f} | Val IoU: {val_metrics['iou']:.4f} | "
            f"Val Dice: {val_metrics['dice']:.4f} | "
            f"LR: {lr:.6f} | Time: {epoch_time:.1f}s"
        )
        
        # Save best model
        if val_metrics['iou'] > best_val_iou:
            best_val_iou = val_metrics['iou']
            patience_counter = 0
            
            save_checkpoint(
                model, optimizer, scheduler, epoch,
                {'val_iou': best_val_iou, 'val_dice': val_metrics['dice']},
                output_dir / 'best_model.pth'
            )
            print(f"  ✅ New best model! IoU: {best_val_iou:.4f}")
        else:
            patience_counter += 1
        
        # Periodic save
        if (epoch + 1) % args.save_interval == 0:
            save_checkpoint(
                model, optimizer, scheduler, epoch,
                {'val_iou': val_metrics['iou'], 'val_dice': val_metrics['dice']},
                output_dir / f'checkpoint_epoch_{epoch}.pth'
            )
        
        # Save training log
        with open(output_dir / 'training_log.json', 'w') as f:
            json.dump(training_log, f, indent=2)
        
        # Early stopping
        if patience_counter >= args.early_stopping:
            print(f"\n⏹️ Early stopping at epoch {epoch} (patience: {args.early_stopping})")
            break
    
    # Save final model
    save_checkpoint(
        model, optimizer, scheduler, epoch,
        {'val_iou': val_metrics['iou'], 'val_dice': val_metrics['dice']},
        output_dir / 'final_model.pth'
    )
    
    # Training summary
    print(f"\n{'='*60}")
    print(f"🎉 Training Complete!")
    print(f"   Best Val IoU:  {best_val_iou:.4f}")
    print(f"   Final Val IoU: {val_metrics['iou']:.4f}")
    print(f"   Final Val Dice: {val_metrics['dice']:.4f}")
    print(f"   Checkpoints: {output_dir}")
    print(f"\nNext step: Export to ONNX:")
    print(f"   python scripts/training/export_onnx.py --checkpoint {output_dir / 'best_model.pth'}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
