/**
 * High-Resolution Export Utilities for AR Nail Designs
 * Supports watermarks, metadata, and multi-format export
 */

import type { NailRegion } from '@/ai/nail-detection/NailDetector'
import type { TenantConfig } from './tenant'

export interface ExportOptions {
  format?: 'jpeg' | 'png' | 'webp'
  quality?: number // 0-1
  scale?: number // Resolution multiplier (2x, 4x, etc.)
  watermark?: {
    text?: string
    logo?: HTMLImageElement | string
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity?: number
  }
  metadata?: {
    designName?: string
    colors?: string[]
    pattern?: string
    timestamp?: boolean
  }
  tenant?: TenantConfig
}

export interface ExportResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  fileSize: number
  format: string
}

export class ARExporter {
  /**
   * Export canvas at high resolution
   */
  static async exportHighRes(
    sourceCanvas: HTMLCanvasElement,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const {
      format = 'jpeg',
      quality = 0.95,
      scale = 2,
      watermark,
      metadata,
      tenant
    } = options

    // Create high-res canvas
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = sourceCanvas.width * scale
    exportCanvas.height = sourceCanvas.height * scale

    const ctx = exportCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw source at higher resolution
    ctx.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height)

    // Add watermark if specified
    if (watermark) {
      await this.addWatermark(ctx, exportCanvas.width, exportCanvas.height, watermark, tenant)
    }

    // Add metadata overlay if specified
    if (metadata) {
      this.addMetadataOverlay(ctx, exportCanvas.width, exportCanvas.height, metadata)
    }

