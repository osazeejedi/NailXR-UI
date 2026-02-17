"""
Export trained nail segmentation model to ONNX format for web deployment

Usage:
    python scripts/training/export_onnx.py --checkpoint checkpoints/nail_seg_xxx/best_model.pth
    python scripts/training/export_onnx.py --checkpoint checkpoints/nail_seg_xxx/best_model.pth --output public/models/nail_segmentation.onnx
    python scripts/training/export_onnx.py --checkpoint checkpoints/nail_seg_xxx/best_model.pth --quantize
"""

import argparse
import sys
import os
from pathlib import Path

import torch
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from model import NailSegmentationUNet, count_parameters, estimate_model_size


def parse_args():
    parser = argparse.ArgumentParser(
        description='Export & optimize nail segmentation model to ONNX for web deployment',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Basic export
    python export_onnx.py --checkpoint checkpoints/best_model.pth
    
    # Export with graph optimization
    python export_onnx.py --checkpoint checkpoints/best_model.pth --optimize
    
    # Export with dynamic quantization
    python export_onnx.py --checkpoint checkpoints/best_model.pth --quantize
    
    # Export with static INT8 quantization (best for WebGL)
    python export_onnx.py --checkpoint checkpoints/best_model.pth --static-quantize
    
    # Full pipeline: optimize + quantize + compare + deploy
    python export_onnx.py --checkpoint checkpoints/best_model.pth --optimize --quantize --compare --deploy
        """
    )
    
    # Model
    parser.add_argument('--checkpoint', type=str, required=True,
                        help='Path to trained model checkpoint (.pth)')
    parser.add_argument('--output', type=str, default='public/models/nail_segmentation.onnx',
                        help='Output ONNX file path')
    parser.add_argument('--image-size', type=int, default=256,
                        help='Input image size')
    parser.add_argument('--features', type=int, nargs='+', default=[16, 32, 64, 128],
                        help='Feature channels (must match training)')
    parser.add_argument('--opset-version', type=int, default=13,
                        help='ONNX opset version (13+ for ONNX Runtime Web)')
    
    # Optimization
    parser.add_argument('--optimize', action='store_true',
                        help='Apply graph-level optimizations (constant folding, operator fusion)')
    
    # Quantization
    parser.add_argument('--quantize', action='store_true',
                        help='Apply dynamic INT8 quantization for smaller model')
    parser.add_argument('--static-quantize', action='store_true',
                        help='Apply static INT8 quantization with calibration (best for WebGL)')
    parser.add_argument('--calibration-dir', type=str, default=None,
                        help='Directory with calibration images for static quantization')
    parser.add_argument('--calibration-samples', type=int, default=100,
                        help='Number of calibration samples (default: 100)')
    
    # Verification & benchmarking
    parser.add_argument('--verify', action='store_true', default=True,
                        help='Verify ONNX model after export')
    parser.add_argument('--compare', action='store_true',
                        help='Run comparison benchmark (float32 vs optimized/quantized)')
    
    # Deployment
    parser.add_argument('--deploy', action='store_true',
                        help='Copy final model to public/models/ for web deployment')
    parser.add_argument('--deploy-dir', type=str, default='public/models',
                        help='Deployment directory (default: public/models)')
    
    return parser.parse_args()


def export_to_onnx(model, output_path, image_size=256, opset_version=13):
    """Export PyTorch model to ONNX format"""
    model.eval()
    
    # Create dummy input
    dummy_input = torch.randn(1, 3, image_size, image_size)
    
    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Export
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=opset_version,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'},
        },
    )
    
    print(f"✅ Model exported to: {output_path}")
    
    # Print file size
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"📦 ONNX file size: {file_size:.2f} MB")
    
    return file_size


def verify_onnx(onnx_path, image_size=256):
    """Verify the exported ONNX model"""
    try:
        import onnx
        import onnxruntime as ort
    except ImportError:
        print("⚠️ onnx/onnxruntime not installed. Skipping verification.")
        return True
    
    # Check model structure
    print("\n🔍 Verifying ONNX model...")
    model = onnx.load(onnx_path)
    onnx.checker.check_model(model)
    print("  ✅ Model structure valid")
    
    # Print model info
    print(f"  📊 IR version: {model.ir_version}")
    print(f"  📊 Opset version: {model.opset_import[0].version}")
    
    for input_tensor in model.graph.input:
        shape = [d.dim_value for d in input_tensor.type.tensor_type.shape.dim]
        print(f"  📥 Input: {input_tensor.name} shape={shape}")
    
    for output_tensor in model.graph.output:
        shape = [d.dim_value for d in output_tensor.type.tensor_type.shape.dim]
        print(f"  📤 Output: {output_tensor.name} shape={shape}")
    
    # Run inference test
    print("\n🧪 Running inference test...")
    session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
    
    dummy_input = np.random.randn(1, 3, image_size, image_size).astype(np.float32)
    outputs = session.run(None, {'input': dummy_input})
    
    output = outputs[0]
    print(f"  📊 Output shape: {output.shape}")
    print(f"  📊 Output range: [{output.min():.4f}, {output.max():.4f}]")
    print(f"  📊 Output mean: {output.mean():.4f}")
    
    # Verify output is valid sigmoid (0-1 range)
    assert output.min() >= 0 and output.max() <= 1, "Output not in [0,1] range!"
    assert output.shape == (1, 1, image_size, image_size), f"Unexpected output shape: {output.shape}"
    
    print("  ✅ Inference test passed!")
    
    # Benchmark
    import time
    num_runs = 50
    start = time.time()
    for _ in range(num_runs):
        session.run(None, {'input': dummy_input})
    elapsed = time.time() - start
    avg_time = (elapsed / num_runs) * 1000
    
    print(f"\n⚡ Performance Benchmark (CPU):")
    print(f"  Average inference time: {avg_time:.1f} ms")
    print(f"  FPS: {1000/avg_time:.1f}")
    
    return True


def quantize_model(input_path, output_path):
    """Apply dynamic quantization to reduce model size"""
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        print("⚠️ onnxruntime quantization not available. Skipping.")
        return False
    
    print("\n🔧 Applying dynamic quantization...")
    quantize_dynamic(
        input_path,
        output_path,
        weight_type=QuantType.QUInt8,
    )
    
    original_size = os.path.getsize(input_path) / (1024 * 1024)
    quantized_size = os.path.getsize(output_path) / (1024 * 1024)
    reduction = (1 - quantized_size / original_size) * 100
    
    print(f"  Original size: {original_size:.2f} MB")
    print(f"  Quantized size: {quantized_size:.2f} MB")
    print(f"  Size reduction: {reduction:.1f}%")
    
    return True


def optimize_graph(input_path, output_path):
    """
    Apply graph-level optimizations to ONNX model.
    
    Performs: constant folding, operator fusion, redundant node elimination,
    and shape inference. Results in faster inference with no accuracy loss.
    """
    print("\n⚡ Applying graph optimizations...")
    
    # Try onnxruntime optimizer first (better fusion support)
    try:
        import onnxruntime as ort
        
        # Use ORT's built-in graph optimization
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.optimized_model_filepath = output_path
        
        # Creating session triggers optimization and saves to file
        ort.InferenceSession(input_path, sess_options, providers=['CPUExecutionProvider'])
        
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        optimized_size = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"  ✅ Graph optimization complete (ORT)")
        print(f"  Original:  {original_size:.2f} MB")
        print(f"  Optimized: {optimized_size:.2f} MB")
        print(f"  Delta:     {(optimized_size - original_size):+.2f} MB")
        return True
        
    except Exception as e:
        print(f"  ⚠️ ORT optimizer failed: {e}")
    
    # Fallback to onnxoptimizer
    try:
        import onnx
        import onnxoptimizer
        
        model = onnx.load(input_path)
        
        passes = [
            'eliminate_deadend',
            'eliminate_identity',
            'eliminate_nop_dropout',
            'eliminate_nop_monotone_argmax',
            'eliminate_nop_pad',
            'eliminate_nop_transpose',
            'eliminate_unused_initializer',
            'extract_constant_to_initializer',
            'fuse_add_bias_into_conv',
            'fuse_bn_into_conv',
            'fuse_consecutive_concats',
            'fuse_consecutive_squeezes',
            'fuse_consecutive_transposes',
            'fuse_matmul_add_bias_into_gemm',
            'fuse_pad_into_conv',
            'nop',
        ]
        
        optimized_model = onnxoptimizer.optimize(model, passes)
        onnx.save(optimized_model, output_path)
        
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        optimized_size = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"  ✅ Graph optimization complete (onnxoptimizer)")
        print(f"  Original:  {original_size:.2f} MB")
        print(f"  Optimized: {optimized_size:.2f} MB")
        return True
        
    except ImportError:
        print("  ⚠️ Neither onnxruntime optimizer nor onnxoptimizer available.")
        print("  Install: pip install onnxoptimizer")
        # Copy original as fallback
        import shutil
        shutil.copy2(input_path, output_path)
        return False


class CalibrationDataReader:
    """
    Provides calibration data for static INT8 quantization.
    
    Generates data from either:
    - A directory of real images (--calibration-dir)
    - Synthetic random data (fallback)
    """
    
    def __init__(self, image_size=256, calibration_dir=None, num_samples=100):
        self.image_size = image_size
        self.num_samples = num_samples
        self.current = 0
        self.data = []
        
        if calibration_dir and os.path.isdir(calibration_dir):
            self._load_from_directory(calibration_dir)
        else:
            self._generate_synthetic()
    
    def _load_from_directory(self, directory):
        """Load real images for calibration"""
        from PIL import Image as PILImage
        
        img_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        image_files = sorted([
            os.path.join(directory, f) for f in os.listdir(directory)
            if os.path.splitext(f)[1].lower() in img_extensions
        ])[:self.num_samples]
        
        mean = np.array([0.485, 0.456, 0.406]).reshape(1, 3, 1, 1).astype(np.float32)
        std = np.array([0.229, 0.224, 0.225]).reshape(1, 3, 1, 1).astype(np.float32)
        
        for img_path in image_files:
            try:
                img = PILImage.open(img_path).convert('RGB')
                img = img.resize((self.image_size, self.image_size))
                arr = np.array(img).astype(np.float32) / 255.0
                arr = arr.transpose(2, 0, 1)[np.newaxis, ...]  # (1, 3, H, W)
                arr = (arr - mean) / std
                self.data.append({'input': arr})
            except Exception:
                continue
        
        print(f"  📁 Loaded {len(self.data)} calibration images from {directory}")
    
    def _generate_synthetic(self):
        """Generate synthetic calibration data"""
        mean = np.array([0.485, 0.456, 0.406]).reshape(1, 3, 1, 1).astype(np.float32)
        std = np.array([0.229, 0.224, 0.225]).reshape(1, 3, 1, 1).astype(np.float32)
        
        for _ in range(self.num_samples):
            # Random image normalized to ImageNet stats
            arr = np.random.rand(1, 3, self.image_size, self.image_size).astype(np.float32)
            arr = (arr - mean) / std
            self.data.append({'input': arr})
        
        print(f"  🎲 Generated {len(self.data)} synthetic calibration samples")
    
    def get_next(self):
        """Iterator interface for onnxruntime quantization"""
        if self.current >= len(self.data):
            return None
        result = self.data[self.current]
        self.current += 1
        return result
    
    def rewind(self):
        self.current = 0


def static_quantize_model(input_path, output_path, image_size=256,
                          calibration_dir=None, calibration_samples=100):
    """
    Apply static INT8 quantization with calibration data.
    
    Static quantization is significantly better than dynamic for WebGL/WebGPU
    inference because it pre-computes activation scales, reducing runtime overhead.
    """
    try:
        from onnxruntime.quantization import (
            quantize_static, QuantType, QuantFormat,
            CalibrationMethod
        )
    except ImportError:
        print("⚠️ onnxruntime quantization not available. Skipping static quantization.")
        return False
    
    print("\n🔧 Applying static INT8 quantization...")
    
    # Create calibration data reader
    calibration_reader = CalibrationDataReader(
        image_size=image_size,
        calibration_dir=calibration_dir,
        num_samples=calibration_samples,
    )
    
    # Pre-process model for quantization (required for static quant)
    try:
        from onnxruntime.quantization import preprocess as quant_preprocess
        preprocessed_path = input_path.replace('.onnx', '_preprocessed.onnx')
        quant_preprocess.quant_pre_process(
            input_model_path=input_path,
            output_model_path=preprocessed_path,
        )
        quant_input = preprocessed_path
    except Exception:
        quant_input = input_path
    
    try:
        quantize_static(
            model_input=quant_input,
            model_output=output_path,
            calibration_data_reader=calibration_reader,
            quant_format=QuantFormat.QDQ,
            weight_type=QuantType.QInt8,
            activation_type=QuantType.QUInt8,
            calibrate_method=CalibrationMethod.MinMax,
            extra_options={
                'WeightSymmetric': True,
                'ActivationSymmetric': False,
            },
        )
    except Exception as e:
        print(f"  ⚠️ QDQ format failed ({e}), trying QOperator format...")
        calibration_reader.rewind()
        quantize_static(
            model_input=quant_input,
            model_output=output_path,
            calibration_data_reader=calibration_reader,
            quant_format=QuantFormat.QOperator,
            weight_type=QuantType.QUInt8,
        )
    
    # Cleanup preprocessed file
    preprocessed_path = input_path.replace('.onnx', '_preprocessed.onnx')
    if os.path.exists(preprocessed_path):
        os.remove(preprocessed_path)
    
    original_size = os.path.getsize(input_path) / (1024 * 1024)
    quantized_size = os.path.getsize(output_path) / (1024 * 1024)
    reduction = (1 - quantized_size / original_size) * 100
    
    print(f"  ✅ Static quantization complete")
    print(f"  Original size:  {original_size:.2f} MB")
    print(f"  Quantized size: {quantized_size:.2f} MB")
    print(f"  Size reduction: {reduction:.1f}%")
    
    return True


def compare_models(model_paths, image_size=256, num_runs=100):
    """
    Benchmark and compare multiple ONNX model variants.
    
    Compares: file size, inference speed, and output similarity (cosine + MSE).
    """
    try:
        import onnxruntime as ort
    except ImportError:
        print("⚠️ onnxruntime not available for comparison.")
        return
    
    import time
    
    print("\n" + "=" * 60)
    print("📊 MODEL COMPARISON REPORT")
    print("=" * 60)
    
    # Shared test input
    test_input = np.random.randn(1, 3, image_size, image_size).astype(np.float32)
    reference_output = None
    
    results = []
    
    for name, path in model_paths.items():
        if not os.path.exists(path):
            continue
        
        file_size = os.path.getsize(path) / (1024 * 1024)
        
        try:
            session = ort.InferenceSession(path, providers=['CPUExecutionProvider'])
            
            # Warmup
            for _ in range(5):
                session.run(None, {'input': test_input})
            
            # Benchmark
            start = time.time()
            for _ in range(num_runs):
                outputs = session.run(None, {'input': test_input})
            elapsed = time.time() - start
            avg_ms = (elapsed / num_runs) * 1000
            fps = 1000 / avg_ms
            
            output = outputs[0]
            
            # Compute similarity to reference (float32)
            similarity = "—"
            mse = "—"
            if reference_output is None:
                reference_output = output
                similarity = "reference"
                mse = "reference"
            else:
                # Cosine similarity
                ref_flat = reference_output.flatten()
                out_flat = output.flatten()
                cos_sim = np.dot(ref_flat, out_flat) / (
                    np.linalg.norm(ref_flat) * np.linalg.norm(out_flat) + 1e-8
                )
                similarity = f"{cos_sim:.6f}"
                
                # MSE
                mse_val = np.mean((reference_output - output) ** 2)
                mse = f"{mse_val:.8f}"
            
            results.append({
                'name': name,
                'size_mb': file_size,
                'avg_ms': avg_ms,
                'fps': fps,
                'similarity': similarity,
                'mse': mse,
            })
            
        except Exception as e:
            results.append({
                'name': name,
                'size_mb': file_size,
                'avg_ms': -1,
                'fps': -1,
                'similarity': f"error: {e}",
                'mse': "—",
            })
    
    # Print table
    print(f"\n{'Model':<25} {'Size (MB)':<12} {'Avg (ms)':<12} {'FPS':<10} {'Cos Sim':<15} {'MSE':<15}")
    print("-" * 89)
    
    for r in results:
        fps_str = f"{r['fps']:.1f}" if r['fps'] > 0 else "error"
        ms_str = f"{r['avg_ms']:.1f}" if r['avg_ms'] > 0 else "error"
        print(f"{r['name']:<25} {r['size_mb']:<12.2f} {ms_str:<12} {fps_str:<10} {r['similarity']:<15} {r['mse']:<15}")
    
    # Summary
    if len(results) >= 2 and results[0]['avg_ms'] > 0 and results[-1]['avg_ms'] > 0:
        speedup = results[0]['avg_ms'] / results[-1]['avg_ms']
        size_reduction = (1 - results[-1]['size_mb'] / results[0]['size_mb']) * 100
        print(f"\n📈 Best variant vs float32:")
        print(f"  Speed: {speedup:.2f}x {'faster' if speedup > 1 else 'slower'}")
        print(f"  Size:  {size_reduction:.1f}% {'smaller' if size_reduction > 0 else 'larger'}")
    
    print("=" * 60)


def deploy_model(model_path, deploy_dir, image_size, config=None):
    """Copy optimized model and config to deployment directory"""
    import shutil
    
    os.makedirs(deploy_dir, exist_ok=True)
    
    # Determine destination filename
    dest_name = 'nail_segmentation.onnx'
    dest_path = os.path.join(deploy_dir, dest_name)
    
    shutil.copy2(model_path, dest_path)
    print(f"\n🚀 Deployed model to: {dest_path}")
    
    # Also generate/copy config
    file_size = os.path.getsize(dest_path) / (1024 * 1024)
    generate_model_config(dest_path, image_size, file_size)
    
    print(f"  📦 Model size: {file_size:.2f} MB")
    return dest_path


def generate_model_config(output_path, image_size, file_size):
    """Generate a TypeScript config file for the web frontend"""
    config_path = output_path.replace('.onnx', '_config.json')
    
    config = {
        "modelPath": f"/{os.path.relpath(output_path, 'public')}",
        "inputShape": [1, 3, image_size, image_size],
        "outputShape": [1, 1, image_size, image_size],
        "inputName": "input",
        "outputName": "output",
        "imageSize": image_size,
        "fileSizeMB": round(file_size, 2),
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225],
        },
        "threshold": 0.5,
        "description": "NailXR Nail Segmentation U-Net - lightweight model for web inference",
    }
    
    import json
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n📋 Model config saved to: {config_path}")
    return config


def main():
    args = parse_args()
    
    print("🚀 NailXR ONNX Export & Optimization Tool")
    print("=" * 60)
    
    # Show pipeline
    pipeline_steps = ['export']
    if args.optimize:
        pipeline_steps.append('optimize')
    if args.quantize:
        pipeline_steps.append('dynamic-quantize')
    if args.static_quantize:
        pipeline_steps.append('static-quantize')
    if args.compare:
        pipeline_steps.append('compare')
    if args.deploy:
        pipeline_steps.append('deploy')
    print(f"  Pipeline: {' → '.join(pipeline_steps)}")
    
    # Load model
    print(f"\n📦 Loading checkpoint: {args.checkpoint}")
    
    model = NailSegmentationUNet(
        in_channels=3,
        out_channels=1,
        features=args.features,
    )
    
    checkpoint = torch.load(args.checkpoint, map_location='cpu')
    model.load_state_dict(checkpoint['model_state_dict'])
    
    total_params, _ = count_parameters(model)
    print(f"  Parameters: {total_params:,}")
    
    if 'metrics' in checkpoint:
        print(f"  Training metrics: {checkpoint['metrics']}")
    
    # ---- Step 1: Export to ONNX ----
    print(f"\n📤 [1/N] Exporting to ONNX (opset v{args.opset_version})...")
    file_size = export_to_onnx(
        model, args.output, args.image_size, args.opset_version
    )
    
    # Track all model variants for comparison
    model_variants = {'float32': args.output}
    current_best = args.output
    
    # ---- Step 2: Graph optimization ----
    if args.optimize:
        optimized_path = args.output.replace('.onnx', '_optimized.onnx')
        print(f"\n⚡ [2/N] Graph optimization...")
        if optimize_graph(args.output, optimized_path):
            model_variants['optimized'] = optimized_path
            current_best = optimized_path
    
    # ---- Step 3: Dynamic quantization ----
    if args.quantize:
        # Always quantize from the raw ONNX export (not ORT-optimized, which may
        # contain hardware-specific nodes like reorder_token that break quantization)
        source = args.output
        quantized_path = args.output.replace('.onnx', '_quantized.onnx')
        print(f"\n🔧 [3/N] Dynamic quantization...")
        if quantize_model(source, quantized_path):
            model_variants['dynamic-int8'] = quantized_path
            current_best = quantized_path
    
    # ---- Step 4: Static quantization ----
    if args.static_quantize:
        # Quantize from optimized (or raw) float32 model — not from dynamic quantized
        source = model_variants.get('optimized', args.output)
        static_path = args.output.replace('.onnx', '_static_int8.onnx')
        print(f"\n🔧 [4/N] Static INT8 quantization...")
        if static_quantize_model(
            source, static_path,
            image_size=args.image_size,
            calibration_dir=args.calibration_dir,
            calibration_samples=args.calibration_samples,
        ):
            model_variants['static-int8'] = static_path
            current_best = static_path
    
    # ---- Step 5: Verify ----
    if args.verify:
        print(f"\n🔍 Verifying primary model...")
        verify_onnx(args.output, args.image_size)
    
    # ---- Step 6: Comparison benchmark ----
    if args.compare and len(model_variants) > 1:
        compare_models(model_variants, args.image_size)
    
    # ---- Step 7: Generate frontend config ----
    final_size = os.path.getsize(current_best) / (1024 * 1024)
    generate_model_config(args.output, args.image_size, file_size)
    
    # ---- Step 8: Deploy ----
    if args.deploy:
        print(f"\n🚀 Deploying best model to {args.deploy_dir}...")
        deploy_model(current_best, args.deploy_dir, args.image_size)
    
    # ---- Summary ----
    print(f"\n{'='*60}")
    print("✅ Export complete!")
    print(f"\n📁 Generated files:")
    for name, path in model_variants.items():
        if os.path.exists(path):
            size = os.path.getsize(path) / (1024 * 1024)
            marker = " ⭐ (best)" if path == current_best else ""
            print(f"  {name:<20} {path:<50} {size:.2f} MB{marker}")
    
    print(f"\n🌐 To use in NailXR frontend:")
    print(f"  1. Model file: {current_best}")
    print(f"  2. Update src/ai/inference/ONNXEngine.ts with the model path")
    print(f"  3. The model expects {args.image_size}x{args.image_size} RGB input")
    print(f"  4. Output is a {args.image_size}x{args.image_size} segmentation mask")
    
    if args.deploy:
        print(f"  5. ✅ Model auto-deployed to {args.deploy_dir}/")


if __name__ == '__main__':
    main()
