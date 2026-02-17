/**
 * Image Downloader with parallel downloads, retries, and progress tracking
 */

import * as fs from 'fs'
import * as path from 'path'
import { SCRAPER_CONFIG } from './config'

export class ImageDownloader {
  private activeDownloads = 0
  private downloadQueue: Array<{ url: string; filepath: string; resolve: (v: boolean) => void; reject: (e: Error) => void }> = []
  private totalDownloaded = 0
  private totalFailed = 0

  /**
   * Download an image from URL to local filepath
   */
  async download(url: string, filepath: string): Promise<boolean> {
    // If under concurrency limit, download immediately
    if (this.activeDownloads < SCRAPER_CONFIG.maxConcurrentDownloads) {
      return this.doDownload(url, filepath)
    }

    // Otherwise, queue it
    return new Promise<boolean>((resolve, reject) => {
      this.downloadQueue.push({ url, filepath, resolve, reject })
    })
  }

  /**
   * Perform the actual download with retries
   */
  private async doDownload(url: string, filepath: string, attempt: number = 1): Promise<boolean> {
    this.activeDownloads++

    try {
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        this.activeDownloads--
        this.processQueue()
        return true
      }

      // Ensure directory exists
      const dir = path.dirname(filepath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': SCRAPER_CONFIG.userAgent,
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.reddit.com/',
        },
        redirect: 'follow',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check content type
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.startsWith('image/')) {
        throw new Error(`Not an image: ${contentType}`)
      }

      // Get the image data
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Validate minimum file size (skip tiny/corrupt images)
      if (buffer.length < 5000) { // Less than 5KB is probably not a real photo
        throw new Error(`File too small: ${buffer.length} bytes`)
      }

      // Write to disk
      fs.writeFileSync(filepath, buffer)

      this.totalDownloaded++
      this.activeDownloads--
      this.processQueue()

      return true
    } catch (err) {
      this.activeDownloads--

      if (attempt < SCRAPER_CONFIG.maxRetries) {
        // Wait before retry (exponential backoff)
        await this.delay(1000 * attempt)
        return this.doDownload(url, filepath, attempt + 1)
      }

      this.totalFailed++
      this.processQueue()

      // Don't throw - just return false so scraper can continue
      return false
    }
  }

  /**
   * Process queued downloads
   */
  private processQueue() {
    while (this.activeDownloads < SCRAPER_CONFIG.maxConcurrentDownloads && this.downloadQueue.length > 0) {
      const item = this.downloadQueue.shift()!
      this.doDownload(item.url, item.filepath)
        .then(item.resolve)
        .catch(item.reject)
    }
  }

  /**
   * Download multiple images in parallel
   */
  async downloadBatch(
    items: Array<{ url: string; filepath: string }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ successful: number; failed: number }> {
    let completed = 0
    const total = items.length
    let successful = 0
    let failed = 0

    const promises = items.map(async (item) => {
      const success = await this.download(item.url, item.filepath)
      completed++
      if (success) successful++
      else failed++
      onProgress?.(completed, total)
      return success
    })

    await Promise.all(promises)

    return { successful, failed }
  }

  /**
   * Get download statistics
   */
  getStats(): { downloaded: number; failed: number; queued: number; active: number } {
    return {
      downloaded: this.totalDownloaded,
      failed: this.totalFailed,
      queued: this.downloadQueue.length,
      active: this.activeDownloads,
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Utility to validate downloaded images
 */
export class ImageValidator {
  /**
   * Check if a file is a valid image by reading magic bytes
   */
  static isValidImage(filepath: string): boolean {
    try {
      const buffer = fs.readFileSync(filepath)
      if (buffer.length < 4) return false

      // Check magic bytes
      // JPEG: FF D8 FF
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true

      // PNG: 89 50 4E 47
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true

      // WebP: 52 49 46 46 ... 57 45 42 50
      if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
          buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true

      // GIF: 47 49 46 38
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true

      return false
    } catch {
      return false
    }
  }

  /**
   * Get image file size in bytes
   */
  static getFileSize(filepath: string): number {
    try {
      return fs.statSync(filepath).size
    } catch {
      return 0
    }
  }

  /**
   * Remove invalid/corrupt images from a directory
   */
  static cleanDirectory(dirPath: string): { removed: number; kept: number } {
    let removed = 0
    let kept = 0

    const files = fs.readdirSync(dirPath)
    for (const file of files) {
      const filepath = path.join(dirPath, file)
      const stat = fs.statSync(filepath)
      
      if (stat.isFile()) {
        if (!this.isValidImage(filepath) || stat.size < 5000) {
          fs.unlinkSync(filepath)
          removed++
        } else {
          kept++
        }
      }
    }

    return { removed, kept }
  }
}
