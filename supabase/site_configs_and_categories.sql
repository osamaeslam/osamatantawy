-- ============================================================
-- Tantawy Group - Site Configs & Categories Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) Site Configs table (key/value store for global settings)
CREATE TABLE IF NOT EXISTS public.site_configs (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  json_value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_site_configs_key ON public.site_configs(key);

-- Enable RLS
ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read (catalog/config is public)
DROP POLICY IF EXISTS "site_configs_public_read" ON public.site_configs;
CREATE POLICY "site_configs_public_read" ON public.site_configs
  FOR SELECT USING (true);

-- Allow public write (admin panel uses anon key; tighten later with auth if needed)
DROP POLICY IF EXISTS "site_configs_public_write" ON public.site_configs;
CREATE POLICY "site_configs_public_write" ON public.site_configs
  FOR ALL USING (true) WITH CHECK (true);


-- 2) Hero Banners table (slider banners managed from CMS)
CREATE TABLE IF NOT EXISTS public.hero_banners (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge TEXT,
  button_text TEXT,
  category TEXT,
  link_category TEXT,
  bg_gradient TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_banners_sort ON public.hero_banners(sort_order);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hero_banners_public_read" ON public.hero_banners;
CREATE POLICY "hero_banners_public_read" ON public.hero_banners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "hero_banners_public_write" ON public.hero_banners;
CREATE POLICY "hero_banners_public_write" ON public.hero_banners
  FOR ALL USING (true) WITH CHECK (true);


-- 3) Categories table (main section tabs - editable/creatable)
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT DEFAULT 'Package',
  image_url TEXT,
  description_ar TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb,
  subcategories_ar JSONB DEFAULT '[]'::jsonb,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_public_write" ON public.categories;
CREATE POLICY "categories_public_write" ON public.categories
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- Seed default categories (only if empty)
-- ============================================================
INSERT INTO public.categories (name, name_ar, icon, description_ar, subcategories, subcategories_ar, sort_order)
SELECT 'Home Appliances', 'أجهزة منزلية', 'Refrigerator',
  'ثلاجات، غسالات ملابس وأطباق، بوتاجازات، ديب فريزر، ميكروويف، وقلايات هوائية',
  '["ثلاجات","غسالات ملابس","غسالات أطباق","بوتاجازات","ديب فريزر","ميكروويف وأفران","قلايات هوائية"]'::jsonb,
  '["ثلاجات","غسالات ملابس","غسالات أطباق","بوتاجازات","ديب فريزر","ميكروويف وأفران","قلايات هوائية"]'::jsonb,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.categories);

INSERT INTO public.categories (name, name_ar, icon, description_ar, subcategories, subcategories_ar, sort_order)
SELECT 'Electrical Appliances', 'أجهزة كهربيه', 'Tv',
  'شاشات وتلفزيونات، تكييفات هواء، مكانس كهربائية، محضرات طعام، ومراوح',
  '["شاشات","تكييفات","مكانس","محضرات طعام وخلاطات","مكاوي بخار","مراوح ودَفايات"]'::jsonb,
  '["شاشات","تكييفات","مكانس","محضرات طعام وخلاطات","مكاوي بخار","مراوح ودَفايات"]'::jsonb,
  2
WHERE (SELECT COUNT(*) FROM public.categories) < 2;


-- ============================================================
-- Seed default site config entries
-- ============================================================
INSERT INTO public.site_configs (key, value)
SELECT 'hotline', '15218'
WHERE NOT EXISTS (SELECT 1 FROM public.site_configs WHERE key = 'hotline');

INSERT INTO public.site_configs (key, value)
SELECT 'whatsapp_sales_number', '201521800000'
WHERE NOT EXISTS (SELECT 1 FROM public.site_configs WHERE key = 'whatsapp_sales_number');

INSERT INTO public.site_configs (key, value)
SELECT 'announcement_text', 'طنطاوي جروب: أجهزة منزلية وكهربية بأعلى ضمان في مصر • شحن لجميع المحافظات • دفع عند الاستلام بعد الفحص'
WHERE NOT EXISTS (SELECT 1 FROM public.site_configs WHERE key = 'announcement_text');
