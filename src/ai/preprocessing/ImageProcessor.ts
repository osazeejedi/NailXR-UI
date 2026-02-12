/**
 * Image Preprocessing for Nail Segmentation
 * Handles image normalization, resizing, and format conversion
 */

export interface ImageTensor {
  data: Float32Array
  width: number
  height: number
  channels: number
}

export interface PreprocessingOptions {
  targetWidth: number
  targetHeight: number
  normalize: boolean
  mean?: [number, number, number]
  std?: [number, number, number]
  channelOrder?: 'RGB' | 'BGR'
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d', {
      willReadFrequently: true,
      alpha: false
    })
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context')
    }
    
    this.ctx = ctx
  }

  /**
   * Preprocess image for model inference
   * Converts HTMLImageElement, HTMLVideoElement, or ImageData to Float32Array tensor
   */
  async preprocessImage(
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageData,
    options: PreprocessingOptions
  ): Promise<ImageTensor> {
    const { targetWidth, targetHeight, normalize, mean, std, channelOrder } = options

    // Set canvas size
    this.canvas.width = targetWidth
    this.canvas.height = targetHeight

    // Draw and resize image
    if (source instanceof ImageData) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = source.width
      tempCanvas.height = source.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.putImageData(source, 0, 0)
        this.ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight)
      }
    } else {
      this.ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
    }

    // Get pixel data
    const imageData = this.ctx.getImageData(0, 0, targetWidth, targetHeight)
    const pixels = imageData.data

    // Convert to Float32Array with proper channel order and normalization
    const tensorSize = targetWidth * targetHeight * 3
    const tensorData = new Float32Array(tensorSize)

    const meanR = mean?.[0] ?? 0.485
    const meanG = mean?.[1] ?? 0.456
    const meanB = mean?.[2] ?? 0.406
    const stdR = std?.[0] ?? 0.229
    const stdG = std?.[1] ?? 0.224
    const stdB = std?.[2] ?? 0.225

    // Convert from RGBA to RGB/BGR and normalize
    for (let i = 0; i < targetWidth * targetHeight; i++) {
      const srcIdx = i * 4
      const r = pixels[srcIdx] / 255.0
      const g = pixels[srcIdx + 1] / 255.0
      const b = pixels[srcIdx + 2] / 255.0

      if (normalize) {
        // Normalize using ImageNet statistics
        const normR = (r - meanR) / stdR
        const normG = (g - meanG) / stdG
        const normB = (b - meanB) / stdB

        if (channelOrder === 'BGR') {
          tensorData[i] = normB
          tensorData[targetWidth * targetHeight + i] = normG
          tensorData[2 * targetWidth * targetHeight + i] = normR
        } else {
          tensorData[i] = normR
          tensorData[targetWidth * targetHeight + i] = normG
          tensorData[2 * targetWidth * targetHeight + i] = normB
        }
      } else {
        // Just convert to 0-1 range
        if (channelOrder === 'BGR') {
          tensorData[i] = b
          tensorData[targetWidth * targetHeight + i] = g
          tensorData[2 * targetWidth * targetHeight + i] = r
        } else {
          tensorData[i] = r
          tensorData[targetWidth * targetHeight + i] = g
          tensorData[2 * targetWidth * targetHeight + i] = b
        }
      }
    }

    return {
      data: tensorData,
      width: targetWidth,
      height: targetHeight,
      channels: 3
    }
  }

  /**
   * Crop image to region of interest
   */
  cropImage(
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): ImageData {
    this.canvas.width = width
    this.canvas.height = height
    this.ctx.drawImage(source, x, y, width, height, 0, 0, width, height)
    return this.ctx.getImageData(0, 0, width, height)
  }

  /**
   * Resize image while maintaining aspect ratio
   */
  resizeWithAspectRatio(
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number
  ): { imageData: ImageData; scale: number } {
    const srcWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width
    const srcHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height

    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
    const newWidth = Math.round(srcWidth * ratio)
    const newHeight = Math.round(srcHeight * ratio)

    this.canvas.width = newWidth
    this.canvas.height = newHeight
    this.ctx.drawImage(source, 0, 0, newWidth, newHeight)

    return {
      imageData: this.ctx.getImageData(0, 0, newWidth, newHeight),
      scale: ratio
    }
  }

  /**
   * Convert Float32Array mask back to ImageData for display
   */
  maskToImageData(
    mask: Float32Array,
    width: number,
    height: number,
    threshold: number = 0.5
  ): ImageData {
    const imageData = new ImageData(width, height)
    const data = imageData.data

    for (let i = 0; i < mask.length; i++) {
      const value = mask[i] > threshold ? 255 : 0
      data[i * 4] = value
      data[i * 4 + 1] = value
      data[i * 4 + 2] = value
      data[i * 4 + 3] = 255
    }

    return imageData
  }

  /**
   * Apply mask as an alpha channel to image
   */
  applyMaskToImage(
    image: ImageData,
    mask: Float32Array,
    threshold: number = 0.5
  ): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(image.data),
      image.width,
      image.height
    )

    for (let i = 0; i < mask.length; i++) {
      const alpha = mask[i] > threshold ? 255 : 0
      result.data[i * 4 + 3] = alpha
    }

    return result
  }

  /**
   * Blend two images with mask
   */
  blendImages(
    background: ImageData,
    overlay: ImageData,
    mask: Float32Array,
    opacity: number = 1.0
  ): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(background.data),
      background.width,
      background.height
    )

    for (let i = 0; i < mask.length; i++) {
      const alpha = mask[i] * opacity
      const idx = i * 4

      result.data[idx] = Math.round(
        background.data[idx] * (1 - alpha) + overlay.data[idx] * alpha
      )
      result.data[idx + 1] = Math.round(
        background.data[idx + 1] * (1 - alpha) + overlay.data[idx + 1] * alpha
      )
      result.data[idx + 2] = Math.round(
        background.data[idx + 2] * (1 - alpha) + overlay.data[idx + 2] * alpha
      )
    }

    return result
  }

  /**
   * Create colored overlay from mask
   */
  createColoredMask(
    mask: Float32Array,
    width: number,
    height: number,
    color: { r: number; g: number; b: number },
    opacity: number = 0.8
  ): ImageData {
    const imageData = new ImageData(width, height)
    const data = imageData.data

    for (let i = 0; i < mask.length; i++) {
      const alpha = mask[i] * opacity
      data[i * 4] = color.r
      data[i * 4 + 1] = color.g
      data[i * 4 + 2] = color.b
      data[i * 4 + 3] = Math.round(alpha * 255)
    }

    return imageData
  }

  dispose() {
    this.canvas.width = 0
    this.canvas.height = 0
  }
}

/**
 * Utility functions for common image operations
 */
export class ImageUtils {
  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 255, g: 182, b: 193 } // Default pink
  }

  /**
   * Get average color from image region
   */
  static getAverageColor(imageData: ImageData): { r: number; g: number; b: number } {
    let r = 0, g = 0, b = 0
    const pixels = imageData.data
    const pixelCount = imageData.width * imageData.height

    for (let i = 0; i < pixels.length; i += 4) {
      r += pixels[i]
      g += pixels[i + 1]
      b += pixels[i + 2]
    }

    return {
      r: Math.round(r / pixelCount),
      g: Math.round(g / pixelCount),
      b: Math.round(b / pixelCount)
    }
  }

  /**
   * Calculate image brightness
   */
  static getBrightness(imageData: ImageData): number {
    let brightness = 0
    const pixels = imageData.data
    const pixelCount = imageData.width * imageData.height

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      brightness += (0.299 * r + 0.587 * g + 0.114 * b)
    }

    return brightness / pixelCount / 255
  }
}
