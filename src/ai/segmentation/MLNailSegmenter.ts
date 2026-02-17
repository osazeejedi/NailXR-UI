/**
 * ML-Based Nail Segmentation using trained ONNX model
 * Replaces geometric detection with pixel-level segmentation
 */

import { ONNXEngine, ModelManager, type InferenceResult, type ModelConfig } from '../inference/ONNXEngine'
import type { NailRegion } from '../nail-detection/NailDetector'

export interface SegmentationResult {
  mask: Float32Array
  width: number
  height: number
  nailRegions: NailRegion[]
  inferenceTime: number
  confidence: number
}

interface ModelNormalization {
  mean: [number, number, number]
  std: [number, number, number]
}

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  modelPath: '/models/nail_segmentation.onnx',
  inputShape: [1, 3, 256, 256],
  outputShape: [1, 1, 256, 256],
  inputName: 'input',
  outputName: 'output',
}

const IMAGENET_NORMALIZATION: ModelNormalization = {
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
}

export class MLNailSegmenter {
  private engine: ONNXEngine | null = null
  private config: ModelConfig
  private normalization: ModelNormalization
  private isReady = false
  private initPromise: Promise<void> | null = null

  // Preprocessing canvas (reused)
  private preprocessCanvas: HTMLCanvasElement | null = null
  private preprocessCtx: CanvasRenderingContext2D | null = null

  constructor(config?: Partial<ModelConfig>) {
    this.config = { ...DEFAULT_MODEL_CONFIG, ...config }
    this.normalization = IMAGENET_NORMALIZATION
  }

