/**
 * Image Quality Filter
 * Validates images for training suitability: size, format, blur detection
 */

import * as fs from 'fs'
import * as path from 'path'
import type { NailDesignMetadata } from '../scraper/MetadataExtractor'

interface FilteredItem {
  metadata: NailDesignMetadata
  filepath: string
}

export interface QualityFilterConfig {
  minFileSize: number      // Minimum file size in bytes (default 10KB)
  maxFileSize: number      // Maximum file size in bytes (default 20MB)
  minDimension: number     // Minimum width or height (default 256px)
  allowedFormats: string[] // Allowed file extensions
}

const DEFAULT_FILTER_CONFIG: QualityFilterConfig = {
  minFileSize: 10_000,        // 10KB
  maxFileSize: 20_000_000,    // 20MB
  minDimension: 256,
  allowedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
}

export class QualityFilter {
  private config: QualityFilterConfig

  constructor(config?: Partial<QualityFilterConfig>) {
    this.config = { ...DEFAULT_FILTER_CONFIG, ...config }
  }

  /**
   * Filter a batch of items, returning only those passing quality checks
   */
  async filterBatch(items: FilteredItem[]): Promise<FilteredItem[]> {
    const passed: FilteredItem[] = []

    for (const item of items) {
      if (this.checkItem(item)) {
        passed.push(item)
      }
    }

    return passed
  }

  /**
   * Check a single item against all quality criteria
   */
  private checkItem(item: FilteredItem): boolean {
    const { filepath, metadata } = item

    // 1. File exists
    if (!fs.existsSync(filepath)) return false

    // 2. File extension check
    const ext = path.extname(filepath).toLowerCase()
    if (!this.config.allowedFormats.includes(ext)) return false

    // 3. File size check
    const stat = fs.statSync(filepath)
    if (stat.size < this.config.minFileSize || stat.size > this.config.maxFileSize) return false

    // 4. Magic bytes validation (is it actually an image?)
    if (!this.validateMagicBytes(filepath)) return false

    // 5. Dimension check from metadata (if available)
    if (metadata.width && metadata.height) {
      if (metadata.width < this.config.minDimension || metadata.height < this.config.minDimension) {
        return false
      }
    }

    return true
  }

  /**
   * Validate file magic bytes to confirm image format
   */
  private validateMagicBytes(filepath: string): boolean {
    try {
      const fd = fs.openSync(filepath, 'r')
      const buffer = Buffer.alloc(12)
      fs.readSync(fd, buffer, 0, 12, 0)
      fs.closeSync(fd)

      // JPEG: FF D8 FF
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true

      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true

      // WebP: RIFF....WEBP
      if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
          buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true

      return false
    } catch {
      return false
    }
  }

  /**
   * Get image dimensions from JPEG header (without loading full image)
   * Returns null if unable to determine dimensions
   */
  static getJpegDimensions(filepath: string): { width: number; height: number } | null {
    try {
      const buffer = fs.readFileSync(filepath)

      // Check JPEG signature
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return null

      let offset = 2
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) return null

        const marker = buffer[offset + 1]

        // SOF markers (Start of Frame)
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          const height = buffer.readUInt16BE(offset + 5)
          const width = buffer.readUInt16BE(offset + 7)
          return { width, height }
        }

        // Skip to next marker
        const length = buffer.readUInt16BE(offset + 2)
        offset += 2 + length
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Get image dimensions from PNG header
   */
  static getPngDimensions(filepath: string): { width: number; height: number } | null {
    try {
      const fd = fs.openSync(filepath, 'r')
      const buffer = Buffer.alloc(24)
      fs.readSync(fd, buffer, 0, 24, 0)
      fs.closeSync(fd)

      // Check PNG signature
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50) return null

      // Dimensions are at offset 16 (IHDR chunk)
      const width = buffer.readUInt32BE(16)
      const height = buffer.readUInt32BE(20)

      return { width, height }
    } catch {
      return null
    }
  }

  /**
   * Get dimensions for any supported image format
   */
  static getImageDimensions(filepath: string): { width: number; height: number } | null {
    const ext = path.extname(filepath).toLowerCase()

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return QualityFilter.getJpegDimensions(filepath)
      case '.png':
        return QualityFilter.getPngDimensions(filepath)
      default:
        return null
    }
  }
}

/**
 * Compute Laplacian variance as a blur metric
 * Higher value = sharper image
 * This is a simplified version that works on raw pixel data
 */
export function computeBlurMetric(
  pixelData: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number = 4
): number {
  // Convert to grayscale
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = pixelData[i * channels]
    const g = pixelData[i * channels + 1]
    const b = pixelData[i * channels + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

  // Apply Laplacian kernel
  // [0,  1, 0]
  // [1, -4, 1]
  // [0,  1, 0]
  let sum = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = gray[y * width + x]
      const laplacian =
        gray[(y - 1) * width + x] +
        gray[(y + 1) * width + x] +
        gray[y * width + (x - 1)] +
        gray[y * width + (x + 1)] -
        4 * center

      sum += laplacian * laplacian
      count++
    }
  }

  return count > 0 ? sum / count : 0
}
