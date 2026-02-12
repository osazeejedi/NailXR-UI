'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  Sparkles, 
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save, 
  Share2 
} from 'lucide-react'
import { saveARLook } from '@/lib/saved-looks'
import { useRouter } from 'next/navigation'
import { useNailSegmentation } from '@/hooks/useNailSegmentation'
import AuthModal from '@/components/auth/AuthModal'
import type { HandLandmark } from '@/ai/nail-detection/NailDetector'

interface ARSegmentationOverlayProps {
  videoElement: HTMLVideoElement | null
  handLandmarks: HandLandmark[] | null
  initialColor?: string
  initialPattern?: 'solid' | 'gradient' | 'french' | 'ombre' | 'glitter'
  onNailsDetected?: (count: number) => void
  showDebugInfo?: boolean
  className?: string
}

const PATTERN_OPTIONS = [
  { id: 'solid', name: 'Solid', icon: '⬤' },
  { id: 'gradient', name: 'Gradient', icon: '🌈' },
  { id: 'french', name: 'French', icon: '💅' },
  { id: 'ombre', name: 'Ombré', icon: '🎨' },
  { id: 'glitter', name: 'Glitter', icon: '✨' }
] as const

const PRESET_COLORS = [
  { name: 'Rose', hex: '#FF6B9D' },
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Lavender', hex: '#DDA0DD' },
  { name: 'Mint', hex: '#4ECDC4' },
  { name: 'Sky', hex: '#45B7D1' },
  { name: 'Peach', hex: '#FFB347' },
  { name: 'Ruby', hex: '#E74C3C' },
  { name: 'Navy', hex: '#34495E' }
]

