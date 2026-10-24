-- Add is_public column to profiles table
-- Run this once in your Supabase SQL editor

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- (Optional) Update RLS so that anonymous users can only SELECT public profiles via the anon key.
-- The admin client (service role) used server-side bypasses RLS, so the API route
-- enforces the is_public check in application code for full control.
