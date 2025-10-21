'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera as CameraIcon, 
  CameraOff, 
  RotateCcw, 
  Download,
  Share2,
  Maximize,
  X
} from 'lucide-react'

interface ARCameraProps {
  isActive: boolean
  onHandsDetected?: (results: any) => void
  onCameraReady?: () => void
  onCameraError?: (error: string) => void
  overlayComponent?: React.ComponentType<{ handLandmarks: any }>
  className?: string
}

export interface HandLandmark {
  x: number
  y: number
  z: number
}

export interface DetectedHand {
  landmarks: HandLandmark[]
  handedness: string
  confidence: number
}

// MediaPipe hand landmark indices
const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_TIP: 16,
  PINKY_TIP: 20
}

export default function ARCamera({
  isActive,
  onHandsDetected,
  onCameraReady,
  onCameraError,
  overlayComponent: OverlayComponent,
  className = ''
}: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [currentResults, setCurrentResults] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user')
  const [handsModel, setHandsModel] = useState<any>(null)

  // Load MediaPipe from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadMediaPipe = async () => {
      try {
        // Load MediaPipe scripts from CDN
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')

        // Initialize MediaPipe Hands
        if (window.Hands) {
          const hands = new window.Hands({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            }
          })

          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          })

          hands.onResults((results: any) => {
            setCurrentResults(results)
            onHandsDetected?.(results)
            drawResults(results)
          })

          setHandsModel(hands)
        }
      } catch (err) {
        console.error('Failed to load MediaPipe:', err)
        setError('Failed to load hand tracking. Using fallback mode.')
      }
    }

    loadMediaPipe()
  }, [onHandsDetected])

  // Load script helper
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Draw hand landmarks
  const drawResults = (results: any) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (results.multiHandLandmarks && window.drawConnectors && window.drawLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        })
        window.drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3
        })
      }
    }
  }

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      setHasPermission(true)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }

      onCameraReady?.()

      // Start hand detection if MediaPipe is loaded
      if (handsModel && videoRef.current) {
        const detectHands = async () => {
          if (videoRef.current && handsModel) {
            await handsModel.send({ image: videoRef.current })
          }
          requestAnimationFrame(detectHands)
        }
        detectHands()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied'
      setError(errorMessage)
      setHasPermission(false)
      onCameraError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [cameraFacing, handsModel, onCameraReady, onCameraError])

  // Start camera when hands model is ready
  useEffect(() => {
    if (isActive && handsModel && !stream) {
      initializeCamera()
    }
  }, [isActive, handsModel, stream, initializeCamera])

  // Update canvas size when video loads
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas) {
      const updateCanvasSize = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      video.addEventListener('loadedmetadata', updateCanvasSize)
      return () => video.removeEventListener('loadedmetadata', updateCanvasSize)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (handsModel) {
        handsModel.close()
      }
    }
  }, [stream, handsModel])

  const handleFlipCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user')
  }

  const handleTakePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const photoCanvas = document.createElement('canvas')
    const ctx = photoCanvas.getContext('2d')
    if (!ctx) return

    photoCanvas.width = video.videoWidth
    photoCanvas.height = video.videoHeight

    // Draw video frame
    ctx.drawImage(video, 0, 0)

    // Draw hand landmarks overlay
    if (currentResults?.multiHandLandmarks && window.drawConnectors && window.drawLandmarks) {
      for (const landmarks of currentResults.multiHandLandmarks) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 3
        })
        window.drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          lineWidth: 2,
          radius: 4
        })
      }
    }

    // Download photo
    photoCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `nailxr-ar-${Date.now()}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }, 'image/jpeg', 0.9)
  }

  const handleShare = async () => {
    if (!navigator.share) {
      alert('Sharing not supported on this device')
      return
    }

    try {
      await navigator.share({
        title: 'NailXR AR Try-On',
        text: 'Check out my nail design with NailXR AR!',
        url: window.location.href
      })
    } catch (err) {
      console.log('Share cancelled or failed')
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isActive) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative bg-black rounded-lg overflow-hidden ${
          isFullscreen ? 'fixed inset-0 z-50' : ''
        } ${className}`}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Initializing camera and hand tracking...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
            <div className="text-center text-red-800 p-8">
              <CameraOff className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
              <p className="mb-4">{error}</p>
              <button
                onClick={initializeCamera}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Permission Request */}
        {hasPermission === false && !error && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
            <div className="text-center p-8">
              <CameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Camera Permission Required</h3>
              <p className="text-gray-600 mb-4">
                Allow camera access to use AR nail try-on
              </p>
              <button
                onClick={initializeCamera}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Enable Camera
              </button>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Hand Tracking Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Custom Overlay Component */}
        {OverlayComponent && currentResults && (
          <div className="absolute inset-0 pointer-events-none">
            <OverlayComponent handLandmarks={currentResults} />
          </div>
        )}

        {/* Control Panel */}
        {hasPermission && !error && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-black bg-opacity-50 rounded-full p-2">
              <button
                onClick={handleTakePhoto}
                className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                title="Take Photo"
              >
                <Download className="h-5 w-5 text-white" />
              </button>
              
              <button
                onClick={handleFlipCamera}
                className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                title="Flip Camera"
              >
                <RotateCcw className="h-5 w-5 text-white" />
              </button>

              <button
                onClick={handleShare}
                className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                title="Share"
              >
                <Share2 className="h-5 w-5 text-white" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                title="Fullscreen"
              >
                <Maximize className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Close Button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        )}

        {/* Hand Detection Indicator */}
        {currentResults?.multiHandLandmarks && currentResults.multiHandLandmarks.length > 0 && (
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 bg-green-500 bg-opacity-80 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              {currentResults.multiHandLandmarks.length} hand(s) detected
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Extend window interface for MediaPipe globals
declare global {
  interface Window {
    Hands: any
    drawConnectors: any
    drawLandmarks: any
    HAND_CONNECTIONS: any
  }
}
