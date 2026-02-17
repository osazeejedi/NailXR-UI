# NailXR Model Training Pipeline

## Overview

Train a lightweight U-Net nail segmentation model from Reddit-scraped nail art images, then export to ONNX for web inference.

## Quick Start

### 1. Setup Python Environment

```bash
cd scripts/training
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 2. Scrape Images from Reddit

```bash
# Full scrape (all subreddits, may take a while)
npx tsx scripts/scraper/run.ts

# Quick test scrape (2 subs, max 50 images each)
npx tsx scripts/scraper/run.ts -s NailArt,Nails -m 50
```

### 3. Build Dataset

```bash
npx tsx scripts/dataset/run.ts
```

### 4. Train Model

```bash
# Option A: Train with synthetic data (no dataset needed, good for testing)
python scripts/training/train.py --synthetic --epochs 50

# Option B: Train with scraped dataset
python scripts/training/train.py --dataset ./data/dataset --epochs 100

# Option C: Full training with custom settings
python scripts/training/train.py --dataset ./data/dataset --epochs 200 --lr 0.0001 --batch-size 32
```

### 5. Export to ONNX

```bash
python scripts/training/export_onnx.py \
  --checkpoint checkpoints/<run_name>/best_model.pth \
  --output public/models/nail_segmentation.onnx
```

## Model Architecture

**NailSegmentationUNet** - Lightweight U-Net with depthwise separable convolutions

| Property | Value |
|----------|-------|
| Input | [1, 3, 256, 256] RGB |
| Output | [1, 1, 256, 256] Binary mask |
| Parameters | ~300K |
| ONNX Size | ~1.5 MB |
| Target FPS | 15+ (WebGL) |

## Training Strategies

### Strategy 1: Synthetic Data Bootstrap
Start with synthetic geometric nail shapes to get a working model fast:
```bash
python scripts/training/train.py --synthetic --synthetic-samples 10000 --epochs 50
```

### Strategy 2: Transfer Learning
Fine-tune on real scraped data:
```bash
python scripts/training/train.py --dataset ./data/dataset --resume checkpoints/<synthetic_run>/best_model.pth --epochs 100 --lr 0.0001
```

### Strategy 3: Full Pipeline
1. Scrape → 2. Build dataset → 3. Train synthetic → 4. Fine-tune on real data → 5. Export ONNX

## Apple Silicon (MPS) Support

The training script auto-detects Apple Silicon and uses MPS acceleration:
```
🍎 Using Apple Silicon GPU (MPS)
```

## Loss Function

Combined **BCE + Dice Loss** for better segmentation with class imbalance:
- Binary Cross-Entropy handles per-pixel classification
- Dice Loss maximizes overlap between prediction and ground truth

## Metrics

| Metric | Description |
|--------|-------------|
| IoU | Intersection over Union (primary) |
| Dice | Dice coefficient (F1 for segmentation) |
| Accuracy | Pixel-level accuracy |
| Precision | True positives / predicted positives |
| Recall | True positives / actual positives |

## Directory Structure

```
scripts/training/
├── model.py           # U-Net architecture
├── dataset.py         # PyTorch datasets (real + synthetic)
├── train.py           # Training script
├── export_onnx.py     # ONNX export
├── requirements.txt   # Python dependencies
└── README.md          # This file

data/
├── scraped/           # Raw scraped images + metadata
└── dataset/           # Prepared training dataset

checkpoints/           # Training checkpoints
public/models/         # Exported ONNX models
```
