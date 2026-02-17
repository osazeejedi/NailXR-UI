/**
 * Mask Temporal Stabilizer
 * Eliminates flicker/jitter in segmentation masks across video frames.
 * 
 * Uses EMA (Exponential Moving Average) on raw mask values + morphological
 * cleanup + edge feathering for production-quality AR overlay.
 * 
 * This is the #1 perceived quality improvement — users don't notice 0.002 IoU
 * but they absolutely notice flicker.
 */

export interface MaskStabilizerOptions {
  /** EMA blend factor for temporal smoothing (0.0-1.0). Lower = smoother but laggier. Default: 0.35 */
  temporalAlpha: number
  /** Number of recent masks to keep for weighted blend. Default: 3 */
  historySize: number
  /** Gaussian blur radius for edge feathering (pixels). Default: 2 */
  featherRadius: number
  /** Enable morphological open/close to clean jagged edges. Default: true */
  morphologicalCleanup: boolean
  /** Morphological kernel size (must be odd). Default: 3 */
  morphKernelSize: number
  /** Minimum mask change to trigger update (prevents micro-flicker). Default: 0.02 */
  changeThreshold: number
  /** Maximum frames to hold a stale mask before forcing update. Default: 30 */
  maxStaleFrames: number
}

const DEFAULT_OPTIONS: MaskStabilizerOptions = {
  temporalAlpha: 0.35,
  historySize: 3,
  featherRadius: 2,
  morphologicalCleanup: true,
  morphKernelSize: 3,
  changeThreshold: 0.02,
  maxStaleFrames: 30,
}

export class MaskStabilizer {
  private options: MaskStabilizerOptions
  private maskHistory: Float32Array[] = []
  private stableMask: Float32Array | null = null
  private maskWidth = 0
  private maskHeight = 0
  private staleFrameCount = 0
  private frameCount = 0
  private handLostFrames = 0
  private readonly HAND_LOST_THRESHOLD = 5 // Frames with no/tiny mask before resetting

