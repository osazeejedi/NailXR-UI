'use client'

import React, { useRef, useEffect, useState } from 'react'
import { DesignTemplate, SalonInventoryManager, NailColor } from '@/lib/inventory'
import { formatCurrency } from '@/lib/revenue'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Palette, 
  Clock, 
  DollarSign,
  Check,
  Heart,
  ShoppingBag
} from 'lucide-react'

// Define types for hand tracking results
interface HandResults {
  multiHandLandmarks?: Array<Array<{x: number, y: number, z?: number}>>
  multiHandedness?: Array<{label: string, score: number}>
}

interface ARNailOverlayProps {
  handLandmarks: HandResults | null
  salonId: string
  selectedDesignId?: string
  onDesignChange?: (designId: string) => void
  onAddToCart?: (designId: string) => void
  onSaveToFavorites?: (designId: string) => void
}

interface NailPosition {
  x: number
  y: number
  size: number
  rotation: number
}

export default function ARNailOverlay({
  handLandmarks,
  salonId,
  selectedDesignId,
  onDesignChange,
  onAddToCart,
  onSaveToFavorites
}: ARNailOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [availableDesigns, setAvailableDesigns] = useState<DesignTemplate[]>([])
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0)
  const [nailPositions, setNailPositions] = useState<NailPosition[]>([])
  const [showControls, setShowControls] = useState(true)
  const [inventory, setInventory] = useState<any>(null)
  const [designAvailability, setDesignAvailability] = useState<any>(null)

  // Load available designs for salon
  useEffect(() => {
    const loadDesigns = async () => {
      const designs = await SalonInventoryManager.getAvailableDesigns(salonId)
      setAvailableDesigns(designs)
      
      if (selectedDesignId) {
        const index = designs.findIndex(d => d.id === selectedDesignId)
        if (index >= 0) {
          setCurrentDesignIndex(index)
        }
      }
    }
    
    loadDesigns()
  }, [salonId, selectedDesignId])

  // Calculate nail positions from hand landmarks
  useEffect(() => {
    if (!handLandmarks?.multiHandLandmarks || !overlayRef.current) {
      setNailPositions([])
      return
    }

    const positions: NailPosition[] = []
    const overlay = overlayRef.current
    const rect = overlay.getBoundingClientRect()

    for (const landmarks of handLandmarks.multiHandLandmarks) {
      // Fingertip landmark indices for MediaPipe hands
      const fingertipIndices = [4, 8, 12, 16, 20] // Thumb, Index, Middle, Ring, Pinky
      
      fingertipIndices.forEach(index => {
        const landmark = landmarks[index]
        if (landmark) {
          // Convert normalized coordinates to pixel coordinates
          const x = landmark.x * rect.width
          const y = landmark.y * rect.height
          
          // Calculate nail size based on hand size (distance between wrist and middle finger)
          const wrist = landmarks[0]
          const middleFinger = landmarks[12]
          const handSize = Math.sqrt(
            Math.pow((middleFinger.x - wrist.x) * rect.width, 2) +
            Math.pow((middleFinger.y - wrist.y) * rect.height, 2)
          )
          const nailSize = Math.max(8, handSize * 0.08) // Scale nail size based on hand size
          
          // Calculate rotation based on finger direction
          const fingerBase = landmarks[index - 3] || wrist
          const rotation = Math.atan2(
            landmark.y - fingerBase.y,
            landmark.x - fingerBase.x
          ) * (180 / Math.PI)

          positions.push({
            x,
            y,
            size: nailSize,
            rotation
          })
        }
      })
    }

    setNailPositions(positions)
  }, [handLandmarks])

  const currentDesign = availableDesigns[currentDesignIndex]
  
  // Load design availability and inventory when design changes
  useEffect(() => {
    const loadDesignData = async () => {
      if (currentDesign) {
        const [availability, inventoryData] = await Promise.all([
          SalonInventoryManager.checkDesignAvailability(salonId, currentDesign.id),
          SalonInventoryManager.getSalonInventory(salonId)
        ])
        setDesignAvailability(availability)
        setInventory(inventoryData)
      }
    }
    
    loadDesignData()
  }, [currentDesign, salonId])

  const nextDesign = () => {
    const newIndex = (currentDesignIndex + 1) % availableDesigns.length
    setCurrentDesignIndex(newIndex)
    onDesignChange?.(availableDesigns[newIndex]?.id)
  }

  const previousDesign = () => {
    const newIndex = currentDesignIndex === 0 ? availableDesigns.length - 1 : currentDesignIndex - 1
    setCurrentDesignIndex(newIndex)
    onDesignChange?.(availableDesigns[newIndex]?.id)
  }

  const getNailColors = (): NailColor[] => {
    if (!currentDesign || !inventory) return []

    return currentDesign.requiredColors
      .map(colorId => inventory.colors?.find((c: any) => c.id === colorId))
      .filter(Boolean)
      .map((dbColor: any) => ({
        id: dbColor.id,
        name: dbColor.name,
        brand: dbColor.brand,
        hex: dbColor.hex,
        finish: dbColor.finish,
        quantity: dbColor.quantity,
        price: dbColor.price,
        inStock: dbColor.in_stock
      }))
  }

  if (!handLandmarks || !currentDesign || availableDesigns.length === 0) {
    return null
  }

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
      {/* Nail overlays */}
      {nailPositions.map((position, index) => (
        <div
          key={index}
          className="absolute pointer-events-none"
          style={{
            left: position.x - position.size / 2,
            top: position.y - position.size / 2,
            width: position.size,
            height: position.size * 1.4, // Nails are oval-shaped
            transform: `rotate(${position.rotation}deg)`
          }}
        >
          {/* Base nail shape */}
          <div
            className="w-full h-full rounded-full opacity-80 shadow-lg"
            style={{
              background: createNailGradient(currentDesign, getNailColors()),
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' // Nail shape
            }}
          />
          
          {/* Design pattern overlay */}
          {currentDesign.category === 'french' && (
            <div
              className="absolute inset-0 rounded-full opacity-70"
              style={{
                background: 'linear-gradient(to bottom, transparent 60%, white 60%)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
              }}
            />
          )}
          
          {currentDesign.category === 'geometric' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-2 h-2 bg-white opacity-80 rounded-full"
                style={{ transform: 'scale(0.3)' }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Design Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 pointer-events-auto"
          >
            <div className="bg-black bg-opacity-75 rounded-xl p-4 text-white min-w-[280px]">
              {/* Design Info */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-1">{currentDesign.name}</h3>
                <p className="text-sm text-gray-300 mb-2">{currentDesign.description}</p>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {currentDesign.estimatedTime}min
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(designAvailability?.estimatedPrice || 0)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    {currentDesign.difficulty}
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mb-4">
                <div className="text-xs text-gray-300 mb-2">Colors Used:</div>
                <div className="flex gap-2">
                  {getNailColors().map(color => (
                    <div
                      key={color.id}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.brand} ${color.name}`}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={previousDesign}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-sm">
                  {currentDesignIndex + 1} of {availableDesigns.length}
                </span>
                
                <button
                  onClick={nextDesign}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveToFavorites?.(currentDesign.id)}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Heart className="h-4 w-4" />
                  Save
                </button>
                
                <button
                  onClick={() => onAddToCart?.(currentDesign.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Book
                </button>
              </div>

              {/* Availability Status */}
              {designAvailability && (
                <div className="mt-3 text-xs">
                  {designAvailability.available ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <Check className="h-3 w-3" />
                      Available now
                    </div>
                  ) : (
                    <div className="text-yellow-400">
                      {designAvailability.missingColors.length > 0 && (
                        <div>Missing colors needed</div>
                      )}
                      {designAvailability.missingMaterials.length > 0 && (
                        <div>Missing materials needed</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Controls Button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 pointer-events-auto z-10"
        style={{ display: showControls ? 'none' : 'block' }}
      >
        <Palette className="h-5 w-5 text-white" />
      </button>

      {/* Design Carousel (bottom) */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex gap-2 bg-black bg-opacity-50 rounded-full p-2">
          {availableDesigns.slice(0, 5).map((design, index) => (
            <button
              key={design.id}
              onClick={() => {
                setCurrentDesignIndex(index)
                onDesignChange?.(design.id)
              }}
              className={`w-12 h-12 rounded-full border-2 overflow-hidden ${
                index === currentDesignIndex ? 'border-white' : 'border-gray-400'
              }`}
            >
              <div
                className="w-full h-full"
                style={{
                  background: createNailGradient(design, getNailColors()),
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Hand detection overlay for better UX */}
      {nailPositions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 text-white p-6 rounded-xl text-center">
            <div className="text-4xl mb-2">✋</div>
            <div className="font-medium mb-1">Show your hands</div>
            <div className="text-sm text-gray-300">
              Hold your hands in front of the camera to see nail designs
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to create nail gradient based on design and colors
function createNailGradient(design: DesignTemplate, colors: NailColor[]): string {
  if (colors.length === 0) return '#FFB6C1' // Default pink

  const primaryColor = colors[0]?.hex || '#FFB6C1'
  const secondaryColor = colors[1]?.hex || primaryColor

  switch (design.category) {
    case 'french':
      return `linear-gradient(to bottom, ${primaryColor} 60%, white 60%)`
    case 'ombre':
      return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
    case 'geometric':
      return primaryColor
    case 'floral':
      return `radial-gradient(circle, ${primaryColor}, ${secondaryColor})`
    default:
      return primaryColor
  }
}
