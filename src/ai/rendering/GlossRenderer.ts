/**
 * Nail Gloss & Specular Rendering
 * Adds realistic light reflections, gloss highlights, and texture to nail overlays.
 * 
 * This is the "UX illusion" layer — computer graphics that makes users believe
 * the AR try-on is photorealistic. Perception is won here, not in ML.
 * 
 * Features:
 * - Specular highlight (curved light reflection along nail surface)
 * - Fresnel rim glow (edge-based light catch)
 * - Micro-texture noise (simulates polish surface grain)
 * - Environment-adaptive brightness matching
 */

export type FinishType = 'glossy' | 'matte' | 'shimmer' | 'chrome' | 'velvet'

export interface GlossOptions {
  /** Nail finish type. Default: 'glossy' */
  finish: FinishType
  /** Specular highlight intensity (0.0-1.0). Default: 0.4 */
  specularIntensity: number
  /** Specular highlight width (0.0-1.0, smaller = sharper). Default: 0.3 */
  specularWidth: number
  /** Position of specular highlight along nail (0.0=top, 1.0=bottom). Default: 0.35 */
  specularPosition: number
  /** Fresnel rim light intensity (0.0-1.0). Default: 0.15 */
  fresnelIntensity: number
  /** Micro-texture noise amount (0.0-1.0). Default: 0.03 */
  textureNoise: number
  /** Scene brightness estimate (0.0-1.0). Adjusts all effects. Default: 0.5 */
  sceneBrightness: number
  /** Polish transparency/jelly effect (0.0-1.0). Default: 0.0 */
  jellyTransparency: number
}

const DEFAULT_OPTIONS: GlossOptions = {
  finish: 'glossy',
  specularIntensity: 0.4,
  specularWidth: 0.3,
  specularPosition: 0.35,
  fresnelIntensity: 0.15,
  textureNoise: 0.03,
  sceneBrightness: 0.5,
  jellyTransparency: 0.0,
}

/** Preset configurations for different finish types */
const FINISH_PRESETS: Record<FinishType, Partial<GlossOptions>> = {
  glossy: {
    specularIntensity: 0.45,
    specularWidth: 0.25,
    fresnelIntensity: 0.15,
    textureNoise: 0.02,
  },
  matte: {
    specularIntensity: 0.05,
    specularWidth: 0.8,
    fresnelIntensity: 0.03,
    textureNoise: 0.06,
  },
  shimmer: {
    specularIntensity: 0.55,
    specularWidth: 0.2,
    fresnelIntensity: 0.25,
    textureNoise: 0.08,
  },
  chrome: {
    specularIntensity: 0.7,
    specularWidth: 0.15,
    fresnelIntensity: 0.35,
    textureNoise: 0.01,
  },
  velvet: {
    specularIntensity: 0.1,
    specularWidth: 0.6,
    fresnelIntensity: 0.08,
    textureNoise: 0.1,
  },
}

export class GlossRenderer {
  private options: GlossOptions
  private noiseBuffer: Float32Array | null = null
  private noiseWidth = 0
  private noiseHeight = 0

  constructor(options: Partial<GlossOptions> = {}) {
    const finish = options.finish ?? 'glossy'
    this.options = {
      ...DEFAULT_OPTIONS,
      ...FINISH_PRESETS[finish],
      ...options,
    }
  }