    // Convert to blob
    const mimeType = `image/${format}`
    const blob = await new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to  create blob'))),
        mimeType,
        quality
      )
    })

    const dataUrl = exportCanvas.toDataURL(mimeType, quality)

    return {
      blob,
      dataUrl,
      width: exportCanvas.width,
      height: exportCanvas.height,
      fileSize: blob.size,
      format
    }
  }

  /**
   * Add watermark to canvas
   */
  private static async addWatermark(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    watermark: NonNullable<ExportOptions['watermark']>,
    tenant?: TenantConfig
  ): Promise<void> {
    const { text, logo, position = 'bottom-right', opacity = 0.5 } = watermark

    ctx.save()
    ctx.globalAlpha = opacity

    if (logo) {
      await this.drawLogo(ctx, width, height, logo, position, tenant)
    }

    if (text) {
      this.drawText(ctx, width, height, text, position)
    }

    ctx.restore()
  }

  /**
   * Draw logo watermark
   */
  private static async drawLogo(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    logo: HTMLImageElement | string,
    position: string,
    tenant?: TenantConfig
  ): Promise<void> {
    let img: HTMLImageElement

    if (typeof logo === 'string') {
      img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = logo
      })
    } else {
      img = logo
    }

    const logoSize = Math.min(width, height) * 0.1
    const padding = 20

    let x = 0, y = 0

    switch (position) {
      case 'top-left':
        x = padding
        y = padding
        break
      case 'top-right':
        x = width - logoSize - padding
        y = padding
        break
      case 'bottom-left':
        x = padding
        y = height - logoSize - padding
        break
      case 'bottom-right':
        x = width - logoSize - padding
        y = height - logoSize - padding
        break
      case 'center':
        x = (width - logoSize) / 2
        y = (height - logoSize) / 2
        break
    }

    ctx.drawImage(img, x, y, logoSize, logoSize)
  }

  /**
   * Draw text watermark
   */
  private static drawText(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    text: string,
    position: string
  ): void {
    const fontSize = Math.min(width, height) * 0.03
    ctx.font = `bold ${fontSize}px system-ui`
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.lineWidth = 2

    const textMetrics = ctx.measureText(text)
    const padding = 20

    let x = 0, y = 0

    switch (position) {
      case 'top-left':
        x = padding
        y = padding + fontSize
        break
      case 'top-right':
        x = width - textMetrics.width - padding
        y = padding + fontSize
        break
      case 'bottom-left':
        x = padding
        y = height - padding
        break
      case 'bottom-right':
        x = width - textMetrics.width - padding
        y = height - padding
        break
      case 'center':
        x = (width - textMetrics.width) / 2
        y = height / 2
        break
    }

    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)
  }

  /**
   * Add metadata overlay
   */
  private static addMetadataOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    metadata: NonNullable<ExportOptions['metadata']>
  ): void {
    const { designName, colors, pattern, timestamp = true } = metadata

    if (!designName && !colors && !pattern && !timestamp) return

    ctx.save()

    // Semi-transparent background
    const overlayHeight = 60
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, height - overlayHeight, width, overlayHeight)

    // Text
    const padding = 20
    const fontSize = 16
    ctx.font = `${fontSize}px system-ui`
    ctx.fillStyle = 'white'

    let yPos = height - overlayHeight + 25

    if (designName) {
      ctx.font = `bold ${fontSize}px system-ui`
      ctx.fillText(designName, padding, yPos)
      yPos += 20
    }

    if (pattern || colors) {
      ctx.font = `${fontSize - 2}px system-ui`
      const info = []
      if (pattern) info.push(`Pattern: ${pattern}`)
      if (colors && colors.length > 0) info.push(`Colors: ${colors.join(', ')}`)
      ctx.fillText(info.join(' • '), padding, yPos)
    }

    if (timestamp) {
      const date = new Date().toLocaleString()
      ctx.font = `${fontSize - 4}px system-ui`
      ctx.textAlign = 'right'
      ctx.fillText(date, width - padding, height - overlayHeight + 25)
    }

    ctx.restore()
  }

  /**
   * Download exported image
   */
  static download(result: ExportResult, filename?: string): void {
    const name = filename || `nailxr-export-${Date.now()}.${result.format}`
    const url = URL.createObjectURL(result.blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }

  /**
   * Create social media optimized versions
   */
  static async createSocialMediaVersions(
    sourceCanvas: HTMLCanvasElement,
    tenant?: TenantConfig
  ): Promise<{
    instagram: ExportResult
    facebook: ExportResult
    twitter: ExportResult
  }> {
    // Instagram: 1080x1080
    const instagram = await this.exportHighRes(sourceCanvas, {
      format: 'jpeg',
      quality: 0.9,
      scale: 1080 / Math.max(sourceCanvas.width, sourceCanvas.height),
      watermark: tenant ? {
        logo: tenant.branding.logo,
        position: 'bottom-right',
        opacity: 0.6
      } : undefined
    })

    // Facebook: 1200x630
    const facebook = await this.exportHighRes(sourceCanvas, {
      format: 'jpeg',
      quality: 0.85,
      scale: 1200 / sourceCanvas.width,
      watermark: tenant ? {
        text: tenant.content.companyName,
        position: 'bottom-right',
        opacity: 0.6
      } : undefined
    })

    // Twitter: 1200x675
    const twitter = await this.exportHighRes(sourceCanvas, {
      format: 'jpeg',
      quality: 0.85,
      scale: 1200 / sourceCanvas.width
    })

    return { instagram, facebook, twitter }
  }
}

/**
 * Utility to copy image to clipboard
 */
export async function copyToClipboard(blob: Blob): Promise<void> {
  try {
    const item = new ClipboardItem({ [blob.type]: blob })
    await navigator.clipboard.write([item])
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    throw err
  }
}

/**
 * Share via Web Share API
 */
export async function shareImage(
  result: ExportResult,
  title: string = 'NailXR Design',
  text: string = 'Check out this nail design!'
): Promise<void> {
  try {
    const file = new File([result.blob], `nailxr-design.${result.format}`, {
      type: result.blob.type
    })

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file]
      })
    } else {
      throw new Error('Web Share API not supported')
    }
  } catch (err) {
    console.error('Share failed:', err)
    throw err
  }
}
