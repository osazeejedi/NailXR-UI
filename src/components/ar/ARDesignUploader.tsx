'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  Check,
  Image as ImageIcon,
  Trash2,
  Eye,
  Download,
  Sparkles
} from 'lucide-react'

interface CustomDesign {
  id: string
  name: string
  imageUrl: string
  file: File
  thumbnail: string
  createdAt: Date
}

interface ARDesignUploaderProps {
  onDesignSelected?: (design: CustomDesign) => void
  onClose?: () => void
  maxDesigns?: number
  className?: string
}

export default function ARDesignUploader({
  onDesignSelected,
  onClose,
  maxDesigns = 10,
  className = ''
}: ARDesignUploaderProps) {
  const [customDesigns, setCustomDesigns] = useState<CustomDesign[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [previewDesign, setPreviewDesign] = useState<CustomDesign | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      for (const file of files) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is too large (max 5MB)`)
          continue
        }

        if (customDesigns.length >= maxDesigns) {
          setError(`Maximum ${maxDesigns} designs reached`)
          break
        }

        // Create image URL
        const imageUrl = URL.createObjectURL(file)
        
        // Create thumbnail
        const thumbnail = await createThumbnail(file)

        const newDesign: CustomDesign = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          imageUrl,
          file,
          thumbnail,
          createdAt: new Date()
        }

        setCustomDesigns(prev => [...prev, newDesign])
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload design')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [customDesigns.length, maxDesigns])

  /**
   * Create thumbnail from image file
   */
  const createThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Create thumbnail canvas
          const canvas = document.createElement('canvas')
          const size = 200
          canvas.width = size
          canvas.height = size
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Calculate dimensions to fill square
          const scale = Math.max(size / img.width, size / img.height)
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale
          const x = (size - scaledWidth) / 2
          const y = (size - scaledHeight) / 2

          ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Delete custom design
   */
  const deleteDesign = useCallback((designId: string) => {
    setCustomDesigns(prev => {
      const design = prev.find(d => d.id === designId)
      if (design) {
        URL.revokeObjectURL(design.imageUrl)
      }
      return prev.filter(d => d.id !== designId)
    })

    if (previewDesign?.id === designId) {
      setPreviewDesign(null)
    }
  }, [previewDesign])

  /**
   * Select design for use
   */
  const selectDesign = useCallback((design: CustomDesign) => {
    onDesignSelected?.(design)
  }, [onDesignSelected])

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const dataTransfer = new DataTransfer()
      files.forEach(file => dataTransfer.items.add(file))
      
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

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-pink-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Custom Designs</h2>
              <p className="text-sm text-gray-600">
                Upload your own nail art patterns
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Upload Zone */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors cursor-pointer mb-6"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="font-semibold text-gray-900 mb-2">
            Upload Nail Art Design
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop or click to browse
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <span>PNG, JPG, WebP</span>
            <span>•</span>
            <span>Max 5MB</span>
            <span>•</span>
            <span>{customDesigns.length}/{maxDesigns} designs</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        {isUploading && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
              Uploading designs...
            </div>
          </div>
        )}

        {/* Custom Designs Grid */}
        {customDesigns.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customDesigns.map((design) => (
              <motion.div
                key={design.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-pink-400 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={design.thumbnail}
                    alt={design.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setPreviewDesign(design)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => selectDesign(design)}
                      className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600"
                      title="Use Design"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteDesign(design.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-3">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {design.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="h-1 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">No custom designs yet</p>
            <p className="text-sm text-gray-500">
              Upload your favorite nail art patterns to use in AR
            </p>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-3">💡 Design Tips</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-pink-500">•</span>
              <span>Use high-contrast images for best results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">•</span>
              <span>Square or rectangular patterns work best</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">•</span>
              <span>Transparent backgrounds are supported (PNG)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">•</span>
              <span>Designs will be scaled to fit nail size</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setPreviewDesign(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Preview Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {previewDesign.name}
                </h3>
                <button
                  onClick={() => setPreviewDesign(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Preview Image */}
              <div className="p-8 bg-gray-50">
                <img
                  src={previewDesign.imageUrl}
                  alt={previewDesign.name}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
              </div>

              {/* Preview Actions */}
              <div className="p-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    selectDesign(previewDesign)
                    setPreviewDesign(null)
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  Use This Design
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = previewDesign.imageUrl
                    a.download = previewDesign.name
                    a.click()
                  }}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    deleteDesign(previewDesign.id)
                    setPreviewDesign(null)
                  }}
                  className="px-4 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
