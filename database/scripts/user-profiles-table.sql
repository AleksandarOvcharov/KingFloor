-- Create profiles table with all fields
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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Read policy: Public profiles visible to everyone, private profiles visible to owner only
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visibility policy" ON public.profiles;
CREATE POLICY "Profiles visibility policy"
    ON public.profiles FOR SELECT
    USING (is_public = true OR auth.uid() = id);

-- 2. Insert policy: Users can only insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Update policy: Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Function to automatically handle new user signup
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

-- Trigger to automatically create profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile edit
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE
    ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for fast profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
