'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  Download,
  Share2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react'
import { useNailSegmentation } from '@/hooks/useNailSegmentation'
import type { HandLandmark } from '@/ai/nail-detection/NailDetector'
import ARSegmentationOverlay from './ARSegmentationOverlay'

interface ARPhotoModeProps {
  onClose?: () => void
  initialColor?: string
  initialPattern?: 'solid' | 'gradient' | 'french' | 'ombre' | 'glitter'
  className?: string
}

export default function ARPhotoMode({
  onClose,
  initialColor = '#FF6B9D',
  initialPattern = 'solid',
  className = ''
}: ARPhotoModeProps) {
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [handLandmarks, setHandLandmarks] = useState<HandLandmark[] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      // Read file as data URL
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        const imgUrl = event.target?.result as string
        setImageUrl(imgUrl)

        // Create image element
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = async () => {
          setUploadedImage(img)
          
          // Detect hands in uploaded image
          await detectHandsInImage(img)
          setIsProcessing(false)
        }

        img.onerror = () => {
          setError('Failed to load image')
          setIsProcessing(false)
        }

        img.src = imgUrl
      }

      reader.onerror = () => {
        setError('Failed to read file')
        setIsProcessing(false)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to process image')
      setIsProcessing(false)
    }
  }, [])

  /**
   * Detect hands in static image using MediaPipe
   */
  const detectHandsInImage = async (img: HTMLImageElement) => {
    try {
      // Load MediaPipe Hands if not already loaded
      if (typeof window === 'undefined' || !window.Hands) {
        setError('MediaPipe not loaded. Please try live camera mode first.')
        return
      }

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

      // Process image once
      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Use the first detected hand
          setHandLandmarks(results.multiHandLandmarks[0])
        } else {
          setError('No hands detected in image. Try another photo.')
        }
        hands.close()
      })

      await hands.send({ image: img })
    } catch (err) {
      console.error('Hand detection error:', err)
      setError('Failed to detect hands in image')
    }
  }

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file) {
      // Simulate file input change
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        handleFileUpload({ target: fileInputRef.current } as any)
      }
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /**
   * Download rendered image
   */
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `nailxr-photo-${Date.now()}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }, 'image/jpeg', 0.95)
  }, [])

  /**
   * Share image
   */
  const handleShare = useCallback(async () => {
    if (!canvasRef.current) return

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => b && resolve(b), 'image/jpeg', 0.95)
      })

      const file = new File([blob], 'nailxr-design.jpg', { type: 'image/jpeg' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'NailXR Design',
          text: 'Check out this nail design!',
          files: [file]
        })
      } else {
        // Fallback: download instead
        handleDownload()
      }
    } catch (err) {
      console.error('Share error:', err)
    }
  }, [handleDownload])

  /**
   * Reset and upload new image
   */
  const handleReset = useCallback(() => {
    setUploadedImage(null)
    setImageUrl(null)
    setHandLandmarks(null)
    setError(null)
    setZoom(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-pink-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Photo AR Mode</h2>
              <p className="text-sm text-gray-600">Upload a photo to try nail designs</p>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!uploadedImage ? (
          /* Upload Zone */
          <div
            className="flex-1 flex items-center justify-center p-8"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="max-w-md w-full">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-pink-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload a Photo
                </h3>
                <p className="text-gray-600 mb-6">
                  Drag and drop an image here, or click to browse
                </p>
                <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
                  <p className="mb-2">Tips for best results:</p>
                  <ul className="text-left space-y-1">
                    <li>• Show open hands with fingers spread</li>
                    <li>• Good lighting and sharp focus</li>
                    <li>• Supported: JPG, PNG, WebP</li>
                    <li>• Max size: 10MB</li>
                  </ul>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {isProcessing && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
                    Processing image...
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Image Display with AR Overlay */
          <>
            <div
              ref={imageContainerRef}
              className="flex-1 relative bg-black flex items-center justify-center overflow-hidden"
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain"
                  style={{ transform: `scale(${zoom})` }}
                />
              )}

              {/* AR Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `scale(${zoom})` }}
              />

              {handLandmarks && uploadedImage && (
                <ARSegmentationOverlay
                  videoElement={null}
                  handLandmarks={handLandmarks}
                  initialColor={initialColor}
                  initialPattern={initialPattern}
                  className="pointer-events-auto"
                />
              )}

              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100 shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg"
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="absolute top-4 left-4 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              {/* Status Messages */}
              {!handLandmarks && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black bg-opacity-50 text-white p-6 rounded-xl text-center max-w-sm">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No Hands Detected</p>
                    <p className="text-sm text-gray-300">
                      Upload a photo with visible hands to see AR nail designs
                    </p>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded-xl text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-900 font-medium">Detecting hands...</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Info Panel */}
      {!uploadedImage && (
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Upload Photo</h3>
              <p className="text-sm text-gray-600">
                Choose a photo with your hands visible
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Try Designs</h3>
              <p className="text-sm text-gray-600">
                Apply different nail designs and patterns
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Save & Share</h3>
              <p className="text-sm text-gray-600">
                Download or share your customized look
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Extend window interface for MediaPipe
declare global {
  interface Window {
    Hands: any
  }
}
