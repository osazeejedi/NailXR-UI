/**
 * Hand Tracking Stabilization using Kalman Filtering
 * Reduces jitter and smooths hand landmark positions
 */

import type { HandLandmark } from '../nail-detection/NailDetector'

interface KalmanFilter {
  // State
  x: number // estimated position
  p: number // estimated error covariance
  
  // Model parameters
  q: number // process noise covariance
  r: number // measurement noise covariance
  
  // Kalman gain
  k: number
}

export interface StabilizationOptions {
  processNoise?: number    // q: How much we trust the process (0.001-0.01)
  measurementNoise?: number // r: How much we trust measurements (0.01-0.1)
  smoothingFactor?: number  // Exponential moving average factor (0.1-0.5)
}

export class HandStabilizer {
  private kalmanFilters: Map<string, { x: KalmanFilter; y: KalmanFilter; z: KalmanFilter }>
  protected previousLandmarks: HandLandmark[] | null = null
  private options: Required<StabilizationOptions>
  private frameCount: number = 0

  constructor(options: StabilizationOptions = {}) {
    this.kalmanFilters = new Map()
    this.options = {
      processNoise: options.processNoise ?? 0.005,
      measurementNoise: options.measurementNoise ?? 0.05,
      smoothingFactor: options.smoothingFactor ?? 0.3
    }
  }

  /**
   * Stabilize hand landmarks using Kalman filtering and exponential moving average
   */
  stabilize(landmarks: HandLandmark[]): HandLandmark[] {
    if (!landmarks || landmarks.length === 0) {
      return landmarks
    }

    // Initialize filters on first frame
    if (this.kalmanFilters.size === 0) {
      this.initializeFilters(landmarks)
      this.previousLandmarks = landmarks
      return landmarks
    }

    const stabilized: HandLandmark[] = []

    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i]
      const key = `landmark_${i}`
      const filters = this.kalmanFilters.get(key)

      if (!filters) {
        stabilized.push(landmark)
        continue
      }

      // Apply Kalman filtering to each coordinate
      const stabilizedX = this.kalmanUpdate(filters.x, landmark.x)
      const stabilizedY = this.kalmanUpdate(filters.y, landmark.y)
      const stabilizedZ = landmark.z !== undefined 
        ? this.kalmanUpdate(filters.z, landmark.z)
        : undefined

      // Apply exponential moving average for additional smoothing
      const smoothed = this.exponentialSmoothing(
        { x: stabilizedX, y: stabilizedY, z: stabilizedZ },
        this.previousLandmarks?.[i]
      )

