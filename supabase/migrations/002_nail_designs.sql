-- ============================================
-- NailXR - Nail Designs Table
-- Stores scraped nail design metadata for 
-- gallery, AR try-on, and ML training
-- ============================================

-- Nail designs table
CREATE TABLE IF NOT EXISTS public.nail_designs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  source_url TEXT,
  author TEXT,
  subreddit TEXT,
  score INTEGER DEFAULT 0,
  upvote_ratio NUMERIC(3,2) DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  
  -- Categories (JSONB for flexibility)
  categories JSONB DEFAULT '{"styles":[],"shapes":[],"types":[],"techniques":[],"colors":[]}',
  tags TEXT[] DEFAULT '{}',
  
  -- Quality & moderation
  quality_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Image metadata
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  
  -- Storage
  storage_path TEXT,
  
  -- Multi-tenant support
  tenant_id UUID REFERENCES public.tenants(id),
  
  -- Timestamps
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nail_designs_status ON public.nail_designs(status);
CREATE INDEX IF NOT EXISTS idx_nail_designs_quality ON public.nail_designs(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_nail_designs_score ON public.nail_designs(score DESC);
CREATE INDEX IF NOT EXISTS idx_nail_designs_subreddit ON public.nail_designs(subreddit);
CREATE INDEX IF NOT EXISTS idx_nail_designs_tags ON public.nail_designs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_nail_designs_categories ON public.nail_designs USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_nail_designs_tenant ON public.nail_designs(tenant_id);

-- Full text search on title
CREATE INDEX IF NOT EXISTS idx_nail_designs_title_search ON public.nail_designs 
  USING GIN(to_tsvector('english', title));

-- Enable RLS
ALTER TABLE public.nail_designs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read approved designs
CREATE POLICY "Anyone can view approved designs"
  ON public.nail_designs
  FOR SELECT
  USING (status = 'approved' OR auth.role() = 'service_role');

-- Only service role can insert/update (scraper runs server-side)
CREATE POLICY "Service role can manage designs"
  ON public.nail_designs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Scraper runs tracking
CREATE TABLE IF NOT EXISTS public.scraper_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Stats
  subreddits_scraped TEXT[] DEFAULT '{}',
  total_posts_found INTEGER DEFAULT 0,
  total_images_downloaded INTEGER DEFAULT 0,
  total_duplicates_skipped INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  
  -- Config used
  config JSONB,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on scraper_runs
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage scraper runs"
  ON public.scraper_runs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Model training runs
CREATE TABLE IF NOT EXISTS public.training_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Config
  config JSONB,
  
  -- Metrics
  best_iou NUMERIC(5,4),
  best_dice NUMERIC(5,4),
  final_loss NUMERIC(8,6),
  total_epochs INTEGER DEFAULT 0,
  
  -- Model info
  model_path TEXT,
  onnx_path TEXT,
  model_size_mb NUMERIC(6,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.training_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage training runs"
  ON public.training_runs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger
DROP TRIGGER IF EXISTS update_nail_designs_updated_at ON public.nail_designs;
CREATE TRIGGER update_nail_designs_updated_at
  BEFORE UPDATE ON public.nail_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
