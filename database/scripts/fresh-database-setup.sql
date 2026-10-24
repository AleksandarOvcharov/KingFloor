-- =============================================================================
-- COMPLETE FRESH DATABASE SETUP SCRIPT FOR HACKATHON STARTUP TEMPLATE
-- =============================================================================
-- Run this entire script in your Supabase Dashboard > SQL Editor > New query
-- to set up all tables, RLS policies, automated triggers, and indexes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USER PROFILES TABLE & TRIGGERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_public BOOLEAN DEFAULT true,
    website TEXT,
    github TEXT,
    twitter TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visibility policy" ON public.profiles;
CREATE POLICY "Profiles visibility policy"
    ON public.profiles FOR SELECT
    USING (is_public = true OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id,
        SPLIT_PART(NEW.email, '@', 1),
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE
    ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);


-- -----------------------------------------------------------------------------
-- 2. AI CHAT CONVERSATIONS & MESSAGES TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS Policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their own conversations"
    ON public.chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can create their own conversations"
    ON public.chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can update their own conversations"
    ON public.chat_conversations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can delete their own conversations"
    ON public.chat_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Messages RLS Policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in their conversations"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can insert messages in their conversations"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);


-- -----------------------------------------------------------------------------
-- 3. ANALYTICS EVENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Analytics Events RLS Policies
DROP POLICY IF EXISTS "Users can view their own events" ON public.analytics_events;
CREATE POLICY "Users can view their own events"
    ON public.analytics_events FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own events" ON public.analytics_events;
CREATE POLICY "Users can insert their own events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);


-- -----------------------------------------------------------------------------
-- 4. STORAGE BUCKET POLICIES FOR AVATARS
-- -----------------------------------------------------------------------------
-- Make sure the 'avatars' bucket is created in Storage before running these
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
