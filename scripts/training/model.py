"""
Lightweight U-Net for Nail Segmentation
Optimized for ONNX web export (<5MB)

Architecture:
- Encoder: 4 downsampling blocks with depthwise separable convolutions
- Bottleneck: 2 conv layers
- Decoder: 4 upsampling blocks with skip connections
- Output: Sigmoid activation for binary mask

Input:  [B, 3, 256, 256]  (RGB image)
Output: [B, 1, 256, 256]  (Nail segmentation mask)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class DepthwiseSeparableConv(nn.Module):
    """Depthwise separable convolution for reduced parameter count"""
    
    def __init__(self, in_channels, out_channels, kernel_size=3, padding=1, stride=1):
        super().__init__()
        self.depthwise = nn.Conv2d(
            in_channels, in_channels, kernel_size=kernel_size,
            padding=padding, stride=stride, groups=in_channels, bias=False
        )
        self.pointwise = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)
    
    def forward(self, x):
        x = self.depthwise(x)
        x = self.pointwise(x)
        x = self.bn(x)
        x = self.relu(x)
        return x


class EncoderBlock(nn.Module):
    """Encoder block: 2x DepthwiseSeparableConv + MaxPool"""
    
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv1 = DepthwiseSeparableConv(in_channels, out_channels)
        self.conv2 = DepthwiseSeparableConv(out_channels, out_channels)
        self.pool = nn.MaxPool2d(2)
    
    def forward(self, x):
        skip = self.conv1(x)
        skip = self.conv2(skip)
        pooled = self.pool(skip)
        return pooled, skip


class DecoderBlock(nn.Module):
    """Decoder block: Upsample + Concat skip + 2x DepthwiseSeparableConv"""
    
    def __init__(self, in_channels, skip_channels, out_channels):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
        self.conv1 = DepthwiseSeparableConv(in_channels // 2 + skip_channels, out_channels)
        self.conv2 = DepthwiseSeparableConv(out_channels, out_channels)
    
    def forward(self, x, skip):
        x = self.up(x)
        
        # Handle size mismatch
        if x.shape != skip.shape:
            x = F.interpolate(x, size=skip.shape[2:], mode='bilinear', align_corners=False)
        
        x = torch.cat([x, skip], dim=1)
        x = self.conv1(x)
        x = self.conv2(x)
        return x


class NailSegmentationUNet(nn.Module):
    """
    Lightweight U-Net for nail segmentation.
    
    Target: <5MB ONNX export for web inference
    Input:  [B, 3, 256, 256]
    Output: [B, 1, 256, 256]
    """
    
    def __init__(self, in_channels=3, out_channels=1, features=[16, 32, 64, 128]):
        super().__init__()
        
        # Encoder
        self.enc1 = EncoderBlock(in_channels, features[0])   # 256 -> 128
        self.enc2 = EncoderBlock(features[0], features[1])     # 128 -> 64
        self.enc3 = EncoderBlock(features[1], features[2])     # 64 -> 32
        self.enc4 = EncoderBlock(features[2], features[3])     # 32 -> 16
        
        # Bottleneck
        self.bottleneck = nn.Sequential(
            DepthwiseSeparableConv(features[3], features[3] * 2),
            DepthwiseSeparableConv(features[3] * 2, features[3] * 2),
        )
        
        # Decoder
        self.dec4 = DecoderBlock(features[3] * 2, features[3], features[3])   # 16 -> 32
        self.dec3 = DecoderBlock(features[3], features[2], features[2])       # 32 -> 64
        self.dec2 = DecoderBlock(features[2], features[1], features[1])       # 64 -> 128
        self.dec1 = DecoderBlock(features[1], features[0], features[0])       # 128 -> 256
        
        # Output
        self.output_conv = nn.Conv2d(features[0], out_channels, kernel_size=1)
    
    def forward(self, x):
        # Encoder
        x, skip1 = self.enc1(x)
        x, skip2 = self.enc2(x)
        x, skip3 = self.enc3(x)
        x, skip4 = self.enc4(x)
        
        # Bottleneck
        x = self.bottleneck(x)
        
        # Decoder
        x = self.dec4(x, skip4)
        x = self.dec3(x, skip3)
        x = self.dec2(x, skip2)
        x = self.dec1(x, skip1)
        
        # Output
        x = self.output_conv(x)
        x = torch.sigmoid(x)
        
        return x


class NailSegmentationLoss(nn.Module):
    """
    Combined loss: Binary Cross-Entropy + Dice Loss
    Better for segmentation tasks with class imbalance
    """
    
    def __init__(self, bce_weight=0.5, dice_weight=0.5):
        super().__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        self.bce = nn.BCELoss()
    
    def dice_loss(self, pred, target, smooth=1.0):
        pred_flat = pred.view(-1)
        target_flat = target.view(-1)
        
        intersection = (pred_flat * target_flat).sum()
        dice = (2. * intersection + smooth) / (pred_flat.sum() + target_flat.sum() + smooth)
        
        return 1 - dice
    
    def forward(self, pred, target):
        bce = self.bce(pred, target)
        dice = self.dice_loss(pred, target)
        
        return self.bce_weight * bce + self.dice_weight * dice


def count_parameters(model):
    """Count total and trainable parameters"""
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total, trainable


def estimate_model_size(model):
    """Estimate ONNX model size in MB"""
    total_params = sum(p.numel() for p in model.parameters())
    # Each param is float32 = 4 bytes, plus ~10% overhead for ONNX structure
    return (total_params * 4 * 1.1) / (1024 * 1024)


if __name__ == '__main__':
    # Test the model
    model = NailSegmentationUNet()
    
    total, trainable = count_parameters(model)
    estimated_size = estimate_model_size(model)
    
    print(f"NailSegmentationUNet Architecture")
    print(f"=" * 50)
    print(f"Total parameters:     {total:,}")
    print(f"Trainable parameters: {trainable:,}")
    print(f"Estimated ONNX size:  {estimated_size:.2f} MB")
    print()
    
    # Test forward pass
    x = torch.randn(1, 3, 256, 256)
    with torch.no_grad():
        output = model(x)
    
    print(f"Input shape:  {x.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Output range: [{output.min():.4f}, {output.max():.4f}]")
    
    # Verify it's under 5MB
    assert estimated_size < 5.0, f"Model too large: {estimated_size:.2f}MB > 5MB"
    print(f"\n✅ Model passes size constraint (<5MB)")
