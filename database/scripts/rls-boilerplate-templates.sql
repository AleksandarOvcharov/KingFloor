-- ==============================================================================
-- Supabase Row Level Security (RLS) Hackathon Boilerplate & Templates
-- 
-- Why this file exists:
-- When you create a new table in Supabase (e.g., `orders`, `projects`, `tasks`, `reports`),
-- Supabase automatically locks it down by default. Queries from client-side `supabase`
-- will return an empty array `[]` with 0 rows unless an RLS policy is defined!
-- ==============================================================================


-- ==============================================================================
-- ⚡ PATTERN 1: 100% Full Open Access (Fastest Hackathon MVP Prototyping)
-- Use when you just want any client to READ, INSERT, UPDATE, DELETE without auth hurdles.
-- ==============================================================================

-- Replace `your_table` with your table name:
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access" ON your_table;
CREATE POLICY "Public full access"
    ON your_table
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 🔒 PATTERN 2: User-Owned Data (Isolated Per-User CRUD)
-- Each logged-in user can only see, create, modify, and delete their OWN rows.
-- Requirement: Table must have a `user_id uuid references auth.users(id)` column!
-- ==============================================================================

ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 1. Users can view only their own records
DROP POLICY IF EXISTS "Users can view own data" ON your_table;
CREATE POLICY "Users can view own data"
    ON your_table
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can insert their own records
DROP POLICY IF EXISTS "Users can insert own data" ON your_table;
CREATE POLICY "Users can insert own data"
    ON your_table
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own records
DROP POLICY IF EXISTS "Users can update own data" ON your_table;
CREATE POLICY "Users can update own data"
    ON your_table
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own records
DROP POLICY IF EXISTS "Users can delete own data" ON your_table;
CREATE POLICY "Users can delete own data"
    ON your_table
    FOR DELETE
    USING (auth.uid() = user_id);


-- ==============================================================================
-- 👁️ PATTERN 3: Public Read (Everyone) + Authenticated Write (Logged-in Only)
-- Great for: Products, blog posts, public venues, leaderboard, comments feed.
-- ==============================================================================

ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (guests & logged-in) can read
DROP POLICY IF EXISTS "Anyone can read" ON your_table;
CREATE POLICY "Anyone can read"
    ON your_table
    FOR SELECT
    USING (true);

-- 2. Only authenticated users can insert
DROP POLICY IF EXISTS "Authenticated users can insert" ON your_table;
CREATE POLICY "Authenticated users can insert"
    ON your_table
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Only owner can update
DROP POLICY IF EXISTS "Owners can update" ON your_table;
CREATE POLICY "Owners can update"
    ON your_table
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Only owner can delete
DROP POLICY IF EXISTS "Owners can delete" ON your_table;
CREATE POLICY "Owners can delete"
    ON your_table
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ==============================================================================
-- 🚨 EMERGENCY FIX: Instant Disable RLS (For rapid local / demo debugging)
-- If your queries return `[]` during demo prep and you don't have time to debug policies:
-- ==============================================================================

ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
