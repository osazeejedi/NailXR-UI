#!/usr/bin/env npx tsx
/**
 * NailXR Dataset Builder CLI
 * 
 * Usage:
 *   npx tsx scripts/dataset/run.ts                    # Build dataset with defaults
 *   npx tsx scripts/dataset/run.ts --max 500          # Cap at 500 images
 *   npx tsx scripts/dataset/run.ts --quality 40       # Min quality score 40
 *   npx tsx scripts/dataset/run.ts --size 224         # Target image size 224x224
 */

import { DatasetBuilder, type DatasetConfig } from './DatasetBuilder'

function parseArgs() {
  const args = process.argv.slice(2)
  const result: Record<string, string | boolean> = {}

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--max':
      case '-m':
        result.maxImages = args[++i]
        break
      case '--quality':
      case '-q':
        result.minQualityScore = args[++i]
        break
      case '--size':
      case '-s':
        result.targetSize = args[++i]
        break
      case '--output':
      case '-o':
        result.outputDir = args[++i]
        break
      case '--help':
      case '-h':
        result.help = 'true'
        break
    }
  }

  return result
}

function showHelp() {
  console.log(`
🏗️  NailXR Dataset Builder
==========================

Usage:
  npx tsx scripts/dataset/run.ts [options]

Options:
  --max, -m        Maximum total images (default: unlimited)
  --quality, -q    Minimum quality score 0-100 (default: 20)
  --size, -s       Target image dimension for training (default: 256)
  --output, -o     Output directory (default: ./data/dataset)
  --help, -h       Show this help message

Prerequisite:
  Run the scraper first: npx tsx scripts/scraper/run.ts

Examples:
  npx tsx scripts/dataset/run.ts                      # Build with defaults
  npx tsx scripts/dataset/run.ts --max 1000 -q 30     # 1000 images, quality >= 30
  npx tsx scripts/dataset/run.ts --size 224            # For 224x224 model input

Output Structure:
  data/dataset/
  ├── train/images/        # Training images (80%)
  ├── train/masks/         # Training masks (for annotation)
  ├── val/images/          # Validation images (10%)
  ├── val/masks/           # Validation masks
  ├── test/images/         # Test images (10%)
  ├── test/masks/          # Test masks
  ├── annotations/         # JSON manifests per split
  └── dataset_info.json    # Dataset metadata
`)
}

async function main() {
  const args = parseArgs()

  if (args.help) {
    showHelp()
    return
  }

  // Only include config keys that were explicitly provided via CLI args
  // to avoid overriding defaults with undefined values
  const config: Partial<DatasetConfig> = {}
  if (args.maxImages) config.maxImages = parseInt(args.maxImages as string, 10)
  if (args.minQualityScore) config.minQualityScore = parseInt(args.minQualityScore as string, 10)
  if (args.targetSize) config.targetSize = parseInt(args.targetSize as string, 10)
  if (args.outputDir) config.outputDir = args.outputDir as string

  const builder = new DatasetBuilder(config)

  try {
    const stats = await builder.build()
    console.log('\n📊 Dataset Stats:')
    console.log(JSON.stringify(stats, null, 2))
  } catch (err) {
    console.error('❌ Dataset build failed:', err)
    process.exit(1)
  }
}

main()