  /**
   * Apply gloss/specular effects to an existing nail overlay.
   * Call this AFTER the base color is blended but BEFORE final compositing.
   * 
   * @param overlayData - The nail overlay pixel data (RGBA)
   * @param mask - The segmentation mask (float 0-1)
   * @param width - Image width
   * @param height - Image height
   * @returns Modified overlay with gloss effects applied
   */
  applyGloss(
    overlayData: Uint8ClampedArray,
    mask: Float32Array,
    width: number,
    height: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(overlayData)

    // Generate noise buffer once (or when dimensions change)
    if (!this.noiseBuffer || this.noiseWidth !== width || this.noiseHeight !== height) {
      this.generateNoiseBuffer(width, height)
    }

    // Pre-compute the specular highlight map
    const specularMap = this.computeSpecularMap(mask, width, height)

    // Pre-compute fresnel rim map
    const fresnelMap = this.computeFresnelMap(mask, width, height)

    // Scene brightness scaling
    const brightnessScale = 0.5 + this.options.sceneBrightness

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] < 0.05) continue // Skip non-nail pixels

      const px = i * 4
      const maskVal = mask[i]

      // Original color
      let r = result[px]
      let g = result[px + 1]
      let b = result[px + 2]

      // 1. Specular highlight — adds bright reflection band
      const specular = specularMap[i] * this.options.specularIntensity * brightnessScale
      if (specular > 0) {
        r = Math.min(255, r + 255 * specular * maskVal)
        g = Math.min(255, g + 255 * specular * maskVal)
        b = Math.min(255, b + 255 * specular * maskVal)
      }

      // 2. Fresnel rim light — subtle edge glow
      const fresnel = fresnelMap[i] * this.options.fresnelIntensity * brightnessScale
      if (fresnel > 0) {
        r = Math.min(255, r + 200 * fresnel * maskVal)
        g = Math.min(255, g + 200 * fresnel * maskVal)
        b = Math.min(255, b + 220 * fresnel * maskVal) // Slightly bluish tint
      }

      // 3. Micro-texture noise — simulates polish surface grain
      if (this.options.textureNoise > 0 && this.noiseBuffer) {
        const noise = (this.noiseBuffer[i] - 0.5) * 2 * this.options.textureNoise * 255
        r = Math.max(0, Math.min(255, r + noise * maskVal))
        g = Math.max(0, Math.min(255, g + noise * maskVal))
        b = Math.max(0, Math.min(255, b + noise * maskVal))
      }

      // 4. Jelly/transparency effect — slightly reveal skin underneath
      if (this.options.jellyTransparency > 0) {
        const jelly = this.options.jellyTransparency * 0.3
        // Alpha already handled by mask, but we lighten slightly for transparency feel
        r = Math.min(255, r + 15 * jelly * maskVal)
        g = Math.min(255, g + 10 * jelly * maskVal)
        b = Math.min(255, b + 10 * jelly * maskVal)
      }

      result[px] = Math.round(r)
      result[px + 1] = Math.round(g)
      result[px + 2] = Math.round(b)
    }

    return result
  }

  /**
   * Compute specular highlight map.
   * Simulates a curved, elongated light reflection running along the nail surface.
   * The highlight follows the vertical center with a slight curve.
   */
  private computeSpecularMap(mask: Float32Array, w: number, h: number): Float32Array {
    const specMap = new Float32Array(mask.length)
    const specWidth = this.options.specularWidth
    const specPos = this.options.specularPosition

    // For each nail pixel, compute distance from specular line
    // The specular line runs vertically at ~40% from left edge, with curvature

    // First, find nail bounding box per row for the specular curve
    for (let y = 0; y < h; y++) {
      let rowMinX = w, rowMaxX = 0
      let hasNail = false

      for (let x = 0; x < w; x++) {
        if (mask[y * w + x] > 0.3) {
          rowMinX = Math.min(rowMinX, x)
          rowMaxX = Math.max(rowMaxX, x)
          hasNail = true
        }
      }

      if (!hasNail) continue

      const rowWidth = rowMaxX - rowMinX
      if (rowWidth < 2) continue

      // Specular center: slightly left of center with parabolic curve
      const nailCenterX = rowMinX + rowWidth * 0.4
      const normalizedY = y / h

      // Parabolic curve for highlight position
      const curveOffset = (normalizedY - specPos) * (normalizedY - specPos) * rowWidth * 0.3
      const specCenterX = nailCenterX + curveOffset * 0.5

      for (let x = rowMinX; x <= rowMaxX; x++) {
        const idx = y * w + x
        if (mask[idx] < 0.1) continue

        // Distance from specular center line (normalized 0-1)
        const distFromCenter = Math.abs(x - specCenterX) / (rowWidth * specWidth + 1)

        // Gaussian falloff for highlight
        const highlight = Math.exp(-(distFromCenter * distFromCenter) * 4)

        // Vertical falloff — strongest near specPos, fades at top and bottom
        const vDist = Math.abs(normalizedY - specPos) / 0.5
        const vFalloff = Math.exp(-(vDist * vDist) * 2)

        specMap[idx] = highlight * vFalloff
      }
    }

    return specMap
  }

  /**
   * Compute Fresnel rim light map.
   * Edges of nails catch more light (Fresnel effect).
   * Detected by finding mask boundary pixels.
   */
  private computeFresnelMap(mask: Float32Array, w: number, h: number): Float32Array {
    const fresnelMap = new Float32Array(mask.length)
    const fresnelRadius = 4 // pixels from edge that glow

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x
        if (mask[idx] < 0.3) continue

        // Compute gradient magnitude (detects edges)
        const gx = mask[idx + 1] - mask[idx - 1]
        const gy = mask[(y + 1) * w + x] - mask[(y - 1) * w + x]
        const gradient = Math.sqrt(gx * gx + gy * gy)

        if (gradient > 0.05) {
          // This is near an edge — compute Fresnel glow
          // Spread the glow inward from the edge
          for (let dy = -fresnelRadius; dy <= fresnelRadius; dy++) {
            for (let dx = -fresnelRadius; dx <= fresnelRadius; dx++) {
              const ny = y + dy, nx = x + dx
              if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue
              const nIdx = ny * w + nx
              if (mask[nIdx] < 0.3) continue

              const dist = Math.sqrt(dx * dx + dy * dy)
              const falloff = Math.max(0, 1 - dist / fresnelRadius)
              fresnelMap[nIdx] = Math.max(fresnelMap[nIdx], gradient * falloff)
            }
          }
        }
      }
    }

    return fresnelMap
  }

  /**
   * Generate Perlin-like noise buffer for surface texture.
   * Uses simple value noise with interpolation.
   */
  private generateNoiseBuffer(w: number, h: number): void {
    this.noiseWidth = w
    this.noiseHeight = h
    this.noiseBuffer = new Float32Array(w * h)

    // Low-frequency base noise
    const gridSize = 8
    const gridW = Math.ceil(w / gridSize) + 1
    const gridH = Math.ceil(h / gridSize) + 1
    const grid = new Float32Array(gridW * gridH)

    // Random grid values
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random()
    }

    // Bilinear interpolation to fill full buffer
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const gx = x / gridSize
        const gy = y / gridSize
        const x0 = Math.floor(gx)
        const y0 = Math.floor(gy)
        const x1 = Math.min(x0 + 1, gridW - 1)
        const y1 = Math.min(y0 + 1, gridH - 1)
        const fx = gx - x0
        const fy = gy - y0

        // Smoothstep interpolation
        const sx = fx * fx * (3 - 2 * fx)
        const sy = fy * fy * (3 - 2 * fy)

        const v00 = grid[y0 * gridW + x0]
        const v10 = grid[y0 * gridW + x1]
        const v01 = grid[y1 * gridW + x0]
        const v11 = grid[y1 * gridW + x1]

        const top = v00 * (1 - sx) + v10 * sx
        const bottom = v01 * (1 - sx) + v11 * sx
        this.noiseBuffer[y * w + x] = top * (1 - sy) + bottom * sy
      }
    }

    // Add high-frequency detail noise (layered)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const highFreq = (Math.random() - 0.5) * 0.3
        this.noiseBuffer[y * w + x] = this.noiseBuffer[y * w + x] * 0.7 + (0.5 + highFreq) * 0.3
      }
    }
  }

  /**
   * Estimate scene brightness from a source image frame.
   * Updates the sceneBrightness option for environment-adaptive rendering.
   */
  estimateSceneBrightness(imageData: Uint8ClampedArray, sampleRate: number = 16): number {
    let totalBrightness = 0
    let samples = 0

    for (let i = 0; i < imageData.length; i += 4 * sampleRate) {
      const r = imageData[i]
      const g = imageData[i + 1]
      const b = imageData[i + 2]
      // Perceived brightness (ITU-R BT.709)
      totalBrightness += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      samples++
    }

    const brightness = samples > 0 ? totalBrightness / samples : 0.5
    this.options.sceneBrightness = brightness
    return brightness
  }

  /**
   * Set the finish type (applies preset)
   */
  setFinish(finish: FinishType): void {
    this.options.finish = finish
    const preset = FINISH_PRESETS[finish]
    Object.assign(this.options, preset)
  }

  /**
   * Update individual options
   */
  updateOptions(opts: Partial<GlossOptions>): void {
    Object.assign(this.options, opts)
    // Regenerate noise if texture changes significantly
    if (opts.textureNoise !== undefined) {
      this.noiseBuffer = null // Force regeneration
    }
  }

  /**
   * Get current options (for UI display)
   */
  getOptions(): Readonly<GlossOptions> {
    return { ...this.options }
  }
}

