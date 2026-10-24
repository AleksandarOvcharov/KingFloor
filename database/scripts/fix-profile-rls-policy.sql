-- Fix RLS: private profiles should only be readable by their owner.
-- Previously: USING (true) — anyone with the anon key could read all rows.
-- Now: public profiles are visible to everyone; private profiles only to the owner.
--
-- Run this once in your Supabase SQL editor.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by owner or if public"
    ON public.profiles FOR SELECT
    USING (
        is_public = true          -- visible to anyone when public
        OR auth.uid() = id        -- always visible to the profile owner
    );
