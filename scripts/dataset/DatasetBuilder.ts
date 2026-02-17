/**
 * Dataset Builder for Nail Segmentation Model Training
 * Organizes scraped images into train/val/test splits with proper structure
 */

import * as fs from 'fs'
import * as path from 'path'
import { SCRAPER_CONFIG } from '../scraper/config'
import type { NailDesignMetadata } from '../scraper/MetadataExtractor'
import { QualityFilter } from './QualityFilter'

export interface DatasetConfig {
  sourceDir: string        // Where scraped images live
  outputDir: string        // Where to build the dataset
  trainRatio: number       // e.g. 0.8
  valRatio: number         // e.g. 0.1
  testRatio: number        // e.g. 0.1
  minQualityScore: number  // Minimum quality score to include
  targetSize: number       // Resize images to this dimension (square)
  maxImages?: number       // Optional cap on total images
}

const DEFAULT_CONFIG: DatasetConfig = {
  sourceDir: SCRAPER_CONFIG.imagesDir,
  outputDir: './data/dataset',
  trainRatio: 0.8,
  valRatio: 0.1,
  testRatio: 0.1,
  minQualityScore: 20,
  targetSize: 256,
  maxImages: undefined,
}

export interface DatasetStats {
  totalImages: number
  trainImages: number
  valImages: number
  testImages: number
  categories: Record<string, number>
  avgQualityScore: number
}

export class DatasetBuilder {
  private config: DatasetConfig
  private qualityFilter: QualityFilter

  constructor(config?: Partial<DatasetConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.qualityFilter = new QualityFilter()
  }

  /**
   * Build the complete dataset from scraped images
   */
  async build(): Promise<DatasetStats> {
    console.log('🏗️  Building dataset...')
    console.log(`📂 Source: ${this.config.sourceDir}`)
    console.log(`📂 Output: ${this.config.outputDir}`)

    // 1. Load metadata
    const metadata = this.loadMetadata()
    console.log(`📝 Loaded ${metadata.length} design entries`)

    // 2. Filter by quality
    const filtered = metadata.filter(m => m.qualityScore >= this.config.minQualityScore)
    console.log(`✅ ${filtered.length} passed quality filter (min score: ${this.config.minQualityScore})`)

    // 3. Verify images exist on disk
    const verified = filtered.filter(m => {
      const filepath = path.join(this.config.sourceDir, m.filename)
      return fs.existsSync(filepath)
    })
    console.log(`📸 ${verified.length} images verified on disk`)

    // 4. Apply image quality filter (blur detection, size check)
    const qualityPassed = await this.qualityFilter.filterBatch(
      verified.map(m => ({
        metadata: m,
        filepath: path.join(this.config.sourceDir, m.filename),
      }))
    )
    console.log(`🔍 ${qualityPassed.length} passed image quality check`)

    // 5. Cap at maxImages if set
    let finalSet = qualityPassed
    if (this.config.maxImages && finalSet.length > this.config.maxImages) {
      // Sort by quality and take top N
      finalSet.sort((a, b) => b.metadata.qualityScore - a.metadata.qualityScore)
      finalSet = finalSet.slice(0, this.config.maxImages)
    }

    // 6. Shuffle
    this.shuffle(finalSet)

    // 7. Split into train/val/test
    const trainEnd = Math.floor(finalSet.length * this.config.trainRatio)
    const valEnd = trainEnd + Math.floor(finalSet.length * this.config.valRatio)

    const trainSet = finalSet.slice(0, trainEnd)
    const valSet = finalSet.slice(trainEnd, valEnd)
    const testSet = finalSet.slice(valEnd)

    // 8. Create directory structure
    this.createDirectoryStructure()

    // 9. Copy images to dataset directories
    console.log('\n📋 Copying images...')
    this.copyImages(trainSet, 'train')
    this.copyImages(valSet, 'val')
    this.copyImages(testSet, 'test')

    // 10. Generate dataset manifests
    this.generateManifest(trainSet, 'train')
    this.generateManifest(valSet, 'val')
    this.generateManifest(testSet, 'test')

    // 11. Generate dataset info
    const stats = this.generateDatasetInfo(trainSet, valSet, testSet, finalSet)

    console.log('\n✅ Dataset built successfully!')
    console.log(`   Train: ${trainSet.length} images`)
    console.log(`   Val:   ${valSet.length} images`)
    console.log(`   Test:  ${testSet.length} images`)
    console.log(`   Total: ${finalSet.length} images`)

    return stats
  }

