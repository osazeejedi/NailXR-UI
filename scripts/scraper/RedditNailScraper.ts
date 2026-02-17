/**
 * Reddit Nail Design Scraper
 * Uses Reddit's public JSON API - no authentication required
 */

import { SCRAPER_CONFIG, type SortMode, type TimeFilter } from './config'
import { MetadataExtractor, type NailDesignMetadata } from './MetadataExtractor'
import { ImageDownloader } from './ImageDownloader'
import * as fs from 'fs'
import * as path from 'path'

interface RedditPost {
  kind: string
  data: {
    id: string
    title: string
    author: string
    subreddit: string
    url: string
    permalink: string
    score: number
    upvote_ratio: number
    num_comments: number
    created_utc: number
    link_flair_text: string | null
    post_hint?: string
    is_video: boolean
    over_18: boolean
    domain: string
    thumbnail: string
    preview?: {
      images: Array<{
        source: {
          url: string
          width: number
          height: number
        }
        resolutions: Array<{
          url: string
          width: number
          height: number
        }>
      }>
    }
    gallery_data?: {
      items: Array<{
        media_id: string
        id: number
      }>
    }
    media_metadata?: Record<string, {
      status: string
      e: string
      m: string
      s: {
        u: string
        x: number
        y: number
      }
    }>
    is_gallery?: boolean
  }
}

interface RedditListing {
  kind: string
  data: {
    after: string | null
    before: string | null
    children: RedditPost[]
    dist: number
  }
}

export interface ScrapeResult {
  totalPostsScraped: number
  totalImagesDownloaded: number
  totalSkipped: number
  totalErrors: number
  duration: number
  metadata: NailDesignMetadata[]
}

export class RedditNailScraper {
  private metadataExtractor: MetadataExtractor
  private imageDownloader: ImageDownloader
  private seenUrls: Set<string> = new Set()
  private seenIds: Set<string> = new Set()
  private allMetadata: NailDesignMetadata[] = []

  constructor() {
    this.metadataExtractor = new MetadataExtractor()
    this.imageDownloader = new ImageDownloader()
  }

  /**
   * Run the full scraping pipeline
   */
  async scrape(options?: {
    subreddits?: string[]
    sortModes?: SortMode[]
    maxImagesPerSubreddit?: number
    dryRun?: boolean
  }): Promise<ScrapeResult> {
    const startTime = Date.now()
    const subreddits = options?.subreddits || SCRAPER_CONFIG.subreddits
    const sortModes = options?.sortModes || [...SCRAPER_CONFIG.sortModes]
    const maxPerSub = options?.maxImagesPerSubreddit || Infinity
    const dryRun = options?.dryRun || false

    console.log('🔍 NailXR Reddit Scraper')
    console.log('========================')
    console.log(`📋 Subreddits: ${subreddits.join(', ')}`)
    console.log(`📊 Sort modes: ${sortModes.join(', ')}`)
    console.log(`🔧 Dry run: ${dryRun}`)
    console.log('')

    // Ensure output directories exist
    this.ensureDirectories()

    // Load existing metadata to avoid re-downloading
    this.loadExistingMetadata()

    let totalPostsScraped = 0
    let totalImagesDownloaded = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const subreddit of subreddits) {
      let subImages = 0
      console.log(`\n🔄 Scraping r/${subreddit}...`)

      for (const sort of sortModes) {
        if (subImages >= maxPerSub) break

        if (sort === 'top') {
          // For 'top', iterate through time filters
          for (const timeFilter of SCRAPER_CONFIG.timeFilters) {
            if (subImages >= maxPerSub) break

            console.log(`  📁 r/${subreddit}/${sort}?t=${timeFilter}`)
            const result = await this.scrapeSubredditPage(
              subreddit, sort, timeFilter, dryRun, maxPerSub - subImages
            )
            totalPostsScraped += result.posts
            totalImagesDownloaded += result.downloaded
            totalSkipped += result.skipped
            totalErrors += result.errors
            subImages += result.downloaded
          }
        } else {
          console.log(`  📁 r/${subreddit}/${sort}`)
          const result = await this.scrapeSubredditPage(
            subreddit, sort, undefined, dryRun, maxPerSub - subImages
          )
          totalPostsScraped += result.posts
          totalImagesDownloaded += result.downloaded
          totalSkipped += result.skipped
          totalErrors += result.errors
          subImages += result.downloaded
        }
      }

      console.log(`  ✅ r/${subreddit}: ${subImages} images collected`)
    }

    // Save consolidated metadata
    this.saveAllMetadata()

    const duration = (Date.now() - startTime) / 1000

