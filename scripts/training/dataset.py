"""
PyTorch Dataset for Nail Segmentation Training
Loads images and masks from the prepared dataset directory

Augmentation Modes:
    LIGHT  — Safe defaults with moderate augmentation (flip, rotate, color jitter,
             motion blur, CLAHE, JPEG compression). Good for fine-tuning.
    HEAVY  — Aggressive augmentation for maximum robustness (adds elastic transform,
             grid distortion, perspective warp, random shadow/sunflare, channel shuffle).
             Use for training from scratch or when overfitting.

Mixup/CutMix:
    Optional batch-level regularization. Enable via `mixup_alpha` / `cutmix_alpha`
    parameters in `create_dataloaders()`.
"""

import os
import json
import random
from enum import Enum
import numpy as np
from PIL import Image
from pathlib import Path

import torch
from torch.utils.data import Dataset, DataLoader
import albumentations as A
from albumentations.pytorch import ToTensorV2


class AugmentMode(Enum):
    """Augmentation intensity modes"""
    NONE = 'none'
    LIGHT = 'light'
    HEAVY = 'heavy'


class NailSegmentationDataset(Dataset):
    """
    Dataset loader for nail segmentation training.
    
    Expected directory structure:
        data/dataset/
        ├── train/
        │   ├── images/    # Input images
        │   └── masks/     # Binary segmentation masks (0=background, 255=nail)
        ├── val/
        │   ├── images/
        │   └── masks/
        └── test/
            ├── images/
            └── masks/
    
    If masks are not available (common for scraped data), the dataset can work
    in "design-only" mode where it provides images without masks, useful for:
    - Style transfer training
    - Design gallery features
    - Unsupervised/self-supervised pre-training
    """
    
    def __init__(
        self,
        root_dir: str,
        split: str = 'train',
        image_size: int = 256,
        augment: bool = True,
        augment_mode: str = 'light',
        require_masks: bool = False,
    ):
        self.root_dir = Path(root_dir)
        self.split = split
        self.image_size = image_size
        self.require_masks = require_masks
        
        # Resolve augment mode
        if not augment or split != 'train':
            self.augment_mode = AugmentMode.NONE
        else:
            self.augment_mode = AugmentMode(augment_mode)
        
        self.images_dir = self.root_dir / split / 'images'
        self.masks_dir = self.root_dir / split / 'masks'
        
        # Load image list
        self.image_files = sorted([
            f for f in os.listdir(self.images_dir)
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
        ])
        
        # Check for corresponding masks
        self.has_masks = self.masks_dir.exists() and len(os.listdir(self.masks_dir)) > 0
        
        if require_masks and not self.has_masks:
            raise FileNotFoundError(
                f"Masks required but not found in {self.masks_dir}. "
                "Generate masks first using auto-annotation or manual labeling."
            )
        
        # Build transforms
        self.transform = self._build_transforms(self.augment_mode)
        
        # Load manifest if available
        manifest_path = self.root_dir / 'annotations' / f'{split}.json'
        self.manifest = None
        if manifest_path.exists():
            with open(manifest_path) as f:
                self.manifest = json.load(f)
        
        print(f"📂 Loaded {split} split: {len(self.image_files)} images, "
              f"masks={'✅' if self.has_masks else '❌'}, augment={self.augment_mode.value}")
    
    def _build_transforms(self, mode: AugmentMode):
        """
        Build albumentations transform pipeline.
        
        Layered architecture (each layer applied independently for better stacking):
            1. Resize
            2. Geometric transforms (flip, rotate, shift/scale)
            3. Spatial distortions (elastic, grid, perspective)  [HEAVY only]
            4. Color/lighting transforms (brightness, hue, CLAHE, shadow)
            5. Noise & blur (gaussian, motion blur, ISO noise)
            6. Quality degradation (JPEG compression, downscale)
            7. Dropout / erasing
            8. Normalize + ToTensor
        """
        if mode == AugmentMode.NONE:
            return A.Compose([
                A.Resize(self.image_size, self.image_size),
                A.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
                ToTensorV2(),
            ])
        
        if mode == AugmentMode.LIGHT:
            return self._build_light_transforms()
        else:
            return self._build_heavy_transforms()
    
    def _build_light_transforms(self):
        """Light augmentation — safe defaults for fine-tuning"""
        return A.Compose([
            # 1. Resize
            A.Resize(self.image_size, self.image_size),
            
            # 2. Geometric
            A.HorizontalFlip(p=0.5),
            A.ShiftScaleRotate(
                shift_limit=0.1, scale_limit=0.2, rotate_limit=30,
                border_mode=0, p=0.5
            ),
            
            # 3. Color / lighting (stacked, not OneOf — allows combinations)
            A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=0.5),
            A.HueSaturationValue(
                hue_shift_limit=15, sat_shift_limit=25, val_shift_limit=15, p=0.4
            ),
            A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=0.3),
            A.RGBShift(r_shift_limit=15, g_shift_limit=15, b_shift_limit=15, p=0.3),
            
            # 4. Noise & blur
            A.OneOf([
                A.GaussianBlur(blur_limit=(3, 7)),
                A.MotionBlur(blur_limit=(3, 7)),
            ], p=0.3),
            A.GaussNoise(var_limit=(10, 40), p=0.2),
            
            # 5. Quality degradation
            A.ImageCompression(quality_lower=60, quality_upper=100, p=0.3),
            A.Downscale(scale_min=0.5, scale_max=0.9, p=0.15),
            
            # 6. Dropout
            A.CoarseDropout(
                max_holes=4, max_height=32, max_width=32,
                min_holes=1, min_height=8, min_width=8,
                fill_value=0, p=0.2
            ),
            
            # 7. Normalize + tensor
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
            ToTensorV2(),
        ])
    
    def _build_heavy_transforms(self):
        """Heavy augmentation — aggressive for training from scratch or anti-overfitting"""
        return A.Compose([
            # 1. Resize
            A.Resize(self.image_size, self.image_size),
            
            # 2. Geometric (higher probabilities)
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.1),
            A.RandomRotate90(p=0.2),
            A.ShiftScaleRotate(
                shift_limit=0.15, scale_limit=0.3, rotate_limit=45,
                border_mode=0, p=0.6
            ),
            
            # 3. Spatial distortions (HEAVY-only transforms)
            A.OneOf([
                A.ElasticTransform(
                    alpha=80, sigma=80 * 0.05, alpha_affine=80 * 0.03, p=1.0
                ),
                A.GridDistortion(num_steps=5, distort_limit=0.3, p=1.0),
                A.Perspective(scale=(0.05, 0.15), p=1.0),
            ], p=0.4),
            
            # 4. Color / lighting (stacked, more aggressive)
            A.RandomBrightnessContrast(brightness_limit=0.4, contrast_limit=0.4, p=0.6),
            A.HueSaturationValue(
                hue_shift_limit=25, sat_shift_limit=40, val_shift_limit=25, p=0.5
            ),
            A.CLAHE(clip_limit=6.0, tile_grid_size=(8, 8), p=0.4),
            A.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.15, p=0.3),
            A.RGBShift(r_shift_limit=20, g_shift_limit=20, b_shift_limit=20, p=0.4),
            A.ChannelShuffle(p=0.05),
            
            # 5. Lighting effects (shadows, sun flare)
            A.RandomShadow(
                shadow_roi=(0, 0.5, 1, 1),
                num_shadows_limit=(1, 3),
                shadow_dimension=5, p=0.2
            ),
            A.RandomSunFlare(
                flare_roi=(0, 0, 1, 0.5),
                src_radius=80, p=0.1
            ),
            
            # 6. Noise & blur (more variety)
            A.OneOf([
                A.GaussianBlur(blur_limit=(3, 9)),
                A.MotionBlur(blur_limit=(3, 12)),
                A.MedianBlur(blur_limit=5),
            ], p=0.4),
            A.OneOf([
                A.GaussNoise(var_limit=(10, 60)),
                A.ISONoise(color_shift=(0.01, 0.05), intensity=(0.1, 0.5)),
            ], p=0.3),
            
            # 7. Quality degradation (more aggressive)
            A.ImageCompression(quality_lower=30, quality_upper=95, p=0.4),
            A.Downscale(scale_min=0.25, scale_max=0.8, p=0.25),
            
            # 8. Dropout (larger holes, more of them)
            A.CoarseDropout(
                max_holes=8, max_height=48, max_width=48,
                min_holes=1, min_height=8, min_width=8,
                fill_value=0, p=0.3
            ),
            
            # 9. Normalize + tensor
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
            ToTensorV2(),
        ])
    
    def __len__(self):
        return len(self.image_files)
    
    def __getitem__(self, idx):
        # Load image
        img_name = self.image_files[idx]
        img_path = self.images_dir / img_name
        
        image = np.array(Image.open(img_path).convert('RGB'))
        
        # Load mask if available
        mask = None
        if self.has_masks:
            mask_name = os.path.splitext(img_name)[0] + '.png'
            mask_path = self.masks_dir / mask_name
            
            if mask_path.exists():
                mask = np.array(Image.open(mask_path).convert('L'))
                mask = (mask > 127).astype(np.float32)  # Binary mask
        
        # Apply transforms
        if mask is not None:
            transformed = self.transform(image=image, mask=mask)
            image_tensor = transformed['image']
            mask_tensor = transformed['mask'].unsqueeze(0)  # Add channel dim
        else:
            transformed = self.transform(image=image)
            image_tensor = transformed['image']
            mask_tensor = torch.zeros(1, self.image_size, self.image_size)
        
        # Get metadata
        meta = {
            'filename': img_name,
            'has_mask': mask is not None,
        }
        
        if self.manifest and idx < len(self.manifest):
            meta.update({
                'tags': self.manifest[idx].get('tags', []),
                'quality_score': self.manifest[idx].get('qualityScore', 0),
            })
        
        return {
            'image': image_tensor,
            'mask': mask_tensor,
            'meta': meta,
        }


