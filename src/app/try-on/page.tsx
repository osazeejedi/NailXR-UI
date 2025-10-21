'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Save, Share2, Download, Palette, Sparkles, 
  RotateCcw, Zap, Heart, ShoppingBag, Settings, Eye, EyeOff, Camera
} from 'lucide-react'
import Link from 'next/link'
import { SalonInventoryManager } from '@/lib/inventory'

// Dynamically import HandModel to avoid SSR issues
const HandModel = dynamic(() => import('@/components/3d/HandModel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading 3D Model...</div>
    </div>
  )
})

// Dynamically import AR components
const ARCamera = dynamic(() => import('@/components/ar/ARCamera'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-white">Loading AR Camera...</div>
    </div>
  )
})

const ARNailOverlay = dynamic(() => import('@/components/ar/ARNailOverlay'), {
  ssr: false
})

interface NailDesign {
  id: string
  name: string
  category: string
  colors: string[]
  price: number
  duration: number
  image: string
  description: string
  featured: boolean
}

const nailDesigns: NailDesign[] = [
  {
    id: '1',
    name: 'Classic French',
    category: 'elegant',
    colors: ['#FFFFFF', '#FFC0CB'],
    price: 45,
    duration: 60,
    image: '/api/placeholder/150/150',
    description: 'Timeless French manicure with a modern twist',
    featured: true
  },
  {
    id: '2',
    name: 'Rose Gold Glam',
    category: 'glamorous',
    colors: ['#E8B4B8', '#FFD700'],
    price: 65,
    duration: 90,
    image: '/api/placeholder/150/150',
    description: 'Luxurious rose gold with glitter accents',
    featured: true
  },
  {
    id: '3',
    name: 'Ocean Gradient',
    category: 'modern',
    colors: ['#4ECDC4', '#45B7D1', '#96CEB4'],
    price: 55,
    duration: 75,
    image: '/api/placeholder/150/150',
    description: 'Beautiful ocean-inspired gradient design',
    featured: false
  },
  {
    id: '4',
    name: 'Matte Black',
    category: 'sophisticated',
    colors: ['#000000'],
    price: 40,
    duration: 45,
    image: '/api/placeholder/150/150',
    description: 'Bold and sophisticated matte finish',
    featured: false
  },
  {
    id: '5',
    name: 'Holographic Dreams',
    category: 'futuristic',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7'],
    price: 75,
    duration: 120,
    image: '/api/placeholder/150/150',
    description: 'Stunning holographic effect with rainbow shimmer',
    featured: true
  },
  {
    id: '6',
    name: 'Minimalist Nude',
    category: 'natural',
    colors: ['#F5DEB3', '#E6C2A6'],
    price: 35,
    duration: 40,
    image: '/api/placeholder/150/150',
    description: 'Natural and elegant nude tones',
    featured: false
  }
]

const categories = [
  { id: 'all', name: 'All Designs', icon: '✨' },
  { id: 'elegant', name: 'Elegant', icon: '💎' },
  { id: 'glamorous', name: 'Glamorous', icon: '✨' },
  { id: 'modern', name: 'Modern', icon: '🎨' },
  { id: 'sophisticated', name: 'Sophisticated', icon: '🖤' },
  { id: 'futuristic', name: 'Futuristic', icon: '🌈' },
  { id: 'natural', name: 'Natural', icon: '🌿' }
]

const customColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0A0A0', '#FFB347', '#87CEEB', '#98FB98',
  '#FFB6C1', '#20B2AA', '#87CEFA', '#98FB98', '#F0E68C',
  '#DDA0DD', '#F4A460', '#FF7F50', '#6495ED', '#90EE90'
]