  constructor(options: Partial<MaskStabilizerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Process a new raw segmentation mask and return a stabilized version.
   * Call this every frame with the raw model output.
   */
  stabilize(rawMask: Float32Array, width: number, height: number): Float32Array {
    this.frameCount++

    // Detect hand lost (mask is mostly empty)
    const maskActivity = this.computeMaskActivity(rawMask)
    if (maskActivity < 0.001) {
      this.handLostFrames++
      if (this.handLostFrames > this.HAND_LOST_THRESHOLD) {
        this.reset()
        return rawMask
      }
      // Return last stable mask for a few frames to avoid flash-off
      return this.stableMask ?? rawMask
    }
    this.handLostFrames = 0

    // Handle dimension changes (shouldn't happen but be safe)
    if (width !== this.maskWidth || height !== this.maskHeight) {
      this.reset()
      this.maskWidth = width
      this.maskHeight = height
    }

    // First frame: initialize directly
    if (!this.stableMask) {
      this.maskWidth = width
      this.maskHeight = height
      let processed = rawMask
      if (this.options.morphologicalCleanup) {
        processed = this.morphologicalClean(processed, width, height)
      }
      processed = this.featherEdges(processed, width, height)
      this.stableMask = new Float32Array(processed)
      this.maskHistory.push(new Float32Array(processed))
      return processed
    }

    // Check if change is significant enough to update
    const change = this.computeMaskDifference(rawMask, this.stableMask)
    this.staleFrameCount++

    if (change < this.options.changeThreshold && this.staleFrameCount < this.options.maxStaleFrames) {
      // Minor change — return existing stable mask (anti-flicker)
      return this.stableMask
    }

    this.staleFrameCount = 0

    // Add to history
    this.maskHistory.push(new Float32Array(rawMask))
    if (this.maskHistory.length > this.options.historySize) {
      this.maskHistory.shift()
    }

    // Temporal blend: weighted average of history + EMA with current stable
    let blended = this.temporalBlend(rawMask)

    // Morphological cleanup (remove jagged pixels, fill small holes)
    if (this.options.morphologicalCleanup) {
      blended = this.morphologicalClean(blended, width, height)
    }

    // Edge feathering (smooth boundary for realistic overlay)
    blended = this.featherEdges(blended, width, height)

    // EMA with previous stable mask
    const alpha = this.options.temporalAlpha
    const result = new Float32Array(blended.length)
    for (let i = 0; i < result.length; i++) {
      result[i] = alpha * blended[i] + (1 - alpha) * this.stableMask[i]
    }

    this.stableMask = result
    return result
  }

  /**
   * Temporal blend of mask history using weighted average.
   * Recent frames get more weight.
   */
  private temporalBlend(currentMask: Float32Array): Float32Array {
    if (this.maskHistory.length <= 1) return currentMask

    const result = new Float32Array(currentMask.length)
    const numMasks = this.maskHistory.length + 1 // history + current

    // Weights: exponentially increasing for more recent frames
    let totalWeight = 0
    const weights: number[] = []
    for (let i = 0; i < this.maskHistory.length; i++) {
      const w = Math.pow(2, i)
      weights.push(w)
      totalWeight += w
    }
    // Current frame weight
    const currentWeight = Math.pow(2, this.maskHistory.length)
    totalWeight += currentWeight

    // Weighted blend
    for (let px = 0; px < result.length; px++) {
      let val = 0
      for (let i = 0; i < this.maskHistory.length; i++) {
        val += this.maskHistory[i][px] * (weights[i] / totalWeight)
      }
      val += currentMask[px] * (currentWeight / totalWeight)
      result[px] = val
    }

    return result
  }

  /**
   * Morphological open (erode→dilate) then close (dilate→erode).
   * Removes small noise, fills tiny holes, smooths jagged edges.
   */
  private morphologicalClean(mask: Float32Array, w: number, h: number): Float32Array {
    const k = this.options.morphKernelSize
    const half = Math.floor(k / 2)

    // Erode: take min in neighborhood (removes thin protrusions)
    let eroded = new Float32Array(mask.length)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let minVal = 1.0
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky
            const nx = x + kx
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              minVal = Math.min(minVal, mask[ny * w + nx])
            } else {
              minVal = 0 // Boundary = 0
            }
          }
        }
        eroded[y * w + x] = minVal
      }
    }

    // Dilate: take max in neighborhood (fills small gaps)
    let dilated = new Float32Array(eroded.length)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let maxVal = 0.0
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky
            const nx = x + kx
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              maxVal = Math.max(maxVal, eroded[ny * w + nx])
            }
          }
        }
        dilated[y * w + x] = maxVal
      }
    }

    // Close: dilate then erode (fills small holes)
    let dilated2 = new Float32Array(dilated.length)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let maxVal = 0.0
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky
            const nx = x + kx
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              maxVal = Math.max(maxVal, dilated[ny * w + nx])
            }
          }
        }
        dilated2[y * w + x] = maxVal
      }
    }

    let result = new Float32Array(dilated2.length)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let minVal = 1.0
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky
            const nx = x + kx
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              minVal = Math.min(minVal, dilated2[ny * w + nx])
            } else {
              minVal = 0
            }
          }
        }
        result[y * w + x] = minVal
      }
    }

    return result
  }

  /**
   * Gaussian-like edge feathering for smooth, anti-aliased mask boundaries.
   * Makes the overlay blend naturally with skin instead of having hard pixel edges.
   */
  private featherEdges(mask: Float32Array, w: number, h: number): Float32Array {
    const radius = this.options.featherRadius
    if (radius <= 0) return mask

    // Build 1D Gaussian kernel
    const kernelSize = radius * 2 + 1
    const kernel = new Float32Array(kernelSize)
    const sigma = radius / 2.0
    let kernelSum = 0
    for (let i = 0; i < kernelSize; i++) {
      const x = i - radius
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma))
      kernelSum += kernel[i]
    }
    for (let i = 0; i < kernelSize; i++) kernel[i] /= kernelSum

    // Two-pass separable Gaussian blur (horizontal then vertical)
    // Only blur pixels near mask edges (optimization)

    // Detect edge pixels (where mask transitions)
    const isEdge = new Uint8Array(mask.length)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x
        const val = mask[idx]
        // Check 4 neighbors for transition
        if (
          Math.abs(val - mask[idx - 1]) > 0.1 ||
          Math.abs(val - mask[idx + 1]) > 0.1 ||
          Math.abs(val - mask[(y - 1) * w + x]) > 0.1 ||
          Math.abs(val - mask[(y + 1) * w + x]) > 0.1
        ) {
          // Mark this pixel and neighborhood as needing blur
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const ny = y + dy, nx = x + dx
              if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                isEdge[ny * w + nx] = 1
              }
            }
          }
        }
      }
    }

    // Horizontal pass
    const hBlurred = new Float32Array(mask)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isEdge[y * w + x]) continue
        let sum = 0
        for (let k = 0; k < kernelSize; k++) {
          const nx = x + k - radius
          const clamped = Math.max(0, Math.min(w - 1, nx))
          sum += mask[y * w + clamped] * kernel[k]
        }
        hBlurred[y * w + x] = sum
      }
    }

    // Vertical pass
    const result = new Float32Array(hBlurred)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isEdge[y * w + x]) continue
        let sum = 0
        for (let k = 0; k < kernelSize; k++) {
          const ny = y + k - radius
          const clamped = Math.max(0, Math.min(h - 1, ny))
          sum += hBlurred[clamped * w + x] * kernel[k]
        }
        result[y * w + x] = sum
      }
    }

    return result
  }

  /**
   * Compute fraction of mask that is "active" (non-zero)
   */
  private computeMaskActivity(mask: Float32Array): number {
    let active = 0
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0.3) active++
    }
    return active / mask.length
  }

  /**
   * Compute mean absolute difference between two masks
   */
  private computeMaskDifference(a: Float32Array, b: Float32Array): number {
    let diff = 0
    const len = Math.min(a.length, b.length)
    for (let i = 0; i < len; i++) {
      diff += Math.abs(a[i] - b[i])
    }
    return diff / len
  }

  /**
   * Reset state (call when hand is lost/reappears or camera changes)
   */
  reset(): void {
    this.maskHistory = []
    this.stableMask = null
    this.staleFrameCount = 0
    this.frameCount = 0
    this.handLostFrames = 0
  }

  /**
   * Dynamically adjust smoothing parameters.
   * E.g., increase smoothing when hand is still, decrease when moving fast.
   */
  updateOptions(opts: Partial<MaskStabilizerOptions>): void {
    Object.assign(this.options, opts)
  }

  /**
   * Get stabilization metrics for debugging/dashboard
   */
  getMetrics(): {
    framesProcessed: number
    historyDepth: number
    staleFrames: number
    isStable: boolean
  } {
    return {
      framesProcessed: this.frameCount,
      historyDepth: this.maskHistory.length,
      staleFrames: this.staleFrameCount,
      isStable: this.staleFrameCount > 0,
    }
  }
}

