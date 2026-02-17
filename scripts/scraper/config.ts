/**
 * Reddit Nail Design Scraper Configuration
 * No API key required - uses Reddit's public JSON API
 */

export const SCRAPER_CONFIG = {
  // Target subreddits for nail design images
  subreddits: [
    'NailArt',
    'RedditLaqueristas',
    'Nails',
    'naildesign',
    'NailPolish',
    'nailsofinstagram',
    'GelNails',
    'PressOnNails',
  ],

  // Sort modes to scrape (more modes = more images)
  sortModes: ['hot', 'top', 'new'] as const,

  // Time filters for 'top' sort mode
  timeFilters: ['day', 'week', 'month', 'year', 'all'] as const,

  // Maximum posts to fetch per subreddit per sort/time combo
  postsPerRequest: 100,

  // Maximum total pages to paginate per subreddit/sort combo
  maxPages: 10,

  // Delay between Reddit API requests (ms) - respect rate limits
  requestDelay: 2500,

  // Minimum upvotes to consider a post (quality signal)
  minUpvotes: 10,

  // Minimum image resolution (pixels)
  minWidth: 400,
  minHeight: 400,

  // Maximum concurrent image downloads
  maxConcurrentDownloads: 5,

  // Download retry attempts
  maxRetries: 3,

  // Output directories
  outputDir: './data/scraped',
  imagesDir: './data/scraped/images',
  metadataDir: './data/scraped/metadata',
  thumbnailsDir: './data/scraped/thumbnails',

  // User agent string (Reddit requires this)
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) NailXR-DataCollector/1.0',

  // Supported image extensions
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],

  // Reddit image hosting domains to accept
  allowedDomains: [
    'i.redd.it',
    'i.imgur.com',
    'imgur.com',
    'preview.redd.it',
    'external-preview.redd.it',
  ],
}

// Design categories extracted from Reddit post titles/flairs
export const DESIGN_CATEGORIES = {
  styles: [
    'french', 'ombre', 'gradient', 'glitter', 'matte', 'chrome',
    'holographic', 'marble', 'abstract', 'floral', 'geometric',
    'minimalist', 'maximalist', 'vintage', 'retro', 'gothic',
    'pastel', 'neon', 'nude', 'natural', 'artistic', 'festive',
    'holiday', 'halloween', 'christmas', 'valentine', 'summer',
    'spring', 'winter', 'fall', 'autumn', 'bridal', 'wedding',
  ],
  shapes: [
    'stiletto', 'coffin', 'ballerina', 'almond', 'oval', 'round',
    'square', 'squoval', 'mountain peak', 'lipstick', 'flare',
    'duck', 'edge', 'arrowhead',
  ],
  types: [
    'gel', 'acrylic', 'dip powder', 'press-on', 'polygel',
    'shellac', 'regular polish', 'builder gel', 'hard gel',
    'soft gel', 'sns', 'nail wrap', 'silk wrap',
  ],
  techniques: [
    'stamping', 'freehand', 'water marble', 'foil', 'sticker',
    'decal', 'striping tape', 'dotting', 'sponge', 'airbrush',
    'encapsulated', 'cat eye', '3d', 'embossed', 'chrome powder',
    'magnetic', 'thermal', 'color changing',
  ],
  colors: [
    'red', 'pink', 'blue', 'green', 'purple', 'black', 'white',
    'gold', 'silver', 'nude', 'coral', 'orange', 'yellow',
    'teal', 'turquoise', 'lavender', 'burgundy', 'navy',
    'rose gold', 'champagne', 'mauve', 'berry', 'plum',
    'emerald', 'sapphire', 'ruby', 'copper', 'bronze',
  ],
}

export type SortMode = typeof SCRAPER_CONFIG.sortModes[number]
export type TimeFilter = typeof SCRAPER_CONFIG.timeFilters[number]
