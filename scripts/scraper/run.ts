#!/usr/bin/env npx tsx
/**
 * NailXR Reddit Scraper CLI
 * 
 * Usage:
 *   npx tsx scripts/scraper/run.ts                           # Full scrape (all subreddits)
 *   npx tsx scripts/scraper/run.ts --dry-run                 # Preview without downloading
 *   npx tsx scripts/scraper/run.ts --subreddits NailArt,Nails # Specific subreddits
 *   npx tsx scripts/scraper/run.ts --max 50                  # Max 50 images per subreddit
 *   npx tsx scripts/scraper/run.ts --sort top                # Only scrape top posts
 *   npx tsx scripts/scraper/run.ts --clean                   # Clean invalid images
 *   npx tsx scripts/scraper/run.ts --stats                   # Show dataset statistics
 */

import { RedditNailScraper } from './RedditNailScraper'
import { ImageValidator } from './ImageDownloader'
import { MetadataExtractor, type NailDesignMetadata } from './MetadataExtractor'
import { SCRAPER_CONFIG, type SortMode } from './config'
import * as fs from 'fs'
import * as path from 'path'

function parseArgs(): {
  dryRun: boolean
  subreddits?: string[]
  sortModes?: SortMode[]
  maxImages?: number
  clean: boolean
  stats: boolean
  help: boolean
} {
  const args = process.argv.slice(2)
  const result = {
    dryRun: false,
    subreddits: undefined as string[] | undefined,
    sortModes: undefined as SortMode[] | undefined,
    maxImages: undefined as number | undefined,
    clean: false,
    stats: false,
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
      case '-d':
        result.dryRun = true
        break
      case '--subreddits':
      case '-s':
        result.subreddits = args[++i]?.split(',')
        break
      case '--sort':
        result.sortModes = args[++i]?.split(',') as SortMode[]
        break
      case '--max':
      case '-m':
        result.maxImages = parseInt(args[++i], 10)
        break
      case '--clean':
      case '-c':
        result.clean = true
        break
      case '--stats':
        result.stats = true
        break
      case '--help':
      case '-h':
        result.help = true
        break
    }
  }

  return result
}

function showHelp() {
  console.log(`
🔍 NailXR Reddit Nail Design Scraper
=====================================

Usage:
  npx tsx scripts/scraper/run.ts [options]

Options:
  --dry-run, -d          Preview what would be downloaded (no actual downloads)
  --subreddits, -s       Comma-separated list of subreddits (default: all configured)
  --sort                 Comma-separated sort modes: hot,top,new (default: all)
  --max, -m              Maximum images per subreddit (default: unlimited)
  --clean, -c            Clean invalid/corrupt images from download directory
  --stats                Show dataset statistics
  --help, -h             Show this help message

Examples:
  npx tsx scripts/scraper/run.ts                                    # Full scrape
  npx tsx scripts/scraper/run.ts --dry-run                          # Preview mode
  npx tsx scripts/scraper/run.ts -s NailArt,Nails -m 100            # 100 images from 2 subs
  npx tsx scripts/scraper/run.ts --sort top --max 200               # Top posts only, 200 per sub
  npx tsx scripts/scraper/run.ts --clean                            # Remove invalid images
  npx tsx scripts/scraper/run.ts --stats                            # Dataset statistics

Output:
  ./data/scraped/images/       - Downloaded nail design images
  ./data/scraped/metadata/     - JSON metadata files
  ./data/scraped/thumbnails/   - Image thumbnails (for gallery)
`)
}

function showStats() {
  const metadataFile = path.join(SCRAPER_CONFIG.metadataDir, 'all_designs.json')
  
  if (!fs.existsSync(metadataFile)) {
    console.log('❌ No dataset found. Run the scraper first!')
    return
  }

  const metadata: NailDesignMetadata[] = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'))
  const extractor = new MetadataExtractor()
  const summary = extractor.getCategorySummary(metadata)

  console.log('\n📊 NailXR Dataset Statistics')
  console.log('============================')
  console.log(`Total designs: ${metadata.length}`)
  
  // Count actual images on disk
  if (fs.existsSync(SCRAPER_CONFIG.imagesDir)) {
    const imageFiles = fs.readdirSync(SCRAPER_CONFIG.imagesDir).filter(f => !f.startsWith('.'))
    const totalSize = imageFiles.reduce((sum, f) => {
      try { return sum + fs.statSync(path.join(SCRAPER_CONFIG.imagesDir, f)).size } catch { return sum }
    }, 0)
    console.log(`Image files on disk: ${imageFiles.length}`)
    console.log(`Total disk usage: ${(totalSize / 1024 / 1024).toFixed(1)} MB`)
  }

  // Quality distribution
  const qualityBuckets = { high: 0, medium: 0, low: 0 }
  for (const m of metadata) {
    if (m.qualityScore >= 60) qualityBuckets.high++
    else if (m.qualityScore >= 30) qualityBuckets.medium++
    else qualityBuckets.low++
  }
  console.log(`\nQuality Distribution:`)
  console.log(`  🟢 High (60+):   ${qualityBuckets.high}`)
  console.log(`  🟡 Medium (30-59): ${qualityBuckets.medium}`)
  console.log(`  🔴 Low (<30):     ${qualityBuckets.low}`)

  // Avg score
  const avgScore = metadata.reduce((sum, m) => sum + m.score, 0) / metadata.length
  console.log(`\nAvg Reddit score: ${avgScore.toFixed(0)}`)

  // Top categories
  console.log('\n📁 By Subreddit:')
  for (const [sub, count] of Object.entries(summary.subreddits).slice(0, 10)) {
    console.log(`  r/${sub}: ${count}`)
  }

  console.log('\n🎨 Top Styles:')
  for (const [style, count] of Object.entries(summary.styles).slice(0, 15)) {
    console.log(`  ${style}: ${count}`)
  }

  console.log('\n💅 Top Shapes:')
  for (const [shape, count] of Object.entries(summary.shapes).slice(0, 10)) {
    console.log(`  ${shape}: ${count}`)
  }

  console.log('\n🔧 Top Types:')
  for (const [type, count] of Object.entries(summary.types).slice(0, 10)) {
    console.log(`  ${type}: ${count}`)
  }

  console.log('\n🎯 Top Techniques:')
  for (const [tech, count] of Object.entries(summary.techniques).slice(0, 10)) {
    console.log(`  ${tech}: ${count}`)
  }

  console.log('\n🌈 Top Colors:')
  for (const [color, count] of Object.entries(summary.colors).slice(0, 15)) {
    console.log(`  ${color}: ${count}`)
  }
}

function cleanImages() {
  console.log('🧹 Cleaning invalid images...')
  
  if (!fs.existsSync(SCRAPER_CONFIG.imagesDir)) {
    console.log('❌ No images directory found.')
    return
  }

  const result = ImageValidator.cleanDirectory(SCRAPER_CONFIG.imagesDir)
  console.log(`✅ Kept: ${result.kept} | Removed: ${result.removed}`)
}

async function main() {
  const args = parseArgs()

  if (args.help) {
    showHelp()
    return
  }

  if (args.stats) {
    showStats()
    return
  }

  if (args.clean) {
    cleanImages()
    return
  }

  // Run scraper
  const scraper = new RedditNailScraper()
  
  try {
    const result = await scraper.scrape({
      subreddits: args.subreddits,
      sortModes: args.sortModes,
      maxImagesPerSubreddit: args.maxImages,
      dryRun: args.dryRun,
    })

    // Exit code based on result
    if (result.totalErrors > result.totalImagesDownloaded) {
      process.exit(1)
    }
  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  }
}

main()