    console.log('\n========================')
    console.log('📊 Scrape Complete!')
    console.log(`⏱️  Duration: ${duration.toFixed(1)}s`)
    console.log(`📝 Posts scraped: ${totalPostsScraped}`)
    console.log(`📸 Images downloaded: ${totalImagesDownloaded}`)
    console.log(`⏭️  Skipped (duplicates/low quality): ${totalSkipped}`)
    console.log(`❌ Errors: ${totalErrors}`)
    console.log(`📂 Output: ${SCRAPER_CONFIG.outputDir}`)

    return {
      totalPostsScraped,
      totalImagesDownloaded,
      totalSkipped,
      totalErrors,
      duration,
      metadata: this.allMetadata,
    }
  }

  /**
   * Scrape a single subreddit page (with pagination)
   */
  private async scrapeSubredditPage(
    subreddit: string,
    sort: SortMode,
    timeFilter?: TimeFilter,
    dryRun: boolean = false,
    maxImages: number = Infinity
  ): Promise<{ posts: number; downloaded: number; skipped: number; errors: number }> {
    let after: string | null = null
    let totalPosts = 0
    let downloaded = 0
    let skipped = 0
    let errors = 0
    let page = 0

    while (page < SCRAPER_CONFIG.maxPages && downloaded < maxImages) {
      try {
        // Build URL
        let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${SCRAPER_CONFIG.postsPerRequest}&raw_json=1`
        if (timeFilter) url += `&t=${timeFilter}`
        if (after) url += `&after=${after}`

        // Fetch posts
        const listing = await this.fetchRedditListing(url)
        if (!listing || !listing.data.children.length) break

        const posts = listing.data.children
        totalPosts += posts.length

        // Process each post
        for (const post of posts) {
          if (downloaded >= maxImages) break

          const result = await this.processPost(post, dryRun)
          if (result === 'downloaded') downloaded++
          else if (result === 'skipped') skipped++
          else if (result === 'error') errors++
        }

        // Pagination
        after = listing.data.after
        if (!after) break

        page++

        // Rate limit delay
        await this.delay(SCRAPER_CONFIG.requestDelay)
      } catch (err) {
        console.error(`    ❌ Error fetching page ${page}: ${err}`)
        errors++
        break
      }
    }

    return { posts: totalPosts, downloaded, skipped, errors }
  }

  /**
   * Fetch a Reddit JSON listing
   */
  private async fetchRedditListing(url: string): Promise<RedditListing | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': SCRAPER_CONFIG.userAgent,
          'Accept': 'application/json',
        },
      })

      if (response.status === 429) {
        console.warn('    ⚠️ Rate limited. Waiting 60s...')
        await this.delay(60000)
        return this.fetchRedditListing(url)
      }

      if (!response.ok) {
        console.error(`    ❌ HTTP ${response.status}: ${response.statusText}`)
        return null
      }

      return await response.json() as RedditListing
    } catch (err) {
      console.error(`    ❌ Fetch error: ${err}`)
      return null
    }
  }

  /**
   * Process a single Reddit post
   */
  private async processPost(
    post: RedditPost,
    dryRun: boolean
  ): Promise<'downloaded' | 'skipped' | 'error'> {
    const data = post.data

    // Skip if already seen
    if (this.seenIds.has(data.id)) return 'skipped'
    this.seenIds.add(data.id)

    // Skip videos
    if (data.is_video) return 'skipped'

    // Skip NSFW
    if (data.over_18) return 'skipped'

    // Skip low-score posts
    if (data.score < SCRAPER_CONFIG.minUpvotes) return 'skipped'

    // Extract image URLs from the post
    const imageUrls = this.extractImageUrls(data)
    if (imageUrls.length === 0) return 'skipped'

    // Process each image
    let anyDownloaded = false
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i]

      // Skip if already downloaded
      if (this.seenUrls.has(imageUrl)) continue
      this.seenUrls.add(imageUrl)

      // Check resolution from preview if available
      if (data.preview?.images?.[0]?.source) {
        const source = data.preview.images[0].source
        if (source.width < SCRAPER_CONFIG.minWidth || source.height < SCRAPER_CONFIG.minHeight) {
          continue
        }
      }

      // Generate filename
      const ext = this.getExtension(imageUrl)
      const suffix = imageUrls.length > 1 ? `_${i}` : ''
      const filename = `${data.subreddit}_${data.id}${suffix}${ext}`

      // Extract metadata
      const metadata = this.metadataExtractor.extract({
        id: `${data.id}${suffix}`,
        title: data.title,
        author: data.author,
        subreddit: data.subreddit,
        score: data.score,
        upvoteRatio: data.upvote_ratio,
        numComments: data.num_comments,
        createdUtc: data.created_utc,
        flair: data.link_flair_text,
        permalink: data.permalink,
        imageUrl,
        filename,
        width: data.preview?.images?.[0]?.source?.width,
        height: data.preview?.images?.[0]?.source?.height,
      })

      if (dryRun) {
        console.log(`    [DRY RUN] Would download: ${filename}`)
        this.allMetadata.push(metadata)
        anyDownloaded = true
        continue
      }

      // Download image
      try {
        const filepath = path.join(SCRAPER_CONFIG.imagesDir, filename)
        const success = await this.imageDownloader.download(imageUrl, filepath)
        if (success) {
          this.allMetadata.push(metadata)
          anyDownloaded = true
        }
      } catch (err) {
        console.error(`    ❌ Download error: ${filename}: ${err}`)
        return 'error'
      }
    }

    return anyDownloaded ? 'downloaded' : 'skipped'
  }

  /**
   * Extract all image URLs from a Reddit post
   */
  private extractImageUrls(data: RedditPost['data']): string[] {
    const urls: string[] = []

    // Gallery posts (multiple images)
    if (data.is_gallery && data.media_metadata) {
      for (const [mediaId, media] of Object.entries(data.media_metadata)) {
        if (media.status === 'valid' && media.s?.u) {
          // Decode HTML entities in URL
          const url = media.s.u.replace(/&amp;/g, '&')
          urls.push(url)
        }
      }
      return urls
    }

    // Direct image URL
    if (data.url && this.isImageUrl(data.url)) {
      urls.push(data.url)
      return urls
    }

    // Preview image (best quality)
    if (data.preview?.images?.[0]?.source?.url) {
      const url = data.preview.images[0].source.url.replace(/&amp;/g, '&')
      urls.push(url)
      return urls
    }

    // Imgur links (non-direct)
    if (data.domain === 'imgur.com' && data.url) {
      // Convert imgur page URL to direct image URL
      const imgurId = data.url.split('/').pop()
      if (imgurId && !imgurId.includes('.')) {
        urls.push(`https://i.imgur.com/${imgurId}.jpg`)
        return urls
      }
    }

    return urls
  }

  /**
   * Check if URL is a direct image link
   */
  private isImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      const ext = path.extname(parsed.pathname).toLowerCase()
      return SCRAPER_CONFIG.supportedExtensions.includes(ext) ||
        SCRAPER_CONFIG.allowedDomains.some(d => parsed.hostname.includes(d))
    } catch {
      return false
    }
  }

  /**
   * Get file extension from URL
   */
  private getExtension(url: string): string {
    try {
      const parsed = new URL(url)
      const ext = path.extname(parsed.pathname).toLowerCase()
      if (SCRAPER_CONFIG.supportedExtensions.includes(ext)) return ext
    } catch {}
    return '.jpg' // Default
  }

  /**
   * Ensure output directories exist
   */
  private ensureDirectories() {
    const dirs = [
      SCRAPER_CONFIG.outputDir,
      SCRAPER_CONFIG.imagesDir,
      SCRAPER_CONFIG.metadataDir,
      SCRAPER_CONFIG.thumbnailsDir,
    ]
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  /**
   * Load existing metadata to avoid re-downloading
   */
  private loadExistingMetadata() {
    const metadataFile = path.join(SCRAPER_CONFIG.metadataDir, 'all_designs.json')
    if (fs.existsSync(metadataFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'))
        if (Array.isArray(existing)) {
          this.allMetadata = existing
          for (const meta of existing) {
            this.seenIds.add(meta.id)
            this.seenUrls.add(meta.sourceUrl)
          }
          console.log(`📂 Loaded ${existing.length} existing entries (will skip duplicates)`)
        }
      } catch {
        console.warn('⚠️ Could not load existing metadata, starting fresh')
      }
    }
  }

  /**
   * Save all metadata to disk
   */
  private saveAllMetadata() {
    const metadataFile = path.join(SCRAPER_CONFIG.metadataDir, 'all_designs.json')
    fs.writeFileSync(metadataFile, JSON.stringify(this.allMetadata, null, 2))
    console.log(`💾 Saved metadata for ${this.allMetadata.length} designs`)

    // Also save per-subreddit metadata
    const bySubreddit: Record<string, NailDesignMetadata[]> = {}
    for (const meta of this.allMetadata) {
      if (!bySubreddit[meta.subreddit]) bySubreddit[meta.subreddit] = []
      bySubreddit[meta.subreddit].push(meta)
    }
    for (const [sub, metas] of Object.entries(bySubreddit)) {
      const subFile = path.join(SCRAPER_CONFIG.metadataDir, `${sub}.json`)
      fs.writeFileSync(subFile, JSON.stringify(metas, null, 2))
    }

    // Save category summary
    const categorySummary = this.metadataExtractor.getCategorySummary(this.allMetadata)
    const summaryFile = path.join(SCRAPER_CONFIG.metadataDir, 'category_summary.json')
    fs.writeFileSync(summaryFile, JSON.stringify(categorySummary, null, 2))
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
