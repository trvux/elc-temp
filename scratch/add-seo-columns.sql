-- SQL script to add SEO columns (meta_title and meta_description) to all relevant content tables.
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/gdzihzsjfczuggwpykjk/sql)

-- 1. Table: projects (SEO for projects)
ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
ADD COLUMN IF NOT EXISTS "meta_description" TEXT;

-- 2. Table: news (SEO for news articles)
ALTER TABLE "public"."news" 
ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
ADD COLUMN IF NOT EXISTS "meta_description" TEXT;

-- 3. Table: pages (SEO for static pages)
ALTER TABLE "public"."pages" 
ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
ADD COLUMN IF NOT EXISTS "meta_description" TEXT;

-- 4. Table: services (SEO for services)
ALTER TABLE "public"."services" 
ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
ADD COLUMN IF NOT EXISTS "meta_description" TEXT;

-- 5. Table: branches (SEO for store branches)
ALTER TABLE "public"."branches" 
ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
ADD COLUMN IF NOT EXISTS "meta_description" TEXT;

-- The following tables already have meta_title and meta_description in your database:
-- - brands
-- - categories
-- - products
