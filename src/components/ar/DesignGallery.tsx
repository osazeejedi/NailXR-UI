'use client'

/**
 * Design Gallery Component
 * Browse, search, and select scraped nail designs for AR try-on
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  type NailDesign,
  type DesignFilter,
  filterDesigns,
  getFilterOptions,
  loadDesignsFromLocal,
} from '@/lib/design-gallery'

interface DesignGalleryProps {
  onSelectDesign: (design: NailDesign) => void
  selectedDesignId?: string
  compact?: boolean
  maxVisible?: number
}

export default function DesignGallery({
  onSelectDesign,
  selectedDesignId,
  compact = false,
  maxVisible = 20,
}: DesignGalleryProps) {
  const [designs, setDesigns] = useState<NailDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DesignFilter>({
    status: 'approved',
    sortBy: 'quality',
    limit: maxVisible,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Load designs
  useEffect(() => {
    async function loadDesigns() {
      setLoading(true)
      try {
        const loaded = await loadDesignsFromLocal()
        setDesigns(loaded)
      } catch (err) {
        console.error('Failed to load designs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDesigns()
  }, [])

  // Get filter options from available designs
  const filterOptions = useMemo(
    () => getFilterOptions(designs),
    [designs]
  )

  // Apply filters
  const filteredDesigns = useMemo(
    () => filterDesigns(designs, {
      ...filter,
      search: searchQuery || undefined,
      style: activeCategory !== 'all' ? activeCategory : undefined,
    }),
    [designs, filter, searchQuery, activeCategory]
  )

  // Quick category tabs
  const categories = useMemo(() => {
    const top = filterOptions.styles.slice(0, 8)
    return ['all', ...top]
  }, [filterOptions])

  const handleSelectDesign = useCallback((design: NailDesign) => {
    onSelectDesign(design)
  }, [onSelectDesign])

  if (compact) {
    return (
      <CompactGallery
        designs={filteredDesigns}
        selectedId={selectedDesignId}
        onSelect={handleSelectDesign}
        loading={loading}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search nail designs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:border-pink-400/50"
        />
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-2 top-1.5 px-2 py-1 rounded-lg text-xs ${showFilters ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70'}`}
        >
          Filters
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-pink-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {cat === 'all' ? '✨ All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 p-3 bg-white/5 rounded-xl">
              <FilterSelect
                label="Shape"
                value={filter.shape}
                options={filterOptions.shapes}
                onChange={(v) => setFilter(f => ({ ...f, shape: v || undefined }))}
              />
              <FilterSelect
                label="Type"
                value={filter.type}
                options={filterOptions.types}
                onChange={(v) => setFilter(f => ({ ...f, type: v || undefined }))}
              />
              <FilterSelect
                label="Technique"
                value={filter.technique}
                options={filterOptions.techniques}
                onChange={(v) => setFilter(f => ({ ...f, technique: v || undefined }))}
              />
              <FilterSelect
                label="Sort"
                value={filter.sortBy}
                options={['quality', 'score', 'newest', 'random']}
                onChange={(v) => setFilter(f => ({ ...f, sortBy: (v as DesignFilter['sortBy']) || 'quality' }))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Design Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="text-center py-8 text-white/50 text-sm">
          <p>No designs found</p>
          <p className="text-xs mt-1">Try adjusting your filters or run the scraper first</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
          {filteredDesigns.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              isSelected={design.id === selectedDesignId}
              onClick={() => handleSelectDesign(design)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-white/40 text-center">
        {filteredDesigns.length} of {designs.length} designs
      </p>
    </div>
  )
}

// ---- Sub-components ----

function DesignCard({
  design,
  isSelected,
  onClick,
}: {
  design: NailDesign
  isSelected: boolean
  onClick: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
        isSelected ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-transparent hover:border-white/30'
      }`}
    >
      {!imageError ? (
        <img
          src={design.thumbnailUrl || design.imageUrl}
          alt={design.title}
          className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
          <span className="text-2xl">💅</span>
        </div>
      )}

      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
      )}

      {/* Quality badge */}
      {design.qualityScore >= 60 && (
        <div className="absolute top-1 right-1 bg-yellow-500/90 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          ⭐
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
          <div className="bg-pink-500 rounded-full p-1">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Title overlay on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-white truncate">{design.title}</p>
        {design.tags.length > 0 && (
          <div className="flex gap-0.5 mt-0.5 overflow-hidden">
            {design.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[8px] bg-white/20 px-1 rounded">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  )
}

function CompactGallery({
  designs,
  selectedId,
  onSelect,
  loading,
}: {
  designs: NailDesign[]
  selectedId?: string
  onSelect: (design: NailDesign) => void
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-white/10 rounded-lg animate-pulse flex-shrink-0" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {designs.slice(0, 10).map(design => (
        <motion.button
          key={design.id}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(design)}
          className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
            design.id === selectedId ? 'border-pink-500' : 'border-transparent'
          }`}
        >
          <img
            src={design.thumbnailUrl || design.imageUrl}
            alt={design.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </motion.button>
      ))}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value?: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-[10px] text-white/50 uppercase">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-0.5 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none"
      >
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
