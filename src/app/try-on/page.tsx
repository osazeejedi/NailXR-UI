'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Save, Share2, Download, Palette, Sparkles, 
  RotateCcw, Zap, Heart, ShoppingBag, Settings, Camera,
  Image as ImageIcon, Grid3x3, Upload, X
} from 'lucide-react'
import Link from 'next/link'
import { SalonInventoryManager, type DesignTemplate } from '@/lib/inventory'
import { useTheme, useTenantStyle } from '@/components/ThemeProvider'
import { usePerformanceMonitor } from '@/lib/performance'
import BookingModal from '@/components/BookingModal'
import type { HandLandmark } from '@/ai/nail-detection/NailDetector'

// Dynamically import components
const HandModel = dynamic(() => import('@/components/3d/HandModel'), { ssr: false })
const ARCamera = dynamic(() => import('@/components/ar/ARCamera'), { ssr: false })
const ARSegmentationOverlay = dynamic(() => import('@/components/ar/ARSegmentationOverlay'), { ssr: false })
const ARPhotoMode = dynamic(() => import('@/components/ar/ARPhotoMode'), { ssr: false })
const ARMultiPreview = dynamic(() => import('@/components/ar/ARMultiPreview'), { ssr: false })
const ARDesignUploader = dynamic(() => import('@/components/ar/ARDesignUploader'), { ssr: false })

type ViewMode = '3d' | 'camera' | 'photo' | 'multi' | 'upload'

