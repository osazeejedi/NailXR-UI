/**
 * React hook for nail segmentation and AR overlay
 * Integrates MediaPipe, nail detection, and rendering
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { NailDetector, type NailRegion, type HandLandmark } from '@/ai/nail-detection/NailDetector'
import { NailRenderer, type RenderOptions, type NailMask } from '@/ai/rendering/NailRenderer'
import { ImageProcessor } from '@/ai/preprocessing/ImageProcessor'
import { HandStabilizer } from '@/ai/stabilization/HandStabilizer'
import { AdaptiveMaskStabilizer } from '@/ai/stabilization/MaskStabilizer'
import { GlossRenderer } from '@/ai/rendering/GlossRenderer'
import type { FinishType } from '@/ai/rendering/GlossRenderer'

export interface UseNailSegmentationOptions {
  videoElement?: HTMLVideoElement | null
  enableSegmentation?: boolean
  renderOptions?: RenderOptions
  confidenceThreshold?: number
}

export interface NailSegmentationResult {
  nailRegions: NailRegion[]
  isProcessing: boolean
  error: string | null
  renderFrame: (canvas: HTMLCanvasElement) => void
  updateRenderOptions: (options: Partial<RenderOptions>) => void
  captureFrame: () => ImageData | null
}

export function useNailSegmentation(
  handLandmarks: HandLandmark[] | null,
  options: UseNailSegmentationOptions = {}
): NailSegmentationResult {
  const {
    videoElement,
    enableSegmentation = true,
    renderOptions: initialRenderOptions,
    confidenceThreshold = 0.5
  } = options

  const [nailRegions, setNailRegions] = useState<NailRegion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [renderOptions, setRenderOptions] = useState<RenderOptions>(
    initialRenderOptions || {
      color: '#FF6B9D',
      opacity: 0.8,
      pattern: 'solid'
    }
  )

  const nailDetectorRef = useRef<NailDetector | null>(null)
  const rendererRef = useRef<NailRenderer | null>(null)
  const imageProcessorRef = useRef<ImageProcessor | null>(null)
  const handStabilizerRef = useRef<HandStabilizer | null>(null)
  const maskStabilizerRef = useRef<AdaptiveMaskStabilizer | null>(null)
  const glossRendererRef = useRef<GlossRenderer | null>(null)
  const lastRenderTimeRef = useRef<number>(0)

  // Initialize AI components
  useEffect(() => {
    if (!videoElement) return

    const width = videoElement.videoWidth || 1280
    const height = videoElement.videoHeight || 720

    nailDetectorRef.current = new NailDetector(width, height)
    rendererRef.current = new NailRenderer()
    imageProcessorRef.current = new ImageProcessor()
    handStabilizerRef.current = new HandStabilizer({
      processNoise: 0.005,
      measurementNoise: 0.05,
      smoothingFactor: 0.3
    })
    maskStabilizerRef.current = new AdaptiveMaskStabilizer()
    glossRendererRef.current = new GlossRenderer({ finish: 'glossy' })

    return () => {
      rendererRef.current?.dispose()
      imageProcessorRef.current?.dispose()
      handStabilizerRef.current?.reset()
      maskStabilizerRef.current?.reset()
    }
  }, [videoElement])

  // Update video dimensions when they change
  useEffect(() => {
    if (!videoElement || !nailDetectorRef.current) return

    const updateDimensions = () => {
      if (videoElement.videoWidth && videoElement.videoHeight) {
        nailDetectorRef.current?.setImageDimensions(
          videoElement.videoWidth,
          videoElement.videoHeight
        )
      }
    }

    videoElement.addEventListener('loadedmetadata', updateDimensions)
    updateDimensions()

    return () => {
      videoElement.removeEventListener('loadedmetadata', updateDimensions)
    }
  }, [videoElement])

  // Process hand landmarks and detect nails
  useEffect(() => {
    if (!handLandmarks || !enableSegmentation || !nailDetectorRef.current) {
      setNailRegions([])
      // Reset stabilizers when hands are lost
      handStabilizerRef.current?.reset()
      maskStabilizerRef.current?.reset()
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      // Apply stabilization to reduce jitter
      const stabilizedLandmarks = handStabilizerRef.current
        ? handStabilizerRef.current.stabilize(handLandmarks)
        : handLandmarks

      // Check if hand is suitable for detection
      const suitability = nailDetectorRef.current.isHandSuitable(stabilizedLandmarks)
      if (!suitability.suitable) {
        setError(suitability.reason || 'Hand not suitable for detection')
        setNailRegions([])
        setIsProcessing(false)
        return
      }

      // Detect nail regions from stabilized landmarks
      const detected = nailDetectorRef.current.detectNails(stabilizedLandmarks)
      
      // Filter by confidence
      const filtered = nailDetectorRef.current.filterByConfidence(
        detected,
        confidenceThreshold
      )

      setNailRegions(filtered)
      setIsProcessing(false)
    } catch (err) {
      console.error('Nail detection error:', err)
      setError(err instanceof Error ? err.message : 'Detection failed')
      setNailRegions([])
      setIsProcessing(false)
    }
  }, [handLandmarks, enableSegmentation, confidenceThreshold])

  // Render frame with nail overlays
  const renderFrame = useCallback((canvas: HTMLCanvasElement) => {
    if (
      !videoElement ||
      !rendererRef.current ||
      nailRegions.length === 0 ||
      !canvas
    ) {
      return
    }

    // Throttle rendering to maintain performance
    const now = performance.now()
    if (now - lastRenderTimeRef.current < 100) { // ~10 FPS for rendering
      return
    }
    lastRenderTimeRef.current = now

    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size to match video
      if (canvas.width !== videoElement.videoWidth || canvas.height !== videoElement.videoHeight) {
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
      }

      // Draw video frame
      ctx.drawImage(videoElement, 0, 0)

      // For now, use simplified circular nail rendering
      // (Will be enhanced with actual segmentation masks)
      nailRegions.forEach((region) => {
        const { center, boundingBox, rotation } = region

        ctx.save()
        ctx.translate(center.x, center.y)
        ctx.rotate((rotation * Math.PI) / 180)

        // Create nail-shaped overlay
        const width = boundingBox.width * 0.6
        const height = boundingBox.height * 0.7

        // Draw nail shape (oval)
        ctx.beginPath()
        ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2)

        // Apply color with gradient for realism
        const gradient = ctx.createRadialGradient(0, -height / 4, 0, 0, 0, height / 2)
        gradient.addColorStop(0, renderOptions.color)
        gradient.addColorStop(1, adjustColor(renderOptions.color, -20))

        ctx.fillStyle = gradient
        ctx.globalAlpha = renderOptions.opacity
        ctx.fill()

        // Add shine effect
        ctx.beginPath()
        ctx.ellipse(-width / 4, -height / 3, width / 4, height / 6, 
                   -Math.PI / 6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fill()

        ctx.restore()
      })
    } catch (err) {
      console.error('Rendering error:', err)
    }
  }, [videoElement, nailRegions, renderOptions])

  // Capture current frame with overlays
  const captureFrame = useCallback((): ImageData | null => {
    if (!videoElement || nailRegions.length === 0) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    renderFrame(canvas)

    const ctx = canvas.getContext('2d')
    return ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null
  }, [videoElement, nailRegions, renderFrame])

  // Update render options
  const updateRenderOptions = useCallback((newOptions: Partial<RenderOptions>) => {
    setRenderOptions(prev => ({ ...prev, ...newOptions }))
  }, [])

  return {
    nailRegions,
    isProcessing,
    error,
    renderFrame,
    updateRenderOptions,
    captureFrame
  }
}

// Helper function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent))
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent))
  
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Helper function to create nail masks (simplified version without ML segmentation)
function createSimplifiedNailMask(
  region: NailRegion,
  imageWidth: number,
  imageHeight: number
): NailMask {
  const { boundingBox } = region
  const width = Math.round(boundingBox.width)
  const height = Math.round(boundingBox.height)
  
  // Create elliptical mask
  const mask = new Float32Array(width * height)
  const centerX = width / 2
  const centerY = height / 2
  const radiusX = width / 2
  const radiusY = height / 2

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / radiusX
      const dy = (y - centerY) / radiusY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Soft edges
      if (distance <= 1) {
        mask[y * width + x] = Math.max(0, 1 - distance * distance)
      }
    }
  }

  return {
    mask,
    width,
    height,
    region
  }
}
