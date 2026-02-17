/**
 * Nail Rendering System
 * Handles AR overlay rendering with masks, patterns, and effects
 */

import { ImageProcessor, ImageUtils } from '../preprocessing/ImageProcessor'
import type { NailRegion } from '../nail-detection/NailDetector'
import { GlossRenderer, type FinishType, type GlossOptions } from './GlossRenderer'

export interface RenderOptions {
  color: string
  opacity: number
  pattern?: 'solid' | 'gradient' | 'french' | 'ombre' | 'glitter'
  gradientColors?: string[]
  gradientDirection?: 'vertical' | 'horizontal' | 'diagonal'
  texture?: HTMLImageElement | HTMLCanvasElement
  glow?: boolean
  glowIntensity?: number
  /** Nail polish finish type for gloss rendering */
  finish?: FinishType
  /** Custom gloss options (overrides finish preset) */
  glossOptions?: Partial<GlossOptions>
  /** Enable gloss/specular effects. Default: true */
  enableGloss?: boolean
}

export interface NailMask {
  mask: Float32Array
  width: number
  height: number
  region: NailRegion
}

export class NailRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imageProcessor: ImageProcessor
  private glossRenderer: GlossRenderer

  constructor() {
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context')
    }
    
    this.ctx = ctx
    this.imageProcessor = new ImageProcessor()
    this.glossRenderer = new GlossRenderer()
  }

  /**
   * Render nail overlay on source image
   */
  renderNail(
    sourceImage: HTMLVideoElement | HTMLCanvasElement | ImageData,
    nailMask: NailMask,
    options: RenderOptions
  ): ImageData {
    const width = sourceImage instanceof ImageData ? sourceImage.width : 
                  sourceImage instanceof HTMLVideoElement ? sourceImage.videoWidth : sourceImage.width
    const height = sourceImage instanceof ImageData ? sourceImage.height :
                   sourceImage instanceof HTMLVideoElement ? sourceImage.videoHeight : sourceImage.height

    this.canvas.width = width
    this.canvas.height = height

    // Draw source image
    if (sourceImage instanceof ImageData) {
      this.ctx.putImageData(sourceImage, 0, 0)
    } else {
      this.ctx.drawImage(sourceImage, 0, 0)
    }

    // Create nail overlay based on pattern
    const overlay = this.createNailOverlay(nailMask, options)

    // Apply gloss/specular effects (enabled by default)
    if (options.enableGloss !== false) {
      if (options.finish) this.glossRenderer.setFinish(options.finish)
      if (options.glossOptions) this.glossRenderer.updateOptions(options.glossOptions)
      // Estimate scene brightness from source for environment-adaptive gloss
      const sourceData = this.ctx.getImageData(0, 0, width, height)
      this.glossRenderer.estimateSceneBrightness(sourceData.data)
      const glossyData = this.glossRenderer.applyGloss(overlay.data, nailMask.mask, nailMask.width, nailMask.height)
      overlay.data.set(glossyData)
    }

    // Blend overlay with source
    this.blendOverlay(overlay, nailMask.mask, options.opacity)

    return this.ctx.getImageData(0, 0, width, height)
  }

  /**
   * Render multiple nails at once
   */
  renderMultipleNails(
    sourceImage: HTMLVideoElement | HTMLCanvasElement | ImageData,
    nailMasks: NailMask[],
    options: RenderOptions
  ): ImageData {
    const width = sourceImage instanceof ImageData ? sourceImage.width :
                  sourceImage instanceof HTMLVideoElement ? sourceImage.videoWidth : sourceImage.width
    const height = sourceImage instanceof ImageData ? sourceImage.height :
                   sourceImage instanceof HTMLVideoElement ? sourceImage.videoHeight : sourceImage.height

    this.canvas.width = width
    this.canvas.height = height

    // Draw source image
    if (sourceImage instanceof ImageData) {
      this.ctx.putImageData(sourceImage, 0, 0)
    } else {
      this.ctx.drawImage(sourceImage, 0, 0)
    }

    // Setup gloss if enabled
    if (options.enableGloss !== false) {
      if (options.finish) this.glossRenderer.setFinish(options.finish)
      if (options.glossOptions) this.glossRenderer.updateOptions(options.glossOptions)
      const sourceData = this.ctx.getImageData(0, 0, width, height)
      this.glossRenderer.estimateSceneBrightness(sourceData.data)
    }

    // Render each nail
    for (const nailMask of nailMasks) {
      const overlay = this.createNailOverlay(nailMask, options)
      if (options.enableGloss !== false) {
        const glossyData = this.glossRenderer.applyGloss(overlay.data, nailMask.mask, nailMask.width, nailMask.height)
        overlay.data.set(glossyData)
      }
      this.blendOverlay(overlay, nailMask.mask, options.opacity)
    }

    return this.ctx.getImageData(0, 0, width, height)
  }

  /**
   * Create nail overlay based on pattern type
   */
  private createNailOverlay(
    nailMask: NailMask,
    options: RenderOptions
  ): ImageData {
    const { width, height, region } = nailMask
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')!

    const rgb = ImageUtils.hexToRgb(options.color)

    switch (options.pattern) {
      case 'gradient':
        this.renderGradient(tempCtx, width, height, options, region)
        break
      
      case 'french':
        this.renderFrenchTip(tempCtx, width, height, options, region)
        break
      
      case 'ombre':
        this.renderOmbre(tempCtx, width, height, options, region)
        break
      
      case 'glitter':
        this.renderGlitter(tempCtx, width, height, options, region)
        break
      
      case 'solid':
      default:
        tempCtx.fillStyle = options.color
        tempCtx.fillRect(0, 0, width, height)
        break
    }

    // Add glow effect if requested
    if (options.glow) {
      this.addGlowEffect(tempCtx, width, height, options.glowIntensity || 0.3)
    }

    return tempCtx.getImageData(0, 0, width, height)
  }

  /**
   * Render gradient pattern
   */
  private renderGradient(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: RenderOptions,
    region: NailRegion
  ) {
    const colors = options.gradientColors || [options.color, '#FFFFFF']
    let gradient: CanvasGradient

    switch (options.gradientDirection) {
      case 'horizontal':
        gradient = ctx.createLinearGradient(0, 0, width, 0)
        break
      case 'diagonal':
        gradient = ctx.createLinearGradient(0, 0, width, height)
        break
      case 'vertical':
      default:
        gradient = ctx.createLinearGradient(0, 0, 0, height)
        break
    }

    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color)
    })

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  /**
   * Render French tip pattern
   */
  private renderFrenchTip(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: RenderOptions,
    region: NailRegion
  ) {
    // Base (nude/pink)
    const baseColor = options.gradientColors?.[0] || '#FFF5F0'
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, width, height)

    // White tip (top 30% of nail)
    const tipColor = options.gradientColors?.[1] || '#FFFFFF'
    ctx.fillStyle = tipColor
    
    const tipHeight = height * 0.3
    ctx.fillRect(0, 0, width, tipHeight)

    // Smooth transition
    const gradient = ctx.createLinearGradient(0, tipHeight * 0.8, 0, tipHeight * 1.2)
    gradient.addColorStop(0, tipColor)
    gradient.addColorStop(1, baseColor)
    ctx.fillStyle = gradient
    ctx.fillRect(0, tipHeight * 0.8, width, tipHeight * 0.4)
  }

  /**
   * Render ombre pattern
   */
  private renderOmbre(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: RenderOptions,
    region: NailRegion
  ) {
    const colors = options.gradientColors || [options.color, '#FFFFFF']
    const gradient = ctx.createLinearGradient(0, height, 0, 0)

    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color)
    })

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  /**
   * Render glitter effect
   */
  private renderGlitter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: RenderOptions,
    region: NailRegion
  ) {
    // Base color
    ctx.fillStyle = options.color
    ctx.fillRect(0, 0, width, height)

    // Add glitter particles
    const glitterCount = Math.floor((width * height) / 20)
    const rgb = ImageUtils.hexToRgb(options.color)
    
    for (let i = 0; i < glitterCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 2 + 0.5
      const brightness = Math.random() * 100 + 155

      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * Add glow effect around edges
   */
  private addGlowEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Simple glow by brightening pixels
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + 255 * intensity)
      data[i + 1] = Math.min(255, data[i + 1] + 255 * intensity)
      data[i + 2] = Math.min(255, data[i + 2] + 255 * intensity)
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * Blend overlay with mask
   */
  private blendOverlay(
    overlay: ImageData,
    mask: Float32Array,
    opacity: number
  ) {
    const currentImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const result = new Uint8ClampedArray(currentImage.data)

    for (let i = 0; i < mask.length; i++) {
      const alpha = mask[i] * opacity
      const idx = i * 4

      if (alpha > 0.01) {
        result[idx] = Math.round(
          currentImage.data[idx] * (1 - alpha) + overlay.data[idx] * alpha
        )
        result[idx + 1] = Math.round(
          currentImage.data[idx + 1] * (1 - alpha) + overlay.data[idx + 1] * alpha
        )
        result[idx + 2] = Math.round(
          currentImage.data[idx + 2] * (1 - alpha) + overlay.data[idx + 2] * alpha
        )
      }
    }

    const blendedImage = new ImageData(result, currentImage.width, currentImage.height)
    this.ctx.putImageData(blendedImage, 0, 0)
  }

  /**
   * Render nail with custom texture
   */
  renderWithTexture(
    sourceImage: HTMLVideoElement | HTMLCanvasElement | ImageData,
    nailMask: NailMask,
    texture: HTMLImageElement | HTMLCanvasElement,
    opacity: number = 0.8
  ): ImageData {
    const width = sourceImage instanceof ImageData ? sourceImage.width :
                  sourceImage instanceof HTMLVideoElement ? sourceImage.videoWidth : sourceImage.width
    const height = sourceImage instanceof ImageData ? sourceImage.height :
                   sourceImage instanceof HTMLVideoElement ? sourceImage.videoHeight : sourceImage.height

    this.canvas.width = width
    this.canvas.height = height

    // Draw source image
    if (sourceImage instanceof ImageData) {
      this.ctx.putImageData(sourceImage, 0, 0)
    } else {
      this.ctx.drawImage(sourceImage, 0, 0)
    }

    // Create temporary canvas for texture
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = nailMask.width
    tempCanvas.height = nailMask.height
    const tempCtx = tempCanvas.getContext('2d')!

    // Draw and scale texture to fit nail region
    tempCtx.save()
    tempCtx.translate(nailMask.width / 2, nailMask.height / 2)
    tempCtx.rotate((nailMask.region.rotation * Math.PI) / 180)
    tempCtx.drawImage(
      texture,
      -nailMask.width / 2,
      -nailMask.height / 2,
      nailMask.width,
      nailMask.height
    )
    tempCtx.restore()

    const textureData = tempCtx.getImageData(0, 0, nailMask.width, nailMask.height)
    this.blendOverlay(textureData, nailMask.mask, opacity)

    return this.ctx.getImageData(0, 0, width, height)
  }

  /**
   * Create shimmer/metallic effect
   */
  createShimmerEffect(
    nailMask: NailMask,
    baseColor: string,
    shimmerColor: string = '#FFFFFF'
  ): ImageData {
    const { width, height } = nailMask
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // Base color
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, width, height)

    // Add shimmer highlights
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, shimmerColor + '33')
    gradient.addColorStop(0.5, shimmerColor + '66')
    gradient.addColorStop(1, shimmerColor + '33')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    return ctx.getImageData(0, 0, width, height)
  }

  dispose() {
    this.canvas.width = 0
    this.canvas.height = 0
    this.imageProcessor.dispose()
  }
}