/**
 * Utility: Integrate GlossRenderer into the NailRenderer pipeline.
 * 
 * Usage in NailRenderer.blendOverlay():
 * 
 * ```ts
 * const glossRenderer = new GlossRenderer({ finish: 'glossy' })
 * // After creating overlay ImageData:
 * const glossyOverlay = glossRenderer.applyGloss(overlay.data, mask, width, height)
 * // Then blend glossyOverlay with source
 * ```
 */
export function createGlossPreset(name: string): Partial<GlossOptions> {
  const presets: Record<string, Partial<GlossOptions>> = {
    'salon-glossy': { finish: 'glossy', specularIntensity: 0.5, fresnelIntensity: 0.2 },
    'natural-matte': { finish: 'matte', specularIntensity: 0.03, textureNoise: 0.08 },
    'party-shimmer': { finish: 'shimmer', specularIntensity: 0.6, textureNoise: 0.12 },
    'mirror-chrome': { finish: 'chrome', specularIntensity: 0.8, fresnelIntensity: 0.4 },
    'cozy-velvet': { finish: 'velvet', specularIntensity: 0.08, textureNoise: 0.15 },
    'jelly-transparent': { finish: 'glossy', jellyTransparency: 0.5, specularIntensity: 0.35 },
  }

  return presets[name] ?? presets['salon-glossy']
}