  /**
   * Initialize the ML model (lazy loaded)
   */
  async initialize(): Promise<void> {
    if (this.isReady) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        console.log('🧠 Loading nail segmentation model...')
        this.engine = await ModelManager.getEngine(this.config)
        this.isReady = true
        console.log('✅ Nail segmentation model loaded')
      } catch (err) {
        console.error('❌ Failed to load nail segmentation model:', err)
        this.isReady = false
        throw err
      }
    })()

    return this.initPromise
  }

  /**
   * Run segmentation on a video frame or image
   */
  async segment(
    source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    threshold: number = 0.5
  ): Promise<SegmentationResult> {
    if (!this.isReady || !this.engine) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    const startTime = performance.now()

    // Get source dimensions
    const srcWidth = source instanceof HTMLVideoElement ? source.videoWidth :
                     source instanceof HTMLImageElement ? source.naturalWidth : source.width
    const srcHeight = source instanceof HTMLVideoElement ? source.videoHeight :
                      source instanceof HTMLImageElement ? source.naturalHeight : source.height

    // Preprocess: resize + normalize
    const inputData = this.preprocess(source, srcWidth, srcHeight)

    // Run inference
    const result = await this.engine.runInference(inputData)

    // Post-process: threshold + extract regions
    const mask = this.postprocess(result.segmentationMask, threshold)
    const nailRegions = this.extractNailRegions(mask, result.width, result.height, srcWidth, srcHeight)

    // Calculate overall confidence
    const confidence = this.calculateConfidence(result.segmentationMask)

    const inferenceTime = performance.now() - startTime

    return {
      mask,
      width: result.width,
      height: result.height,
      nailRegions,
      inferenceTime,
      confidence,
    }
  }

  /**
   * Preprocess image for model input
   * Resizes to model input size and applies ImageNet normalization
   */
  private preprocess(
    source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    srcWidth: number,
    srcHeight: number
  ): Float32Array {
    const [, channels, height, width] = this.config.inputShape

    // Create/reuse preprocessing canvas
    if (!this.preprocessCanvas) {
      this.preprocessCanvas = document.createElement('canvas')
      this.preprocessCtx = this.preprocessCanvas.getContext('2d', { willReadFrequently: true })
    }

    this.preprocessCanvas.width = width
    this.preprocessCanvas.height = height

    if (!this.preprocessCtx) throw new Error('Failed to get canvas context')

    // Draw and resize
    this.preprocessCtx.drawImage(source, 0, 0, width, height)
    const imageData = this.preprocessCtx.getImageData(0, 0, width, height)
    const pixels = imageData.data

    // Convert to CHW format with ImageNet normalization
    const inputData = new Float32Array(channels * height * width)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIdx = (y * width + x) * 4

        // R channel
        inputData[0 * height * width + y * width + x] =
          (pixels[pixelIdx] / 255.0 - this.normalization.mean[0]) / this.normalization.std[0]

        // G channel
        inputData[1 * height * width + y * width + x] =
          (pixels[pixelIdx + 1] / 255.0 - this.normalization.mean[1]) / this.normalization.std[1]

        // B channel
        inputData[2 * height * width + y * width + x] =
          (pixels[pixelIdx + 2] / 255.0 - this.normalization.mean[2]) / this.normalization.std[2]
      }
    }

    return inputData
  }

  /**
   * Post-process segmentation mask with threshold
   */
  private postprocess(rawMask: Float32Array, threshold: number): Float32Array {
    const processed = new Float32Array(rawMask.length)

    for (let i = 0; i < rawMask.length; i++) {
      // Apply soft threshold with smooth edges
      if (rawMask[i] >= threshold) {
        processed[i] = Math.min(1.0, (rawMask[i] - threshold) / (1.0 - threshold) * 1.5)
      } else if (rawMask[i] >= threshold * 0.7) {
        // Smooth edge transition
        processed[i] = (rawMask[i] - threshold * 0.7) / (threshold * 0.3)
      } else {
        processed[i] = 0
      }
    }

    return processed
  }

  /**
   * Extract individual nail regions from segmentation mask
   * Uses connected component analysis
   */
  private extractNailRegions(
    mask: Float32Array,
    maskWidth: number,
    maskHeight: number,
    srcWidth: number,
    srcHeight: number
  ): NailRegion[] {
    // Simple connected component labeling
    const labels = new Int32Array(mask.length)
    let nextLabel = 1
    const threshold = 0.3

    // First pass: label connected regions
    for (let y = 0; y < maskHeight; y++) {
      for (let x = 0; x < maskWidth; x++) {
        const idx = y * maskWidth + x
        if (mask[idx] < threshold) continue

        const leftLabel = x > 0 ? labels[idx - 1] : 0
        const topLabel = y > 0 ? labels[(y - 1) * maskWidth + x] : 0

        if (leftLabel > 0 && topLabel > 0 && leftLabel !== topLabel) {
          labels[idx] = Math.min(leftLabel, topLabel)
          // Union: relabel the larger label
          const maxL = Math.max(leftLabel, topLabel)
          const minL = Math.min(leftLabel, topLabel)
          for (let i = 0; i < labels.length; i++) {
            if (labels[i] === maxL) labels[i] = minL
          }
        } else if (leftLabel > 0) {
          labels[idx] = leftLabel
        } else if (topLabel > 0) {
          labels[idx] = topLabel
        } else {
          labels[idx] = nextLabel++
        }
      }
    }

    // Collect region stats
    const regionStats: Map<number, {
      minX: number; maxX: number; minY: number; maxY: number;
      sumX: number; sumY: number; count: number; sumConf: number
    }> = new Map()

    for (let y = 0; y < maskHeight; y++) {
      for (let x = 0; x < maskWidth; x++) {
        const idx = y * maskWidth + x
        const label = labels[idx]
        if (label === 0) continue

        if (!regionStats.has(label)) {
          regionStats.set(label, {
            minX: x, maxX: x, minY: y, maxY: y,
            sumX: 0, sumY: 0, count: 0, sumConf: 0,
          })
        }

        const stats = regionStats.get(label)!
        stats.minX = Math.min(stats.minX, x)
        stats.maxX = Math.max(stats.maxX, x)
        stats.minY = Math.min(stats.minY, y)
        stats.maxY = Math.max(stats.maxY, y)
        stats.sumX += x
        stats.sumY += y
        stats.count++
        stats.sumConf += mask[idx]
      }
    }

    // Convert to NailRegion format
    const scaleX = srcWidth / maskWidth
    const scaleY = srcHeight / maskHeight
    const regions: NailRegion[] = []
    let fingerId = 0

    // Filter by minimum area and sort by position (left to right)
    const minArea = (maskWidth * maskHeight) * 0.001 // Min 0.1% of image
    const sortedRegions = [...regionStats.entries()]
      .filter(([_, s]) => s.count >= minArea)
      .sort((a, b) => (a[1].sumX / a[1].count) - (b[1].sumX / b[1].count))

    for (const [label, stats] of sortedRegions) {
      if (fingerId >= 10) break // Max 10 nails (2 hands)

      const centerX = (stats.sumX / stats.count) * scaleX
      const centerY = (stats.sumY / stats.count) * scaleY
      const boxWidth = (stats.maxX - stats.minX) * scaleX
      const boxHeight = (stats.maxY - stats.minY) * scaleY
      const avgConfidence = stats.sumConf / stats.count

      regions.push({
        fingerId,
        fingerName: `Nail ${fingerId + 1}`,
        center: { x: centerX, y: centerY },
        boundingBox: {
          x: stats.minX * scaleX,
          y: stats.minY * scaleY,
          width: boxWidth,
          height: boxHeight,
        },
        landmarks: {
          tip: { x: centerX, y: stats.minY * scaleY },
          dip: { x: centerX, y: centerY - boxHeight * 0.15 },
          pip: { x: centerX, y: centerY + boxHeight * 0.15 },
          mcp: { x: centerX, y: stats.maxY * scaleY },
        },
        rotation: 0,
        confidence: avgConfidence,
      })

      fingerId++
    }

    return regions
  }

  /**
   * Calculate overall segmentation confidence
   */
  private calculateConfidence(rawMask: Float32Array): number {
    let sum = 0
    let count = 0

    for (let i = 0; i < rawMask.length; i++) {
      if (rawMask[i] > 0.3) {
        sum += rawMask[i]
        count++
      }
    }

    if (count === 0) return 0
    return sum / count
  }

  /**
   * Resize segmentation mask to match source dimensions
   */
  resizeMask(
    mask: Float32Array,
    maskWidth: number,
    maskHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Float32Array {
    const resized = new Float32Array(targetWidth * targetHeight)

    const scaleX = maskWidth / targetWidth
    const scaleY = maskHeight / targetHeight

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.min(Math.floor(x * scaleX), maskWidth - 1)
        const srcY = Math.min(Math.floor(y * scaleY), maskHeight - 1)
        resized[y * targetWidth + x] = mask[srcY * maskWidth + srcX]
      }
    }

    return resized
  }

  /**
   * Check if model is loaded and ready
   */
  getIsReady(): boolean {
    return this.isReady
  }

  /**
   * Dispose of model resources
   */
  async dispose(): Promise<void> {
    await ModelManager.disposeEngine()
    this.engine = null
    this.isReady = false
    this.initPromise = null
    this.preprocessCanvas = null
    this.preprocessCtx = null
  }
}