export default function ARSegmentationOverlay({
  videoElement,
  handLandmarks,
  initialColor = '#FF6B9D',
  initialPattern = 'solid',
  onNailsDetected,
  showDebugInfo = false,
  className = ''
}: ARSegmentationOverlayProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [selectedPattern, setSelectedPattern] = useState<'solid' | 'gradient' | 'french' | 'ombre' | 'glitter'>(initialPattern)
  const [opacity, setOpacity] = useState(0.8)
  const [showControls, setShowControls] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()

  // Use nail segmentation hook
  const {
    nailRegions,
    isProcessing,
    error,
    renderFrame,
    updateRenderOptions,
    captureFrame
  } = useNailSegmentation(handLandmarks, {
    videoElement,
    enableSegmentation: true,
    renderOptions: {
      color: selectedColor,
      opacity,
      pattern: selectedPattern
    },
    confidenceThreshold: 0.5
  })

  // Notify parent of nail detection
  useEffect(() => {
    if (onNailsDetected) {
      onNailsDetected(nailRegions.length)
    }
  }, [nailRegions.length, onNailsDetected])

  // Update render options when changed
  useEffect(() => {
    updateRenderOptions({
      color: selectedColor,
      opacity,
      pattern: selectedPattern
    })
  }, [selectedColor, opacity, selectedPattern, updateRenderOptions])

  // Animation loop for rendering
  useEffect(() => {
    if (!overlayCanvasRef.current) return

    const canvas = overlayCanvasRef.current

    const animate = () => {
      renderFrame(canvas)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [renderFrame])

  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color)
  }, [])

  const handlePatternChange = useCallback((pattern: typeof selectedPattern) => {
    setSelectedPattern(pattern)
  }, [])

  const handleCapture = useCallback(async (action: 'download' | 'save' = 'download') => {
    const imageData = captureFrame()
    if (!imageData) return

    // Convert ImageData to blob
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    ctx.putImageData(imageData, 0, 0)
    
    canvas.toBlob(async (blob) => {
      if (!blob) return

      if (action === 'download') {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `nailxr-capture-${Date.now()}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (action === 'save') {
        setIsSaving(true)
        setSaveMessage(null)
        
        try {
          // Generate a name based on date/time
          const date = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })
          const name = `${PATTERN_OPTIONS.find(p => p.id === selectedPattern)?.name || 'Custom'} Look - ${date}`
          
          await saveARLook({
            name,
            color_hex: selectedColor,
            notes: `Pattern: ${selectedPattern}, Opacity: ${Math.round(opacity * 100)}%`,
          }, blob)
          
          setSaveMessage({ type: 'success', text: 'Look saved successfully!' })
          
          // Redirect to saved looks after short delay
          setTimeout(() => {
            router.push('/saved-looks')
          }, 1500)
        } catch (err: unknown) {
          const error = err as Error
          console.error('Failed to save look:', error)
          
          if (error.message?.includes('User must be logged in')) {
            setShowAuthModal(true)
            setSaveMessage(null) // Clear error since we are handling it
          } else {
            setSaveMessage({ type: 'error', text: 'Failed to save look. Please try again.' })
          }
        } finally {
          setIsSaving(false)
        }
      }
    }, 'image/png', 0.95)
  }, [captureFrame, selectedColor, selectedPattern, opacity, router])

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Main rendering canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'normal' }}
      />

      {/* Status Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 bg-blue-500 bg-opacity-90 text-white px-3 py-2 rounded-full text-sm"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </motion.div>
          )}

          {!isProcessing && nailRegions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 bg-green-500 bg-opacity-90 text-white px-3 py-2 rounded-full text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              {nailRegions.length} nail{nailRegions.length !== 1 ? 's' : ''} detected
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 bg-orange-500 bg-opacity-90 text-white px-3 py-2 rounded-full text-sm max-w-xs"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all z-10"
      >
        {showControls ? <Zap className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
      </button>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-20 right-4 w-72 bg-white rounded-xl shadow-2xl overflow-hidden z-10"
          >
            <div className="p-4">
              {/* Pattern Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pattern
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PATTERN_OPTIONS.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => handlePatternChange(pattern.id as typeof selectedPattern)}
                      className={`p-3 rounded-lg text-center transition-all ${
                        selectedPattern === pattern.id
                          ? 'bg-pink-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={pattern.name}
                    >
                      <div className="text-2xl">{pattern.icon}</div>
                      <div className="text-xs mt-1">{pattern.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => handleColorChange(color.hex)}
                      className={`w-full aspect-square rounded-lg border-4 transition-all ${
                        selectedColor === color.hex
                          ? 'border-gray-900 scale-110 shadow-lg'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Opacity
                  </label>
                  <span className="text-sm text-gray-600">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity * 100}
                  onChange={(e) => setOpacity(parseFloat(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCapture('download')}
                  disabled={nailRegions.length === 0}
                  className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    nailRegions.length > 0
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </button>

                <button
                  onClick={() => handleCapture('save')}
                  disabled={nailRegions.length === 0 || isSaving}
                  className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    nailRegions.length > 0
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Look'}
                </button>
              </div>

              {/* Save Message */}
              <AnimatePresence>
                {saveMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-3 p-2 rounded text-sm text-center ${
                      saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {saveMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Info */}
      {showDebugInfo && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono max-w-md z-10">
          <div>Nails Detected: {nailRegions.length}</div>
          <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
          <div>Pattern: {selectedPattern}</div>
          <div>Color: {selectedColor}</div>
          <div>Opacity: {(opacity * 100).toFixed(0)}%</div>
          {error && <div className="text-red-400 mt-2">Error: {error}</div>}
          {nailRegions.length > 0 && (
            <div className="mt-2">
              <div>Nail Confidence:</div>
              {nailRegions.map((region, index) => (
                <div key={index} className="ml-2">
                  {region.fingerName}: {(region.confidence * 100).toFixed(0)}%
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Guidance when no hands detected */}
      {!handLandmarks && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black bg-opacity-50 text-white p-8 rounded-2xl text-center max-w-md">
            <div className="text-6xl mb-4">✋</div>
            <div className="text-xl font-semibold mb-2">Show Your Hands</div>
            <div className="text-sm text-gray-200">
              Hold your hands in front of the camera with fingers spread out for best results
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
