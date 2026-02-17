/**
 * Design Gallery - Manages scraped nail designs for AR try-on
 * Integrates with Supabase for persistent storage
 */

import { createClient } from '@supabase/supabase-js'

export interface NailDesign {
  id: string
  title: string
  imageUrl: string
  thumbnailUrl?: string
  sourceUrl?: string
  author?: string
  subreddit?: string
  score: number
  categories: {
    styles: string[]
    shapes: string[]
    types: string[]
    techniques: string[]
    colors: string[]
  }
  tags: string[]
  qualityScore: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface DesignFilter {
  style?: string
  shape?: string
  type?: string
  technique?: string
  color?: string
  search?: string
  status?: 'pending' | 'approved' | 'rejected'
  minQuality?: number
  sortBy?: 'score' | 'quality' | 'newest' | 'random'
  limit?: number
  offset?: number
}

export interface DesignGalleryStats {
  total: number
  approved: number
  pending: number
  rejected: number
  byStyle: Record<string, number>
  byShape: Record<string, number>
  byColor: Record<string, number>
}

// Local cache for designs (works without Supabase)
let localDesignCache: NailDesign[] = []

/**
 * Load designs from local metadata file (works without Supabase)
 */
export async function loadDesignsFromLocal(): Promise<NailDesign[]> {
  try {
    const response = await fetch('/api/designs')
    if (response.ok) {
      const data = await response.json()
      localDesignCache = data.designs || []
      return localDesignCache
    }
  } catch {
    console.warn('Could not load designs from API, using cache')
  }
  return localDesignCache
}

/**
 * Search and filter designs
 */
export function filterDesigns(
  designs: NailDesign[],
  filter: DesignFilter
): NailDesign[] {
  let filtered = [...designs]

  // Status filter
  if (filter.status) {
    filtered = filtered.filter(d => d.status === filter.status)
  }

  // Quality filter
  if (filter.minQuality) {
    filtered = filtered.filter(d => d.qualityScore >= filter.minQuality!)
  }

  // Category filters
  if (filter.style) {
    filtered = filtered.filter(d => d.categories.styles.includes(filter.style!))
  }
  if (filter.shape) {
    filtered = filtered.filter(d => d.categories.shapes.includes(filter.shape!))
  }
  if (filter.type) {
    filtered = filtered.filter(d => d.categories.types.includes(filter.type!))
  }
  if (filter.technique) {
    filtered = filtered.filter(d => d.categories.techniques.includes(filter.technique!))
  }
  if (filter.color) {
    filtered = filtered.filter(d => d.categories.colors.includes(filter.color!))
  }

  // Text search
  if (filter.search) {
    const query = filter.search.toLowerCase()
    filtered = filtered.filter(d =>
      d.title.toLowerCase().includes(query) ||
      d.tags.some(t => t.toLowerCase().includes(query))
    )
  }

  // Sorting
  switch (filter.sortBy) {
    case 'score':
      filtered.sort((a, b) => b.score - a.score)
      break
    case 'quality':
      filtered.sort((a, b) => b.qualityScore - a.qualityScore)
      break
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'random':
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]]
      }
      break
    default:
      filtered.sort((a, b) => b.qualityScore - a.qualityScore)
  }

  // Pagination
  const offset = filter.offset || 0
  const limit = filter.limit || 50
  filtered = filtered.slice(offset, offset + limit)

  return filtered
}

/**
 * Get gallery statistics
 */
export function getGalleryStats(designs: NailDesign[]): DesignGalleryStats {
  const stats: DesignGalleryStats = {
    total: designs.length,
    approved: designs.filter(d => d.status === 'approved').length,
    pending: designs.filter(d => d.status === 'pending').length,
    rejected: designs.filter(d => d.status === 'rejected').length,
    byStyle: {},
    byShape: {},
    byColor: {},
  }

  for (const design of designs) {
    for (const style of design.categories.styles) {
      stats.byStyle[style] = (stats.byStyle[style] || 0) + 1
    }
    for (const shape of design.categories.shapes) {
      stats.byShape[shape] = (stats.byShape[shape] || 0) + 1
    }
    for (const color of design.categories.colors) {
      stats.byColor[color] = (stats.byColor[color] || 0) + 1
    }
  }

  return stats
}

/**
 * Get unique values for filter dropdowns
 */
export function getFilterOptions(designs: NailDesign[]) {
  const options = {
    styles: new Set<string>(),
    shapes: new Set<string>(),
    types: new Set<string>(),
    techniques: new Set<string>(),
    colors: new Set<string>(),
  }

  for (const design of designs) {
    design.categories.styles.forEach(s => options.styles.add(s))
    design.categories.shapes.forEach(s => options.shapes.add(s))
    design.categories.types.forEach(s => options.types.add(s))
    design.categories.techniques.forEach(s => options.techniques.add(s))
    design.categories.colors.forEach(s => options.colors.add(s))
  }

  return {
    styles: [...options.styles].sort(),
    shapes: [...options.shapes].sort(),
    types: [...options.types].sort(),
    techniques: [...options.techniques].sort(),
    colors: [...options.colors].sort(),
  }
}

/**
 * Get popular/trending designs
 */
export function getTrendingDesigns(designs: NailDesign[], limit: number = 20): NailDesign[] {
  return [...designs]
    .filter(d => d.status === 'approved')
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Get similar designs based on tags
 */
export function getSimilarDesigns(
  designs: NailDesign[],
  targetDesign: NailDesign,
  limit: number = 10
): NailDesign[] {
  const targetTags = new Set(targetDesign.tags)

  return designs
    .filter(d => d.id !== targetDesign.id && d.status === 'approved')
    .map(d => ({
      design: d,
      similarity: d.tags.filter(t => targetTags.has(t)).length / Math.max(1, targetTags.size),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(d => d.design)
}