/**
 * Utility for creating common nail patterns
 */
export class PatternGenerator {
  /**
   * Generate polka dot pattern
   */
  static createPolkaDots(
    width: number,
    height: number,
    baseColor: string,
    dotColor: string,
    dotSize: number = 3,
    spacing: number = 10
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = dotColor
    for (let x = dotSize; x < width; x += spacing) {
      for (let y = dotSize; y < height; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    return canvas
  }

  /**
   * Generate stripe pattern
   */
  static createStripes(
    width: number,
    height: number,
    colors: string[],
    stripeWidth: number = 5,
    direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    if (direction === 'horizontal') {
      let y = 0
      let colorIndex = 0
      while (y < height) {
        ctx.fillStyle = colors[colorIndex % colors.length]
        ctx.fillRect(0, y, width, stripeWidth)
        y += stripeWidth
        colorIndex++
      }
    } else if (direction === 'vertical') {
      let x = 0
      let colorIndex = 0
      while (x < width) {
        ctx.fillStyle = colors[colorIndex % colors.length]
        ctx.fillRect(x, 0, stripeWidth, height)
        x += stripeWidth
        colorIndex++
      }
    } else {
      // Diagonal stripes
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate(Math.PI / 4)
      let x = -width
      let colorIndex = 0
      while (x < width * 2) {
        ctx.fillStyle = colors[colorIndex % colors.length]
        ctx.fillRect(x, -height, stripeWidth, height * 3)
        x += stripeWidth
        colorIndex++
      }
      ctx.restore()
    }

    return canvas
  }

  /**
   * Generate geometric pattern
   */
  static createGeometric(
    width: number,
    height: number,
    baseColor: string,
    accentColor: string
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = accentColor
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 1

    // Draw geometric shapes
    const size = Math.min(width, height) / 3
    ctx.beginPath()
    ctx.moveTo(width / 2, height / 4)
    ctx.lineTo(width * 3 / 4, height * 3 / 4)
    ctx.lineTo(width / 4, height * 3 / 4)
    ctx.closePath()
    ctx.fill()

    return canvas
  }
}
