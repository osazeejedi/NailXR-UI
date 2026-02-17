/**
 * Designs API - Serves nail designs from scraped metadata
 * GET /api/designs - List designs with filtering
 * POST /api/designs/approve - Approve/reject designs (admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const METADATA_PATH = path.join(process.cwd(), 'data', 'scraped', 'metadata', 'all_designs.json')

interface DesignMetadata {
  id: string
  title: string
  author: string
  subreddit: string
  score: number
  upvoteRatio: number
  numComments: number
  createdDate: string
  permalink: string
  sourceUrl: string
  filename: string
  width?: number
  height?: number
  categories: {
    styles: string[]
    shapes: string[]
    types: string[]
    techniques: string[]
    colors: string[]
  }
  tags: string[]
  qualityScore: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const style = searchParams.get('style')
    const shape = searchParams.get('shape')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort') || 'quality'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const minQuality = parseInt(searchParams.get('minQuality') || '0', 10)

    // Load metadata
    if (!fs.existsSync(METADATA_PATH)) {
      return NextResponse.json({
        designs: [],
        total: 0,
        message: 'No designs found. Run the scraper first: npx tsx scripts/scraper/run.ts',
      })
    }

    const raw: DesignMetadata[] = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'))

    // Transform to NailDesign format
    let designs = raw.map(m => ({
      id: m.id,
      title: m.title,
      imageUrl: `/api/designs/image/${m.filename}`,
      thumbnailUrl: `/api/designs/image/${m.filename}`,
      sourceUrl: m.permalink,
      author: m.author,
      subreddit: m.subreddit,
      score: m.score,
      categories: m.categories,
      tags: m.tags,
      qualityScore: m.qualityScore,
      status: 'approved' as const, // Auto-approve for now
      createdAt: m.createdDate,
    }))

    // Apply filters
    if (minQuality > 0) {
      designs = designs.filter(d => d.qualityScore >= minQuality)
    }
    if (style) {
      designs = designs.filter(d => d.categories.styles.includes(style))
    }
    if (shape) {
      designs = designs.filter(d => d.categories.shapes.includes(shape))
    }
    if (search) {
      const q = search.toLowerCase()
      designs = designs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.tags.some(t => t.includes(q))
      )
    }

    // Sort
    switch (sortBy) {
      case 'score':
        designs.sort((a, b) => b.score - a.score)
        break
      case 'newest':
        designs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'quality':
      default:
        designs.sort((a, b) => b.qualityScore - a.qualityScore)
    }

    const total = designs.length
    designs = designs.slice(offset, offset + limit)

    return NextResponse.json({
      designs,
      total,
      offset,
      limit,
    })
  } catch (err) {
    console.error('Designs API error:', err)
    return NextResponse.json(
      { error: 'Failed to load designs' },
      { status: 500 }
    )
  }
}
