-- Add extended profile fields
-- Run this once in your Supabase SQL editor

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS display_name   TEXT,
    ADD COLUMN IF NOT EXISTS location       TEXT,
    ADD COLUMN IF NOT EXISTS website        TEXT,
    ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
    ADD COLUMN IF NOT EXISTS github_handle  TEXT;