  /**
   * Load metadata from scraped data
   */
  private loadMetadata(): NailDesignMetadata[] {
    const metadataFile = path.join(SCRAPER_CONFIG.metadataDir, 'all_designs.json')
    if (!fs.existsSync(metadataFile)) {
      throw new Error(`Metadata file not found: ${metadataFile}\nRun the scraper first: npx tsx scripts/scraper/run.ts`)
    }
    return JSON.parse(fs.readFileSync(metadataFile, 'utf-8'))
  }

  /**
   * Create the dataset directory structure
   */
  private createDirectoryStructure() {
    const dirs = [
      this.config.outputDir,
      path.join(this.config.outputDir, 'train', 'images'),
      path.join(this.config.outputDir, 'train', 'masks'),
      path.join(this.config.outputDir, 'val', 'images'),
      path.join(this.config.outputDir, 'val', 'masks'),
      path.join(this.config.outputDir, 'test', 'images'),
      path.join(this.config.outputDir, 'test', 'masks'),
      path.join(this.config.outputDir, 'annotations'),
    ]
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  /**
   * Copy images to the appropriate split directory
   */
  private copyImages(
    items: Array<{ metadata: NailDesignMetadata; filepath: string }>,
    split: 'train' | 'val' | 'test'
  ) {
    const targetDir = path.join(this.config.outputDir, split, 'images')
    let copied = 0

    for (const item of items) {
      const targetPath = path.join(targetDir, item.metadata.filename)
      try {
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(item.filepath, targetPath)
        }
        copied++
      } catch (err) {
        console.warn(`  ⚠️ Failed to copy ${item.metadata.filename}: ${err}`)
      }
    }

    console.log(`  ${split}: ${copied}/${items.length} images copied`)
  }

  /**
   * Generate a manifest JSON for each split
   */
  private generateManifest(
    items: Array<{ metadata: NailDesignMetadata; filepath: string }>,
    split: 'train' | 'val' | 'test'
  ) {
    const manifest = items.map((item, index) => ({
      index,
      filename: item.metadata.filename,
      id: item.metadata.id,
      categories: item.metadata.categories,
      tags: item.metadata.tags,
      qualityScore: item.metadata.qualityScore,
      width: item.metadata.width,
      height: item.metadata.height,
    }))

    const manifestPath = path.join(this.config.outputDir, 'annotations', `${split}.json`)
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  }

  /**
   * Generate dataset-level info file
   */
  private generateDatasetInfo(
    trainSet: Array<{ metadata: NailDesignMetadata; filepath: string }>,
    valSet: Array<{ metadata: NailDesignMetadata; filepath: string }>,
    testSet: Array<{ metadata: NailDesignMetadata; filepath: string }>,
    allItems: Array<{ metadata: NailDesignMetadata; filepath: string }>
  ): DatasetStats {
    // Count categories
    const categories: Record<string, number> = {}
    for (const item of allItems) {
      for (const tag of item.metadata.tags) {
        categories[tag] = (categories[tag] || 0) + 1
      }
    }

    const avgQualityScore = allItems.reduce((sum, i) => sum + i.metadata.qualityScore, 0) / allItems.length

    const stats: DatasetStats = {
      totalImages: allItems.length,
      trainImages: trainSet.length,
      valImages: valSet.length,
      testImages: testSet.length,
      categories,
      avgQualityScore,
    }

    const datasetInfo = {
      name: 'NailXR Nail Design Dataset',
      version: '1.0.0',
      created: new Date().toISOString(),
      description: 'Nail design images scraped from Reddit for nail segmentation model training',
      config: this.config,
      stats,
      splits: {
        train: { count: trainSet.length, ratio: this.config.trainRatio },
        val: { count: valSet.length, ratio: this.config.valRatio },
        test: { count: testSet.length, ratio: this.config.testRatio },
      },
    }

    const infoPath = path.join(this.config.outputDir, 'dataset_info.json')
    fs.writeFileSync(infoPath, JSON.stringify(datasetInfo, null, 2))

    return stats
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}