/**
 * Adaptive mask stabilizer that adjusts smoothing based on hand movement.
 * Pairs with AdaptiveHandStabilizer for coordinated smoothing.
 */
export class AdaptiveMaskStabilizer extends MaskStabilizer {
  private recentDiffs: number[] = []
  private readonly diffHistorySize = 10
  private lastMask: Float32Array | null = null

  stabilize(rawMask: Float32Array, width: number, height: number): Float32Array {
    // Track movement via mask difference
    if (this.lastMask && this.lastMask.length === rawMask.length) {
      let diff = 0
      for (let i = 0; i < rawMask.length; i++) {
        diff += Math.abs(rawMask[i] - this.lastMask[i])
      }
      diff /= rawMask.length

      this.recentDiffs.push(diff)
      if (this.recentDiffs.length > this.diffHistorySize) {
        this.recentDiffs.shift()
      }

      const avgDiff = this.recentDiffs.reduce((a, b) => a + b, 0) / this.recentDiffs.length

      if (avgDiff > 0.05) {
        // Hand moving fast — reduce smoothing to stay responsive
        this.updateOptions({
          temporalAlpha: 0.55,
          changeThreshold: 0.005,
          featherRadius: 1,
        })
      } else if (avgDiff < 0.01) {
        // Hand very still — heavy smoothing for maximum stability
        this.updateOptions({
          temporalAlpha: 0.2,
          changeThreshold: 0.03,
          featherRadius: 3,
        })
      } else {
        // Moderate movement — balanced
        this.updateOptions({
          temporalAlpha: 0.35,
          changeThreshold: 0.02,
          featherRadius: 2,
        })
      }
    }

    this.lastMask = new Float32Array(rawMask)
    return super.stabilize(rawMask, width, height)
  }

  reset(): void {
    super.reset()
    this.recentDiffs = []
    this.lastMask = null
  }
}
