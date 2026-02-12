/**
 * Performance Monitoring for AR System
 * Tracks FPS, latency, memory usage, and other metrics
 */

export interface PerformanceMetrics {
  fps: number
  detectionLatency: number
  renderLatency: number
  totalLatency: number
  memoryUsage: number
  nailsDetected: number
  frameCount: number
  droppedFrames: number
}

export class PerformanceMonitor {
  private frameCount: number = 0
  private droppedFrames: number = 0
  private lastFrameTime: number = performance.now()
  private fpsHistory: number[] = []
  private detectionTimes: number[] = []
  private renderTimes: number[] = []
  private readonly historySize = 30 // Keep last 30 samples

  /**
   * Mark the start of a frame
   */
  startFrame(): number {
    return performance.now()
  }

  /**
   * Mark the end of a frame and calculate FPS
   */
  endFrame(startTime: number): void {
    const now = performance.now()
    const frameTime = now - this.lastFrameTime
    
    // Calculate FPS
    const fps = 1000 / frameTime
    this.fpsHistory.push(fps)

    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift()
    }

    // Check for dropped frames (FPS < 8)
    if (fps < 8) {
      this.droppedFrames++
    }

    this.frameCount++
    this.lastFrameTime = now
  }

  /**
   * Record detection latency
   */
  recordDetectionTime(time: number): void {
    this.detectionTimes.push(time)
    if (this.detectionTimes.length > this.historySize) {
      this.detectionTimes.shift()
    }
  }

  /**
   * Record render latency
   */
  recordRenderTime(time: number): void {
    this.renderTimes.push(time)
    if (this.renderTimes.length > this.historySize) {
      this.renderTimes.shift()
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const avgFps = this.calculateAverage(this.fpsHistory)
    const avgDetection = this.calculateAverage(this.detectionTimes)
    const avgRender = this.calculateAverage(this.renderTimes)

    return {
      fps: Math.round(avgFps * 10) / 10,
      detectionLatency: Math.round(avgDetection * 10) / 10,
      renderLatency: Math.round(avgRender * 10) / 10,
      totalLatency: Math.round((avgDetection + avgRender) * 10) / 10,
      memoryUsage: this.getMemoryUsage(),
      nailsDetected: 0, // Set externally
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames
    }
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory
      return Math.round(mem.usedJSHeapSize / 1024 / 1024) // MB
    }
    return 0
  }

  /**
   * Calculate average from array
   */
  private calculateAverage(arr: number[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  /**
   * Get performance grade
   */
  getPerformanceGrade(): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    const metrics = this.getMetrics()

    if (metrics.fps >= 15 && metrics.totalLatency < 100) {
      return 'Excellent'
    } else if (metrics.fps >= 10 && metrics.totalLatency < 150) {
      return 'Good'
    } else if (metrics.fps >= 8) {
      return 'Fair'
    }
    return 'Poor'
  }

  /**
   * Get detailed performance report
   */
  getReport(): string {
    const metrics = this.getMetrics()
    const grade = this.getPerformanceGrade()

    return `
Performance Report:
==================
Grade: ${grade}
FPS: ${metrics.fps}
Detection: ${metrics.detectionLatency}ms
Rendering: ${metrics.renderLatency}ms
Total Latency: ${metrics.totalLatency}ms
Memory: ${metrics.memoryUsage}MB
Frames: ${metrics.frameCount}
Dropped: ${metrics.droppedFrames}
Drop Rate: ${((metrics.droppedFrames / metrics.frameCount) * 100).toFixed(1)}%
    `.trim()
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameCount = 0
    this.droppedFrames = 0
    this.fpsHistory = []
    this.detectionTimes = []
    this.renderTimes = []
    this.lastFrameTime = performance.now()
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2)
  }
}

/**
 * Singleton instance for global performance monitoring
 */
let globalMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor()
  }
  return globalMonitor
}

/**
 * Utility function to format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${Math.round ((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

/**
 * Utility to track async operation performance
 */
export async function trackPerformance<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - startTime
    
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    
    return { result, duration }
  } catch (error) {
    const duration = performance.now() - startTime
    console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

/**
 * React hook for performance monitoring
 */
import { useState, useEffect, useRef } from 'react'

export function usePerformanceMonitor(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const monitorRef = useRef<PerformanceMonitor>(getPerformanceMonitor())

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      setMetrics(monitorRef.current.getMetrics())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [enabled])

  return {
    metrics,
    monitor: monitorRef.current,
    reset: () => monitorRef.current.reset(),
    getReport: () => monitorRef.current.getReport()
  }
}
