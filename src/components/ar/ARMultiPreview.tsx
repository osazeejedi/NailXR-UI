'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Check,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react'
import type { DesignTemplate } from '@/lib/inventory'
import type { HandLandmark } from '@/ai/nail-detection/NailDetector'

interface ARMultiPreviewProps {
  videoElement: HTMLVideoElement | null
  handLandmarks: HandLandmark[] | null
  designs: DesignTemplate[]
  maxPreviews?: number
  onSelectDesign?: (designId: string) => void
  onBookDesign?: (designId: string) => void
  onFavoriteDesign?: (designId: string) => void
  favorites?: string[]
  className?: string
}

interface PreviewSlot {
  design: DesignTemplate | null
  position: number
}

export default function ARMultiPreview({
  videoElement,
  handLandmarks,
  designs,
  maxPreviews = 4,
  onSelectDesign,
  onBookDesign,
  onFavoriteDesign,
  favorites = [],
  className = ''
}: ARMultiPreviewProps) {
  const [slots, setSlots] = useState<PreviewSlot[]>(() =>
    Array.from({ length: Math.min(maxPreviews, 4) }, (_, i) => ({
      design: designs[i] || null,
      position: i
    }))
  )
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * Update design in specific slot
   */
  const updateSlot = useCallback((slotIndex: number, design: DesignTemplate) => {
    setSlots(prev => prev.map((slot, i) =>
      i === slotIndex ? { ...slot, design } : slot
    ))
  }, [])

  /**
   * Navigate to next design for a slot
   */
  const nextDesign = useCallback((slotIndex: number) => {
    const currentDesign = slots[slotIndex]?.design
    if (!currentDesign) return

    const currentIndex = designs.findIndex(d => d.id === currentDesign.id)
    const nextIndex = (currentIndex + 1) % designs.length
    updateSlot(slotIndex, designs[nextIndex])
  }, [slots, designs, updateSlot])

  /**
   * Navigate to previous design for a slot
   */
  const previousDesign = useCallback((slotIndex: number) => {
    const currentDesign = slots[slotIndex]?.design
    if (!currentDesign) return

    const currentIndex = designs.findIndex(d => d.id === currentDesign.id)
    const prevIndex = currentIndex === 0 ? designs.length - 1 : currentIndex - 1
    updateSlot(slotIndex, designs[prevIndex])
  }, [slots, designs, updateSlot])

  /**
   * Render individual preview slot
   */
  const renderPreviewSlot = useCallback((slot: PreviewSlot, index: number) => {
    const { design } = slot
    if (!design) return null

    const isSelected = selectedSlot === index
    const isFavorite = favorites.includes(design.id)

    return (
      <motion.div
        key={index}
        layout
        onClick={() => setSelectedSlot(index)}
        className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
          isSelected
            ? 'ring-4 ring-pink-500 shadow-2xl'
            : 'ring-2 ring-gray-200 hover:ring-gray-300'
        }`}
      >
        {/* Mini AR Preview */}
        <div className="aspect-video bg-gray-900 relative">
          {/* Simplified preview - in production this would render actual AR */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full"
              style={{ backgroundColor: design.requiredColors[0] || '#FF6B9D' }}
            />
          </div>

          {/* Hand detection indicator */}
          {handLandmarks && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 bg-opacity-80 text-white text-xs rounded-full">
              Live
            </div>
          )}

          {/* Navigation arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              previousDesign(index)
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextDesign(index)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Design Info */}
        <div className="bg-white p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                {design.name}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-1">
                {design.description}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteDesign?.(design.id)
              }}
              className="p-1 flex-shrink-0"
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>${design.basePrice}</span>
            <span>{design.estimatedTime}min</span>
            <span className="capitalize">{design.difficulty}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectDesign?.(design.id)
              }}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
            >
              <Check className="h-3 w-3" />
              Select
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBookDesign?.(design.id)
              }}
              className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
            >
              <ShoppingBag className="h-3 w-3" />
              Book
            </button>
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </motion.div>
    )
  }, [
    selectedSlot,
    favorites,
    handLandmarks,
    onSelectDesign,
    onBookDesign,
    onFavoriteDesign,
    previousDesign,
    nextDesign
  ])

  /**
   * Toggle fullscreen for selected slot
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  return (
    <div className={`relative h-full ${className}`}>
      {!isFullscreen ? (
        /* Grid View */
        <div className="h-full p-4 overflow-y-auto">
          <div className={`grid gap-4 ${
            slots.length === 1
              ? 'grid-cols-1'
              : slots.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 lg:grid-cols-2'
          }`}>
            {slots.map((slot, index) => renderPreviewSlot(slot, index))}
          </div>

          {/* Add More Button */}
          {slots.length < maxPreviews && designs.length > slots.length && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const nextDesign = designs.find(d =>
                  !slots.some(s => s.design?.id === d.id)
                )
                if (nextDesign) {
                  setSlots([...slots, { design: nextDesign, position: slots.length }])
                }
              }}
              className="mt-4 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors"
            >
              + Add Another Design to Compare
            </motion.button>
          )}

          {/* Comparison Tips */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">
              Comparison Tips
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Click any preview to focus and see details</li>
              <li>• Use arrows to browse designs in each slot</li>
              <li>• Favorite designs for quick access later</li>
              <li>• Book directly from the preview</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Fullscreen View */
        <div className="h-full bg-black relative">
          <div className="h-full flex items-center justify-center p-8">
            {slots[selectedSlot]?.design && (
              <div className="max-w-2xl w-full">
                {renderPreviewSlot(slots[selectedSlot], selectedSlot)}
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-3 bg-white bg-opacity-20 text-white rounded-full hover:bg-opacity-30"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Fullscreen Toggle (when not in fullscreen) */}
      {!isFullscreen && slots[selectedSlot]?.design && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 bg-white shadow-lg rounded-lg hover:bg-gray-50 z-10"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      )}

      {/* No Designs Warning */}
      {designs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Designs Available
            </h3>
            <p className="text-gray-600">
              Load some nail designs to start comparing
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