export default function TryOnPage() {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('camera')
  const [handSide, setHandSide] = useState<'left' | 'right'>('right')
  
  // Design state
  const [designs, setDesigns] = useState<DesignTemplate[]>([])
  const [selectedDesign, setSelectedDesign] = useState<DesignTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [customColor, setCustomColor] = useState('#FF6B9D')
  const [isCustomMode, setIsCustomMode] = useState(false)
  
  // UI state
  const [showSettings, setShowSettings] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedBookingLook, setSelectedBookingLook] = useState<any>(null)
  
  // AR state
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [handLandmarks, setHandLandmarks] = useState<HandLandmark[] | null>(null)
  const [salonId] = useState('default-salon')
  
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  
  // Hooks
  const { tenant } = useTheme()
  const { getStyle } = useTenantStyle()
  const { metrics, reset: resetPerformance } = usePerformanceMonitor(viewMode === 'camera')

  // Load designs from inventory
  useEffect(() => {
    const loadDesigns = async () => {
      try {
        const available = await SalonInventoryManager.getAvailableDesigns(salonId)
        setDesigns(available)
        
        if (available.length > 0 && !selectedDesign) {
          setSelectedDesign(available[0])
        }
      } catch (error) {
        console.error('Failed to load designs:', error)
      }
    }
    
    loadDesigns()
  }, [salonId, selectedDesign])

  const filteredDesigns = selectedCategory === 'all' 
    ? designs 
    : designs.filter(design => design.category === selectedCategory)

  const categories = [
    { id: 'all', name: 'All Designs', icon: '✨' },
    { id: 'french', name: 'French', icon: '💅' },
    { id: 'ombre', name: 'Ombré', icon: '🌈' },
    { id: 'geometric', name: 'Geometric', icon: '🔷' },
    { id: 'floral', name: 'Floral', icon: '🌸' },
    { id: 'abstract', name: 'Abstract', icon: '🎨' },
    { id: 'seasonal', name: 'Seasonal', icon: '🍂' }
  ]

  const toggleFavorite = useCallback((designId: string) => {
    setFavorites(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    )
  }, [])

  const handleBookAppointment = useCallback(() => {
    if (!selectedDesign) return
    
    setSelectedBookingLook({
      name: selectedDesign.name,
      nailColor: isCustomMode ? customColor : selectedDesign.requiredColors[0],
      nailStyle: selectedDesign.category,
      estimatedPrice: selectedDesign.basePrice,
      estimatedDuration: selectedDesign.estimatedTime
    })
    setBookingModalOpen(true)
  }, [selectedDesign, isCustomMode, customColor])

  const currentNailColor = isCustomMode ? customColor : (selectedDesign?.requiredColors[0] || '#FF6B9D')
  const mapCategoryToPattern = (category: string): 'solid' | 'gradient' | 'french' | 'ombre' | 'glitter' => {
    switch (category) {
      case 'french': return 'french'
      case 'ombre': return 'ombre'
      case 'geometric': return 'gradient'
      case 'floral': return 'glitter'
      default: return 'solid'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Design Selection */}
      <div className="w-80 bg-white shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-4">
              <img 
                src={tenant.branding.logo} 
                alt={tenant.content.companyName}
                className="h-6 w-6"
              />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Try-On</h1>
          <p className="text-gray-600 text-sm">{tenant.content.tagline}</p>
        </div>

        {/* Mode Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isCustomMode 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="h-4 w-4 inline mr-2" />
              Designs
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isCustomMode 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Palette className="h-4 w-4 inline mr-2" />
              Custom
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isCustomMode ? (
            <>
              {/* Categories */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-pink-50 text-pink-700 border border-pink-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Design Grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredDesigns.map((design) => (
                    <motion.div
                      key={design.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDesign(design)}
                      className={`relative cursor-pointer rounded-lg border-2 transition-colors overflow-hidden ${
                        selectedDesign?.id === design.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <div 
                          className="w-16 h-16 rounded-full"
                          style={{ backgroundColor: design.requiredColors[0] || '#FF6B9D' }}
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">{design.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">${design.basePrice}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{design.estimatedTime}min</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(design.id)
                            }}
                            className="p-1"
                          >
                            <Heart 
                              className={`h-4 w-4 ${
                                favorites.includes(design.id) 
                                  ? 'text-red-500 fill-current' 
                                  : 'text-gray-400'
                              }`} 
                            />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Custom Color Mode */
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Custom Color</h3>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-full h-32 rounded-lg border border-gray-300 cursor-pointer"
              />
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Selected Color</h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border border-gray-300"
                    style={{ backgroundColor: customColor }}
                  />
                  <span className="font-mono text-sm text-gray-600">{customColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBookAppointment}
            disabled={!selectedDesign}
            style={getStyle('gradient')}
            className="w-full text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShoppingBag className="h-5 w-5" />
            Book Appointment
          </motion.button>
        </div>
      </div>

      {/* Right Side - AR Visualization */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isCustomMode ? 'Custom Design' : selectedDesign?.name || 'Select a Design'}
              </h2>
              <p className="text-gray-600">
                {isCustomMode ? `Color: ${customColor}` : selectedDesign?.description || 'Choose from our collection'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    viewMode === '3d' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="3D Model"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('camera')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'camera' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Live AR"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('photo')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'photo' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Photo Upload"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('multi')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'multi' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Compare"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('upload')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'upload' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Upload Design"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>

              {/* Hand Side Toggle (only for 3D mode) */}
              {viewMode === '3d' && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setHandSide('left')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      handSide === 'left' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => setHandSide('right')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      handSide === 'right' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Right
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visualization Container */}
        <div className="flex-1 p-8">
          <div className="h-full bg-white rounded-2xl shadow-lg overflow-hidden relative">
            {viewMode === '3d' && (
              <HandModel 
                nailColor={currentNailColor}
                nailStyle={isCustomMode ? 'custom' : selectedDesign?.name || 'default'}
                handSide={handSide}
                interactive={true}
              />
            )}

            {viewMode === 'camera' && (
              <>
                <ARCamera
                  isActive={true}
                  onHandsDetected={(results) => {
                    setHandLandmarks(results.multiHandLandmarks?.[0] || null)
                    if (!videoRef.current && results.image) {
                      // Extract video element from MediaPipe results if available
                      const video = document.querySelector('video')
                      if (video) {
                        videoRef.current = video as HTMLVideoElement
                        setVideoElement(video as HTMLVideoElement)
                      }
                    }
                  }}
                  onCameraReady={() => {
                    const video = document.querySelector('video')
                    if (video) {
                      videoRef.current = video as HTMLVideoElement
                      setVideoElement(video as HTMLVideoElement)
                    }
                  }}
                  className="w-full h-full"
                />
                
                {videoElement && (
                  <ARSegmentationOverlay
                    videoElement={videoElement}
                    handLandmarks={handLandmarks}
                    initialColor={currentNailColor}
                    initialPattern={selectedDesign ? mapCategoryToPattern(selectedDesign.category) : 'solid'}
                    showDebugInfo={showSettings}
                  />
                )}
              </>
            )}

            {viewMode === 'photo' && (
              <ARPhotoMode
                initialColor={currentNailColor}
                initialPattern={selectedDesign ? mapCategoryToPattern(selectedDesign.category) : 'solid'}
              />
            )}

            {viewMode === 'multi' && (
              <ARMultiPreview
                videoElement={videoElement}
                handLandmarks={handLandmarks}
                designs={designs.slice(0, 4)}
                onSelectDesign={(designId) => {
                  const design = designs.find(d => d.id === designId)
                  if (design) setSelectedDesign(design)
                }}
                onBookDesign={(designId) => {
                  const design = designs.find(d => d.id === designId)
                  if (design) {
                    setSelectedDesign(design)
                    handleBookAppointment()
                  }
                }}
                onFavoriteDesign={toggleFavorite}
                favorites={favorites}
              />
            )}

            {viewMode === 'upload' && (
              <ARDesignUploader
                onDesignSelected={(design) => {
                  console.log('Custom design selected:', design)
                  // In future, apply custom texture to nails
                }}
              />
            )}

            {/* Performance Overlay */}
            {showSettings && metrics && viewMode === 'camera' && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono">
                <div>FPS: {metrics.fps}</div>
                <div>Memory: {metrics.memoryUsage}MB</div>
                <div>Nails: {metrics.nailsDetected}</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info Panel */}
        {selectedDesign && viewMode !== 'upload' && (
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">${selectedDesign.basePrice}</div>
                  <div className="text-gray-600">Price</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedDesign.estimatedTime}min</div>
                  <div className="text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 capitalize">{selectedDesign.difficulty}</div>
                  <div className="text-gray-600">Difficulty</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedLook={selectedBookingLook}
      />

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Monitoring
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span>FPS:</span>
                      <span className="font-mono">{metrics?.fps || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span className="font-mono">{metrics?.memoryUsage || 0}MB</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Debug Mode
                  </label>
                  <button
                    onClick={resetPerformance}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                  >
                    Reset Metrics
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