export default function TryOnPage() {
  const [selectedDesign, setSelectedDesign] = useState<NailDesign>(nailDesigns[0])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [customColor, setCustomColor] = useState('#FF6B6B')
  const [handSide, setHandSide] = useState<'left' | 'right'>('right')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [isARMode, setIsARMode] = useState(false)
  const [selectedSalon] = useState('salon-1') // Default salon for demo
  const [arHandResults, setArHandResults] = useState<any>(null)

  const filteredDesigns = selectedCategory === 'all' 
    ? nailDesigns 
    : nailDesigns.filter(design => design.category === selectedCategory)

  const toggleFavorite = useCallback((designId: string) => {
    setFavorites(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    )
  }, [])

  const handleSaveDesign = useCallback(() => {
    // Implementation for saving design
    console.log('Saving design:', selectedDesign)
  }, [selectedDesign])

  const currentNailColor = isCustomMode ? customColor : selectedDesign.colors[0]

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
                src="/NailXR-symbol.png" 
                alt="NailXR" 
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
          <p className="text-gray-600 text-sm">Choose your perfect nail design</p>
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
                        selectedDesign.id === design.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <div 
                          className="w-16 h-16 rounded-full"
                          style={{ backgroundColor: design.colors[0] }}
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">{design.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">${design.price}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{design.duration}min</span>
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
                      {design.featured && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                          Popular
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Custom Color Mode */
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Custom Colors</h3>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {customColors.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCustomColor(color)}
                    className={`w-full aspect-square rounded-lg border-4 transition-colors ${
                      customColor === color ? 'border-gray-900' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Color Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Color
                </label>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
              </div>

              {/* Color Info */}
              <div className="bg-gray-50 rounded-lg p-4">
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
            onClick={handleSaveDesign}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            Save This Look
          </motion.button>
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* Right Side - 3D Visualization */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isCustomMode ? 'Custom Design' : selectedDesign.name}
              </h2>
              <p className="text-gray-600">
                {isCustomMode ? `Color: ${customColor}` : selectedDesign.description}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* AR Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setIsARMode(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isARMode 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="h-4 w-4 inline mr-2" />
                  3D Model
                </button>
                <button
                  onClick={() => setIsARMode(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isARMode 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Camera className="h-4 w-4 inline mr-2" />
                  AR Try-On
                </button>
              </div>

              {/* Hand Side Toggle (only for 3D mode) */}
              {!isARMode && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setHandSide('left')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      handSide === 'left' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Left Hand
                  </button>
                  <button
                    onClick={() => setHandSide('right')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      handSide === 'right' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Right Hand
                  </button>
                </div>
              )}

              {/* Book Appointment Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Book Appointment
              </motion.button>
            </div>
          </div>
        </div>

        {/* Visualization Container */}
        <div className="flex-1 p-8">
          <div className="h-full bg-white rounded-2xl shadow-lg overflow-hidden relative">
            {isARMode ? (
              <ARCamera
                isActive={isARMode}
                onHandsDetected={setArHandResults}
                onCameraReady={() => console.log('AR Camera ready')}
                onCameraError={(error) => console.error('AR Camera error:', error)}
                overlayComponent={(props) => (
                  <ARNailOverlay
                    {...props}
                    salonId={selectedSalon}
                    selectedDesignId={selectedDesign.id}
                    onDesignChange={(designId) => {
                      const design = nailDesigns.find(d => d.id === designId)
                      if (design) setSelectedDesign(design)
                    }}
                    onAddToCart={(designId) => {
                      console.log('Add to cart:', designId)
                      // Implement booking functionality
                    }}
                    onSaveToFavorites={(designId) => {
                      toggleFavorite(designId)
                    }}
                  />
                )}
                className="w-full h-full"
              />
            ) : (
              <HandModel 
                nailColor={currentNailColor}
                nailStyle={isCustomMode ? 'custom' : selectedDesign.name}
                handSide={handSide}
                interactive={true}
              />
            )}
          </div>
        </div>

        {/* Bottom Info Panel */}
        {!isCustomMode && (
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">${selectedDesign.price}</div>
                  <div className="text-gray-600">Average Price</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedDesign.duration}min</div>
                  <div className="text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">4.8★</div>
                  <div className="text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  <Eye className="h-5 w-5" />
                </button>
              </div>
              
              {/* Settings content would go here */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lighting
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue="50"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Quality
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