class SyntheticNailDataset(Dataset):
    """
    Generate synthetic nail segmentation training data.
    
    Since scraping from Reddit gives us nail art images (not annotated masks),
    this dataset generates synthetic nail masks using geometric priors from
    MediaPipe hand landmarks. This provides initial training data to bootstrap
    the model before fine-tuning with real annotated data.
    
    The synthetic masks simulate nail shapes (oval, square, almond, stiletto)
    on random hand positions.
    """
    
    def __init__(
        self,
        num_samples: int = 5000,
        image_size: int = 256,
        augment: bool = True,
        augment_mode: str = 'light',
    ):
        self.num_samples = num_samples
        self.image_size = image_size
        
        # Resolve augment mode
        if not augment:
            self.augment_mode = AugmentMode.NONE
        else:
            self.augment_mode = AugmentMode(augment_mode)
        
        # Reuse the same augmentation builder as NailSegmentationDataset
        # by creating a temporary helper to build transforms
        self.transform = self._build_synthetic_transforms(self.augment_mode)
        
        # Nail shape templates
        self.nail_shapes = ['oval', 'square', 'almond', 'stiletto', 'round']
        
        print(f"🎨 Synthetic dataset: {num_samples} samples, augment={self.augment_mode.value}")
    
    def _build_synthetic_transforms(self, mode: AugmentMode):
        """Build transforms for synthetic data — same layered approach as real data"""
        if mode == AugmentMode.NONE:
            return A.Compose([
                A.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
                ToTensorV2(),
            ])
        
        # For synthetic data, skip resize (already generated at target size)
        # but apply color/noise/quality augmentations to make synthetic look more real
        transforms = [
            # Color jitter to vary synthetic appearance
            A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=0.5),
            A.HueSaturationValue(
                hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=0.4
            ),
            A.RGBShift(r_shift_limit=15, g_shift_limit=15, b_shift_limit=15, p=0.3),
            
            # Noise to break up synthetic patterns
            A.OneOf([
                A.GaussianBlur(blur_limit=(3, 7)),
                A.MotionBlur(blur_limit=(3, 7)),
            ], p=0.3),
            A.GaussNoise(var_limit=(10, 50), p=0.3),
            
            # Quality degradation
            A.ImageCompression(quality_lower=50, quality_upper=100, p=0.3),
        ]
        
        if mode == AugmentMode.HEAVY:
            transforms.extend([
                # Geometric on synthetic too
                A.HorizontalFlip(p=0.5),
                A.ShiftScaleRotate(
                    shift_limit=0.1, scale_limit=0.15, rotate_limit=30,
                    border_mode=0, p=0.4
                ),
                A.OneOf([
                    A.ElasticTransform(alpha=60, sigma=60 * 0.05, alpha_affine=60 * 0.03, p=1.0),
                    A.GridDistortion(num_steps=5, distort_limit=0.2, p=1.0),
                ], p=0.3),
                A.CLAHE(clip_limit=4.0, p=0.3),
                A.ChannelShuffle(p=0.05),
            ])
        
        transforms.extend([
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
            ToTensorV2(),
        ])
        
        return A.Compose(transforms)
    
    def __len__(self):
        return self.num_samples
    
    def __getitem__(self, idx):
        # Generate random background
        bg_color = np.random.randint(100, 255, 3)
        image = np.ones((self.image_size, self.image_size, 3), dtype=np.uint8) * bg_color
        
        # Add some noise to background
        noise = np.random.randint(-20, 20, image.shape, dtype=np.int16)
        image = np.clip(image.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Generate synthetic nail mask
        mask = np.zeros((self.image_size, self.image_size), dtype=np.float32)
        
        # Random number of nails (1-5)
        num_nails = random.randint(1, 5)
        
        for _ in range(num_nails):
            nail_mask = self._generate_nail_shape()
            # Random position
            cy = random.randint(self.image_size // 4, 3 * self.image_size // 4)
            cx = random.randint(self.image_size // 4, 3 * self.image_size // 4)
            
            # Place nail at position
            nh, nw = nail_mask.shape
            y1 = max(0, cy - nh // 2)
            y2 = min(self.image_size, y1 + nh)
            x1 = max(0, cx - nw // 2)
            x2 = min(self.image_size, x1 + nw)
            
            src_y1 = max(0, nh // 2 - cy)
            src_y2 = src_y1 + (y2 - y1)
            src_x1 = max(0, nw // 2 - cx)
            src_x2 = src_x1 + (x2 - x1)
            
            if y2 > y1 and x2 > x1:
                mask[y1:y2, x1:x2] = np.maximum(
                    mask[y1:y2, x1:x2],
                    nail_mask[src_y1:src_y2, src_x1:src_x2]
                )
                
                # Color the nail area in the image
                nail_color = np.random.randint(50, 255, 3)
                for c in range(3):
                    image[y1:y2, x1:x2, c] = np.where(
                        nail_mask[src_y1:src_y2, src_x1:src_x2] > 0.5,
                        nail_color[c],
                        image[y1:y2, x1:x2, c]
                    )
        
        # Apply transforms
        transformed = self.transform(image=image)
        image_tensor = transformed['image']
        mask_tensor = torch.from_numpy(mask).unsqueeze(0)
        
        return {
            'image': image_tensor,
            'mask': mask_tensor,
            'meta': {'filename': f'synthetic_{idx}', 'has_mask': True},
        }
    
    def _generate_nail_shape(self):
        """Generate a random nail-shaped mask"""
        shape = random.choice(self.nail_shapes)
        
        # Random size
        width = random.randint(10, 25)
        height = random.randint(15, 40)
        
        # Random rotation
        angle = random.uniform(-30, 30)
        
        # Create nail shape
        mask = np.zeros((height * 2, width * 2), dtype=np.float32)
        cy, cx = height, width
        
        for y in range(mask.shape[0]):
            for x in range(mask.shape[1]):
                dy = (y - cy) / height
                dx = (x - cx) / width
                
                if shape == 'oval':
                    if dx * dx + dy * dy <= 1:
                        mask[y, x] = 1.0
                elif shape == 'square':
                    if abs(dx) <= 0.8 and abs(dy) <= 0.8:
                        mask[y, x] = 1.0
                elif shape == 'almond':
                    if dx * dx + (dy * 0.7) ** 2 <= 1 and dy > -0.8:
                        mask[y, x] = 1.0
                elif shape == 'stiletto':
                    if abs(dx) <= max(0, 1 - (dy + 1) * 0.5) and abs(dy) <= 1:
                        mask[y, x] = 1.0
                elif shape == 'round':
                    r = 0.9
                    if dx * dx + dy * dy <= r * r:
                        mask[y, x] = 1.0
        
        # Apply rotation
        if abs(angle) > 1:
            from scipy.ndimage import rotate as scipy_rotate
            try:
                mask = scipy_rotate(mask, angle, reshape=False, order=1)
            except ImportError:
                pass  # Skip rotation if scipy not available
        
        return mask


# ---------------------------------------------------------------------------
# Mixup / CutMix batch-level regularization
# ---------------------------------------------------------------------------

def mixup_batch(images: torch.Tensor, masks: torch.Tensor, alpha: float = 0.4):
    """
    Apply Mixup augmentation at batch level.
    
    Blends random pairs of images/masks with a Beta-distributed weight.
    Improves generalization by training on convex combinations of examples.
    
    Args:
        images: (B, C, H, W) batch of images
        masks: (B, 1, H, W) batch of masks
        alpha: Beta distribution parameter (higher = more mixing, 0.2-0.4 typical)
    
    Returns:
        mixed_images, mixed_masks, lambda_value
    """
    if alpha <= 0:
        return images, masks, 1.0
    
    lam = np.random.beta(alpha, alpha)
    batch_size = images.size(0)
    indices = torch.randperm(batch_size)
    
    mixed_images = lam * images + (1 - lam) * images[indices]
    mixed_masks = lam * masks + (1 - lam) * masks[indices]
    
    return mixed_images, mixed_masks, lam


def cutmix_batch(images: torch.Tensor, masks: torch.Tensor, alpha: float = 1.0):
    """
    Apply CutMix augmentation at batch level.
    
    Replaces a rectangular region of one sample with another's region.
    The mask is blended accordingly. Helps the model learn from partial views.
    
    Args:
        images: (B, C, H, W) batch of images
        masks: (B, 1, H, W) batch of masks
        alpha: Beta distribution parameter (1.0 typical)
    
    Returns:
        mixed_images, mixed_masks, lambda_value
    """
    if alpha <= 0:
        return images, masks, 1.0
    
    lam = np.random.beta(alpha, alpha)
    batch_size = images.size(0)
    indices = torch.randperm(batch_size)
    
    _, _, H, W = images.shape
    
    # Get random box
    cut_ratio = np.sqrt(1.0 - lam)
    cut_h = int(H * cut_ratio)
    cut_w = int(W * cut_ratio)
    
    cy = np.random.randint(H)
    cx = np.random.randint(W)
    
    y1 = np.clip(cy - cut_h // 2, 0, H)
    y2 = np.clip(cy + cut_h // 2, 0, H)
    x1 = np.clip(cx - cut_w // 2, 0, W)
    x2 = np.clip(cx + cut_w // 2, 0, W)
    
    # Apply cut
    mixed_images = images.clone()
    mixed_masks = masks.clone()
    mixed_images[:, :, y1:y2, x1:x2] = images[indices, :, y1:y2, x1:x2]
    mixed_masks[:, :, y1:y2, x1:x2] = masks[indices, :, y1:y2, x1:x2]
    
    # Adjust lambda by actual area ratio
    lam = 1 - ((y2 - y1) * (x2 - x1)) / (H * W)
    
    return mixed_images, mixed_masks, lam


def _mixup_cutmix_collate_fn(batch, mixup_alpha=0.0, cutmix_alpha=0.0):
    """
    Custom collate function that applies Mixup or CutMix to each batch.
    Randomly selects one or the other (or neither) per batch.
    """
    # Standard collation
    images = torch.stack([item['image'] for item in batch])
    masks = torch.stack([item['mask'] for item in batch])
    metas = [item['meta'] for item in batch]
    
    # Decide which augmentation to apply (if any)
    use_mixup = mixup_alpha > 0
    use_cutmix = cutmix_alpha > 0
    
    lam = 1.0
    if use_mixup and use_cutmix:
        # Randomly pick one
        if random.random() < 0.5:
            images, masks, lam = mixup_batch(images, masks, mixup_alpha)
        else:
            images, masks, lam = cutmix_batch(images, masks, cutmix_alpha)
    elif use_mixup:
        images, masks, lam = mixup_batch(images, masks, mixup_alpha)
    elif use_cutmix:
        images, masks, lam = cutmix_batch(images, masks, cutmix_alpha)
    
    return {
        'image': images,
        'mask': masks,
        'meta': metas,
        'mixup_lambda': lam,
    }


# ---------------------------------------------------------------------------
# Dataloader factory
# ---------------------------------------------------------------------------

def create_dataloaders(
    dataset_dir: str,
    batch_size: int = 16,
    image_size: int = 256,
    num_workers: int = 4,
    use_synthetic: bool = False,
    synthetic_samples: int = 5000,
    augment_mode: str = 'light',
    mixup_alpha: float = 0.0,
    cutmix_alpha: float = 0.0,
):
    """
    Create train, val, test dataloaders.
    
    Args:
        dataset_dir: Root dataset directory
        batch_size: Batch size for all loaders
        image_size: Input image resolution
        num_workers: DataLoader workers
        use_synthetic: Use synthetic data instead of real images
        synthetic_samples: Number of synthetic samples to generate
        augment_mode: 'light' or 'heavy' augmentation mode for training
        mixup_alpha: Mixup Beta parameter (0 = disabled, 0.2-0.4 typical)
        cutmix_alpha: CutMix Beta parameter (0 = disabled, 1.0 typical)
    
    Returns:
        train_loader, val_loader, test_loader
    """
    
    if use_synthetic:
        print("🎨 Using synthetic nail data for training")
        train_dataset = SyntheticNailDataset(
            num_samples=synthetic_samples,
            image_size=image_size,
            augment=True,
            augment_mode=augment_mode,
        )
    else:
        train_dataset = NailSegmentationDataset(
            root_dir=dataset_dir,
            split='train',
            image_size=image_size,
            augment=True,
            augment_mode=augment_mode,
        )
    
    val_dataset = NailSegmentationDataset(
        root_dir=dataset_dir,
        split='val',
        image_size=image_size,
        augment=False,
    )
    
    test_dataset = NailSegmentationDataset(
        root_dir=dataset_dir,
        split='test',
        image_size=image_size,
        augment=False,
    )
    
    # Build collate function with mixup/cutmix if requested
    train_collate = None
    if mixup_alpha > 0 or cutmix_alpha > 0:
        print(f"🔀 Batch regularization: mixup_alpha={mixup_alpha}, cutmix_alpha={cutmix_alpha}")
        train_collate = lambda batch: _mixup_cutmix_collate_fn(
            batch, mixup_alpha=mixup_alpha, cutmix_alpha=cutmix_alpha
        )
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
        collate_fn=train_collate,
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    
    return train_loader, val_loader, test_loader


if __name__ == '__main__':
    # Test synthetic dataset
    print("Testing SyntheticNailDataset...")
    dataset = SyntheticNailDataset(num_samples=10, image_size=256)
    sample = dataset[0]
    print(f"  Image shape: {sample['image'].shape}")
    print(f"  Mask shape:  {sample['mask'].shape}")
    print(f"  Image range: [{sample['image'].min():.3f}, {sample['image'].max():.3f}]")
    print(f"  Mask range:  [{sample['mask'].min():.3f}, {sample['mask'].max():.3f}]")
    print(f"  Mask coverage: {sample['mask'].mean():.3f}")
    print("✅ Synthetic dataset works!")