      stabilized.push(smoothed)
    }

    this.previousLandmarks = stabilized
    this.frameCount++

    return stabilized
  }

  /**
   * Initialize Kalman filters for all landmarks
   */
  private initializeFilters(landmarks: HandLandmark[]): void {
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i]
      const key = `landmark_${i}`

      this.kalmanFilters.set(key, {
        x: this.createKalmanFilter(landmark.x),
        y: this.createKalmanFilter(landmark.y),
        z: this.createKalmanFilter(landmark.z ?? 0)
      })
    }
  }

  /**
   * Create a new Kalman filter instance
   */
  private createKalmanFilter(initialValue: number): KalmanFilter {
    return {
      x: initialValue,
      p: 1.0,
      q: this.options.processNoise,
      r: this.options.measurementNoise,
      k: 0
    }
  }

  /**
   * Kalman filter update step
   */
  private kalmanUpdate(filter: KalmanFilter, measurement: number): number {
    // Prediction
    const xPredicted = filter.x
    const pPredicted = filter.p + filter.q

    // Update
    filter.k = pPredicted / (pPredicted + filter.r)
    filter.x = xPredicted + filter.k * (measurement - xPredicted)
    filter.p = (1 - filter.k) * pPredicted

    return filter.x
  }

  /**
   * Exponential moving average smoothing
   */
  private exponentialSmoothing(
    current: { x: number; y: number; z?: number },
    previous?: HandLandmark
  ): HandLandmark {
    if (!previous) {
      return {
        x: current.x,
        y: current.y,
        z: current.z
      }
    }

    const alpha = this.options.smoothingFactor

    return {
      x: alpha * current.x + (1 - alpha) * previous.x,
      y: alpha * current.y + (1 - alpha) * previous.y,
      z: current.z !== undefined && previous.z !== undefined
        ? alpha * current.z + (1 - alpha) * previous.z
        : current.z
    }
  }

  /**
   * Reset the stabilizer (call when hand is lost then reappears)
   */
  reset(): void {
    this.kalmanFilters.clear()
    this.previousLandmarks = null
    this.frameCount = 0
  }

  /**
   * Get stabilization quality metrics
   */
  getMetrics(): {
    framesProcessed: number
    filtersActive: number
    averageJitter: number
  } {
    let totalJitter = 0
    let jitterCount = 0

    if (this.previousLandmarks && this.previousLandmarks.length > 0) {
      this.kalmanFilters.forEach((filters) => {
        totalJitter += Math.abs(filters.x.k) + Math.abs(filters.y.k)
        jitterCount += 2
      })
    }

    return {
      framesProcessed: this.frameCount,
      filtersActive: this.kalmanFilters.size,
      averageJitter: jitterCount > 0 ? totalJitter / jitterCount : 0
    }
  }

  /**
   * Update stabilization parameters dynamically
   */
  updateOptions(options: Partial<StabilizationOptions>): void {
    if (options.processNoise !== undefined) {
      this.options.processNoise = options.processNoise
      // Update all existing filters
      this.kalmanFilters.forEach((filters) => {
        filters.x.q = options.processNoise!
        filters.y.q = options.processNoise!
        filters.z.q = options.processNoise!
      })
    }

    if (options.measurementNoise !== undefined) {
      this.options.measurementNoise = options.measurementNoise
      this.kalmanFilters.forEach((filters) => {
        filters.x.r = options.measurementNoise!
        filters.y.r = options.measurementNoise!
        filters.z.r = options.measurementNoise!
      })
    }

    if (options.smoothingFactor !== undefined) {
      this.options.smoothingFactor = options.smoothingFactor
    }
  }
}

/**
 * Adaptive stabilizer that adjusts parameters based on hand movement
 */
export class AdaptiveHandStabilizer extends HandStabilizer {
  private movementHistory: number[] = []
  private readonly historySize = 10

  stabilize(landmarks: HandLandmark[]): HandLandmark[] {
    // Calculate hand movement magnitude
    const movement = this.calculateMovement(landmarks)
    this.movementHistory.push(movement)

    if (this.movementHistory.length > this.historySize) {
      this.movementHistory.shift()
    }

    // Adapt parameters based on movement
    const avgMovement = this.movementHistory.reduce((a, b) => a + b, 0) / this.movementHistory.length

    if (avgMovement > 0.05) {
      // High movement: trust measurements more, filter less
      this.updateOptions({
        processNoise: 0.01,
        measurementNoise: 0.03,
        smoothingFactor: 0.5
      })
    } else if (avgMovement < 0.01) {
      // Low movement: filter more aggressively
      this.updateOptions({
        processNoise: 0.001,
        measurementNoise: 0.1,
        smoothingFactor: 0.2
      })
    } else {
      // Medium movement: balanced approach
      this.updateOptions({
        processNoise: 0.005,
        measurementNoise: 0.05,
        smoothingFactor: 0.3
      })
    }

    return super.stabilize(landmarks)
  }

  private calculateMovement(landmarks: HandLandmark[]): number {
    if (!this.previousLandmarks || this.previousLandmarks.length !== landmarks.length) {
      return 0
    }

    let totalMovement = 0
    for (let i = 0; i < landmarks.length; i++) {
      const curr = landmarks[i]
      const prev = this.previousLandmarks[i]
      
      const dx = curr.x - prev.x
      const dy = curr.y - prev.y
      totalMovement += Math.sqrt(dx * dx + dy * dy)
    }

    return totalMovement / landmarks.length
  }

  reset(): void {
    super.reset()
    this.movementHistory = []
  }
}
