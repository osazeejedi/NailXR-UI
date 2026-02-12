/**
 * Lighting Enhancement for AR Nail Detection
 * Auto-corrects brightness, contrast, and color temperature
 */

export interface EnhancementOptions {
  autoBrightness?: boolean
  autoContrast?: boolean
  colorTemperature?: 'auto' | 'warm' | 'cool' | 'neutral'
  shadowCompensation?: boolean
  sharpen?: boolean
}

export interface EnhancementMetrics {
  originalBrightness: number
  enhancedBrightness: number
  contrastRatio: number
  processingTime: number
}

export class LightingEnhancer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context')
    }
    
    this.ctx = ctx
  }

  /**
   * Enhance image lighting and quality
   */
  enhance(
    source: HTMLVideoElement | HTMLCanvasElement | ImageData,
    options: EnhancementOptions = {}
  ): { imageData: ImageData; metrics: EnhancementMetrics } {
    const startTime = performance.now()

    const {
      autoBrightness = true,
      autoContrast = true,
      colorTemperature = 'auto',
      shadowCompensation = true,
      sharpen = false
    } = options

    // Get source image data
    let imageData: ImageData
    
    if (source instanceof ImageData) {
      imageData = new ImageData(
        new Uint8ClampedArray(source.data),
        source.width,
        source. height
      )
    } else {
      const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width
      const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height
      
      this.canvas.width = width
      this.canvas.height = height
      this.ctx.drawImage(source, 0, 0)
      imageData = this.ctx.getImageData(0, 0, width, height)
    }

    const originalBrightness = this.calculateBrightness(imageData)

    // Apply enhancements in sequence
    if (autoBrightness) {
      imageData = this.adjustBrightness(imageData, originalBrightness)
    }

    if (autoContrast) {
      imageData = this.adjustContrast(imageData)
    }

    if (colorTemperature !== 'neutral') {
      imageData = this.adjustColorTemperature(imageData, colorTemperature)
    }

    if (shadowCompensation) {
      imageData = this.compensateShadows(imageData)
    }

    if (sharpen) {
      imageData = this.sharpenImage(imageData)
    }

    const enhancedBrightness = this.calculateBrightness(imageData)
    const contrastRatio = this.calculateContrast(imageData)

    return {
      imageData,
      metrics: {
        originalBrightness,
        enhancedBrightness,
        contrastRatio,
        processingTime: performance.now() - startTime
      }
    }
  }

  /**
   * Calculate average brightness (0-1)
   */
  private calculateBrightness(imageData: ImageData): number {
    const data = imageData.data
    let brightness = 0
    const pixelCount = imageData.width * imageData.height

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Luminance formula
      brightness += (0.299 * r + 0.587 * g + 0.114 * b)
    }

    return brightness / pixelCount / 255
  }

  /**
   * Adjust brightness to optimal level
   */
  private adjustBrightness(imageData: ImageData, currentBrightness: number): ImageData {
    const targetBrightness = 0.5 // Target 50% brightness
    const data = imageData.data
    
    // Calculate adjustment factor
    const factor = targetBrightness / currentBrightness
    const clampedFactor = Math.max(0.7, Math.min(1.3, factor)) // Limit adjustment

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * clampedFactor)
      data[i + 1] = Math.min(255, data[i + 1] * clampedFactor)
      data[i + 2] = Math.min(255, data[i + 2] * clampedFactor)
    }

    return imageData
  }

  /**
   * Adjust contrast using histogram stretching
   */
  private adjustContrast(imageData: ImageData): ImageData {
    const data = imageData.data
    
    // Find min and max values for each channel
    let minR = 255, maxR = 0
    let minG = 255, maxG = 0
    let minB = 255, maxB = 0

    for (let i = 0; i < data.length; i += 4) {
      minR = Math.min(minR, data[i])
      maxR = Math.max(maxR, data[i])
      minG = Math.min(minG, data[i + 1])
      maxG = Math.max(maxG, data[i + 1])
      minB = Math.min(minB, data[i + 2])
      maxB = Math.max(maxB, data[i + 2])
    }

    // Stretch histogram
    for (let i = 0; i < data.length; i += 4) {
      if (maxR > minR) {
        data[i] = Math.round(((data[i] - minR) / (maxR - minR)) * 255)
      }
      if (maxG > minG) {
        data[i + 1] = Math.round(((data[i + 1] - minG) / (maxG - minG)) * 255)
      }
      if (maxB > minB) {
        data[i + 2] = Math.round(((data[i + 2] - minB) / (maxB - minB)) * 255)
      }
    }

    return imageData
  }

  /**
   * Adjust color temperature
   */
  private adjustColorTemperature(
    imageData: ImageData,
    temperature: 'auto' | 'warm' | 'cool'
  ): ImageData {
    const data = imageData.data
    
    let rAdjust = 1.0, bAdjust = 1.0

    if (temperature === 'auto') {
      // Detect current temperature and auto-correct
      const avgTemp = this.detectColorTemperature(imageData)
      if (avgTemp > 0.6) {
        // Image is warm, cool it down
        rAdjust = 0.95
        bAdjust = 1.05
      } else if (avgTemp < 0.4) {
        // Image is cool, warm it up
        rAdjust = 1.05
        bAdjust = 0.95
      }
    } else if (temperature === 'warm') {
      rAdjust = 1.1
      bAdjust = 0.9
    } else if (temperature === 'cool') {
      rAdjust = 0.9
      bAdjust = 1.1
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * rAdjust)
      data[i + 2] = Math.min(255, data[i + 2] * bAdjust)
    }

    return imageData
  }

  /**
   * Detect color temperature (0 = cool, 1 = warm)
   */
  private detectColorTemperature(imageData: ImageData): number {
    const data = imageData.data
    let rSum = 0, bSum = 0
    const pixelCount = imageData.width * imageData.height

    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i]
      bSum += data[i + 2]
    }

    const avgR = rSum / pixelCount
    const avgB = bSum / pixelCount

    return avgR / (avgR + avgB)
  }

  /**
   * Compensate for shadows
   */
  private compensateShadows(imageData: ImageData): ImageData {
    const data = imageData.data
    const brightness = this.calculateBrightness(imageData)

    // If image is too dark, boost shadows
    if (brightness < 0.4) {
      const boostFactor = 1.2

      for (let i = 0; i < data.length; i += 4) {
        const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        
        // Boost darker pixels more
        if (luma < 128) {
          const factor = boostFactor * (1 - luma / 255)
          data[i] = Math.min(255, data[i] * (1 + factor * 0.3))
          data[i + 1] = Math.min(255, data[i + 1] * (1 + factor * 0.3))
          data[i + 2] = Math.min(255, data[i + 2] * (1 + factor * 0.3))
        }
      }
    }

    return imageData
  }

  /**
   * Sharpen image using unsharp mask
   */
  private sharpenImage(imageData: ImageData): ImageData {
    const width = imageData.width
    const height = imageData.height
    const data = new Uint8ClampedArray(imageData.data)
    const output = new Uint8ClampedArray(data)

    // Simple sharpening kernel
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c
              sum += data[idx] * kernel[ky + 1][kx + 1]
            }
          }
          const idx = (y * width + x) * 4 + c
          output[idx] = Math.max(0, Math.min(255, sum))
        }
      }
    }

    return new ImageData(output, width, height)
  }

  /**
   * Calculate contrast ratio
   */
  private calculateContrast(imageData: ImageData): number {
    const data = imageData.data
    let min = 255, max = 0

    for (let i = 0; i < data.length; i += 4) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      min = Math.min(min, luma)
      max = Math.max(max, luma)
    }

    return max > 0 ? (max - min) / max : 0
  }

  /**
   * Histogram equalization for better contrast
   */
  histogramEqualization(imageData: ImageData): ImageData {
    const data = imageData.data
    const pixelCount = imageData.width * imageData.height

    // Calculate histogram for each channel
    const histR = new Array(256).fill(0)
    const histG = new Array(256).fill(0)
    const histB = new Array(256).fill(0)

    for (let i = 0; i < data.length; i += 4) {
      histR[data[i]]++
      histG[data[i + 1]]++
      histB[data[i + 2]]++
    }

    // Calculate cumulative distribution
    const cdfR = this.calculateCDF(histR, pixelCount)
    const cdfG = this.calculateCDF(histG, pixelCount)
    const cdfB = this.calculateCDF(histB, pixelCount)

    // Apply equalization
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(cdfR[data[i]] * 255)
      data[i + 1] = Math.round(cdfG[data[i + 1]] * 255)
      data[i + 2] = Math.round(cdfB[data[i + 2]] * 255)
    }

    return imageData
  }

  /**
   * Calculate cumulative distribution function
   */
  private calculateCDF(histogram: number[], total: number): number[] {
    const cdf = new Array(256).fill(0)
    cdf[0] = histogram[0] / total

    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i] / total
    }

    return cdf
  }

  dispose() {
    this.canvas.width = 0
    this.canvas.height = 0
  }
}

/**
 * Quick enhancement presets
 */
export const EnhancementPresets = {
  natural: {
    autoBrightness: true,
    autoContrast: false,
    colorTemperature: 'neutral' as const,
    shadowCompensation: false,
    sharpen: false
  },
  
  enhance: {
    autoBrightness: true,
    autoContrast: true,
    colorTemperature: 'auto' as const,
    shadowCompensation: true,
    sharpen: false
  },
  
  professional: {
    autoBrightness: true,
    autoContrast: true,
    colorTemperature: 'auto' as const,
    shadowCompensation: true,
    sharpen: true
  },
  
  lowLight: {
    autoBrightness: true,
    autoContrast: true,
    colorTemperature: 'warm' as const,
    shadowCompensation: true,
    sharpen: false
  }
}
