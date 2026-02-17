/**
 * Metadata Extractor for Reddit Nail Design Posts
 * Automatically categorizes nail designs based on title, flair, and content analysis
 */

import { DESIGN_CATEGORIES } from './config'

export interface NailDesignMetadata {
  id: string
  title: string
  author: string
  subreddit: string
  score: number
  upvoteRatio: number
  numComments: number
  createdUtc: number
  createdDate: string
  flair: string | null
  permalink: string
  sourceUrl: string
  filename: string
  width?: number
  height?: number

  // Auto-extracted categories
  categories: {
    styles: string[]
    shapes: string[]
    types: string[]
    techniques: string[]
    colors: string[]
  }
  tags: string[]
  qualityScore: number // Computed quality metric
}

interface RawPostData {
  id: string
  title: string
  author: string
  subreddit: string
  score: number
  upvoteRatio: number
  numComments: number
  createdUtc: number
  flair: string | null
  permalink: string
  imageUrl: string
  filename: string
  width?: number
  height?: number
}

export class MetadataExtractor {
  /**
   * Extract structured metadata from a Reddit post
   */
  extract(raw: RawPostData): NailDesignMetadata {
    const searchText = `${raw.title} ${raw.flair || ''}`.toLowerCase()
    
    const categories = {
      styles: this.matchCategories(searchText, DESIGN_CATEGORIES.styles),
      shapes: this.matchCategories(searchText, DESIGN_CATEGORIES.shapes),
      types: this.matchCategories(searchText, DESIGN_CATEGORIES.types),
      techniques: this.matchCategories(searchText, DESIGN_CATEGORIES.techniques),
      colors: this.matchCategories(searchText, DESIGN_CATEGORIES.colors),
    }

    const tags = [
      ...categories.styles,
      ...categories.shapes,
      ...categories.types,
      ...categories.techniques,
      ...categories.colors,
    ]

    const qualityScore = this.computeQualityScore(raw, categories)

    return {
      id: raw.id,
      title: raw.title,
      author: raw.author,
      subreddit: raw.subreddit,
      score: raw.score,
      upvoteRatio: raw.upvoteRatio,
      numComments: raw.numComments,
      createdUtc: raw.createdUtc,
      createdDate: new Date(raw.createdUtc * 1000).toISOString(),
      flair: raw.flair,
      permalink: `https://www.reddit.com${raw.permalink}`,
      sourceUrl: raw.imageUrl,
      filename: raw.filename,
      width: raw.width,
      height: raw.height,
      categories,
      tags,
      qualityScore,
    }
  }

  /**
   * Match text against a list of category keywords
   */
  private matchCategories(text: string, keywords: string[]): string[] {
    const matches: string[] = []
    
    for (const keyword of keywords) {
      // Use word boundary matching for short keywords to avoid false positives
      if (keyword.length <= 3) {
        const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i')
        if (regex.test(text)) matches.push(keyword)
      } else {
        if (text.includes(keyword.toLowerCase())) matches.push(keyword)
      }
    }

    return [...new Set(matches)] // Deduplicate
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Compute a quality score (0-100) for prioritizing designs
   */
  private computeQualityScore(
    raw: RawPostData,
    categories: NailDesignMetadata['categories']
  ): number {
    let score = 0

    // Upvote score (logarithmic, max 30 points)
    score += Math.min(30, Math.log10(Math.max(1, raw.score)) * 10)

    // Upvote ratio (max 15 points)
    score += raw.upvoteRatio * 15

    // Comment engagement (max 10 points)
    score += Math.min(10, Math.log10(Math.max(1, raw.numComments)) * 5)

    // Image resolution bonus (max 15 points)
    if (raw.width && raw.height) {
      const megapixels = (raw.width * raw.height) / 1_000_000
      score += Math.min(15, megapixels * 5)
    }

    // Category richness (more tags = more descriptive = better, max 15 points)
    const totalTags = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0)
    score += Math.min(15, totalTags * 3)

    // Has flair bonus (5 points)
    if (raw.flair) score += 5

    // Subreddit quality bonus (max 10 points)
    const highQualitySubs = ['RedditLaqueristas', 'NailArt', 'naildesign']
    if (highQualitySubs.includes(raw.subreddit)) score += 10

    return Math.min(100, Math.round(score))
  }

  /**
   * Generate category summary statistics
   */
  getCategorySummary(allMetadata: NailDesignMetadata[]): Record<string, Record<string, number>> {
    const summary: Record<string, Record<string, number>> = {
      styles: {},
      shapes: {},
      types: {},
      techniques: {},
      colors: {},
      subreddits: {},
    }

    for (const meta of allMetadata) {
      // Count categories
      for (const [key, values] of Object.entries(meta.categories)) {
        for (const value of values) {
          summary[key][value] = (summary[key][value] || 0) + 1
        }
      }
      // Count subreddits
      summary.subreddits[meta.subreddit] = (summary.subreddits[meta.subreddit] || 0) + 1
    }

    // Sort each category by count (descending)
    for (const key of Object.keys(summary)) {
      const sorted = Object.entries(summary[key]).sort((a, b) => b[1] - a[1])
      summary[key] = Object.fromEntries(sorted)
    }

    return summary
  }

  /**
   * Filter metadata by quality threshold
   */
  filterByQuality(metadata: NailDesignMetadata[], minScore: number = 30): NailDesignMetadata[] {
    return metadata.filter(m => m.qualityScore >= minScore)
  }

  /**
   * Filter metadata by category
   */
  filterByCategory(
    metadata: NailDesignMetadata[],
    categoryType: keyof NailDesignMetadata['categories'],
    value: string
  ): NailDesignMetadata[] {
    return metadata.filter(m => m.categories[categoryType].includes(value))
  }

  /**
   * Get top N designs by quality score
   */
  getTopDesigns(metadata: NailDesignMetadata[], n: number = 100): NailDesignMetadata[] {
    return [...metadata]
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, n)
  }
}
