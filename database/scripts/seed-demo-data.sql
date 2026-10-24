-- ============================================================
-- DEMO DATA SEED SCRIPT
-- ============================================================
-- Run this in your Supabase SQL Editor to populate tables with
-- sample data for instant prototyping. Requires existing auth
-- users or run after signing up test accounts.
--
-- NOTE: This script inserts into tables that have RLS enabled.
-- Run it via the Supabase SQL Editor (which uses the service
-- role) so policies are bypassed.
-- ============================================================

-- ─── Sample Conversations ───
-- Replace 'YOUR_USER_ID' with an actual auth.users UUID
-- after signing up a test account.

-- To find your user ID after signup:
-- SELECT id, email FROM auth.users LIMIT 5;

DO $$
DECLARE
    demo_user_id UUID;
    conv1_id UUID := gen_random_uuid();
    conv2_id UUID := gen_random_uuid();
    conv3_id UUID := gen_random_uuid();
BEGIN
    -- Get the first user (sign up at least one account first)
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Sign up at least one account first, then re-run this script.';
        RETURN;
    END IF;

    RAISE NOTICE 'Seeding demo data for user: %', demo_user_id;

    -- ─── Conversations ───
    INSERT INTO public.chat_conversations (id, user_id, title, created_at) VALUES
        (conv1_id, demo_user_id, 'Getting started with Next.js', NOW() - INTERVAL '3 days'),
        (conv2_id, demo_user_id, 'Tailwind CSS tips', NOW() - INTERVAL '2 days'),
        (conv3_id, demo_user_id, 'Database design help', NOW() - INTERVAL '1 day')
    ON CONFLICT (id) DO NOTHING;

    -- ─── Messages ───
    INSERT INTO public.chat_messages (conversation_id, role, content, created_at) VALUES
        -- Conversation 1
        (conv1_id, 'user', 'How do I create a new page in Next.js App Router?', NOW() - INTERVAL '3 days'),
        (conv1_id, 'model', 'Create a folder inside `app/` with a `page.tsx` file. For example, `app/about/page.tsx` creates the `/about` route.', NOW() - INTERVAL '3 days' + INTERVAL '5 seconds'),
        (conv1_id, 'user', 'What about dynamic routes?', NOW() - INTERVAL '3 days' + INTERVAL '1 minute'),
        (conv1_id, 'model', 'Use bracket syntax: `app/posts/[id]/page.tsx`. Access the param via the `params` prop.', NOW() - INTERVAL '3 days' + INTERVAL '1 minute 5 seconds'),

        -- Conversation 2
        (conv2_id, 'user', 'How do I customize colors in Tailwind v4?', NOW() - INTERVAL '2 days'),
        (conv2_id, 'model', 'In Tailwind v4, use the CSS-first config. Edit the `@theme` block in `globals.css` and define HSL custom properties.', NOW() - INTERVAL '2 days' + INTERVAL '5 seconds'),

        -- Conversation 3
        (conv3_id, 'user', 'What tables do I need for a blog?', NOW() - INTERVAL '1 day'),
        (conv3_id, 'model', 'At minimum: `posts` (id, title, content, author_id, created_at) and `comments` (id, post_id, user_id, content, created_at). Add RLS policies for auth.', NOW() - INTERVAL '1 day' + INTERVAL '5 seconds')
    ON CONFLICT (id) DO NOTHING;

    -- ─── Analytics Events ───
    INSERT INTO public.analytics_events (user_id, event_type, event_data, created_at) VALUES
        (demo_user_id, 'conversation_created', '{"title": "Getting started with Next.js"}'::jsonb, NOW() - INTERVAL '3 days'),
        (demo_user_id, 'message_sent', '{"conversation_id": "' || conv1_id || '"}'::jsonb, NOW() - INTERVAL '3 days'),
        (demo_user_id, 'message_received', '{"conversation_id": "' || conv1_id || '"}'::jsonb, NOW() - INTERVAL '3 days'),
        (demo_user_id, 'message_sent', '{"conversation_id": "' || conv1_id || '"}'::jsonb, NOW() - INTERVAL '3 days' + INTERVAL '1 minute'),
        (demo_user_id, 'message_received', '{"conversation_id": "' || conv1_id || '"}'::jsonb, NOW() - INTERVAL '3 days' + INTERVAL '1 minute'),
        (demo_user_id, 'conversation_created', '{"title": "Tailwind CSS tips"}'::jsonb, NOW() - INTERVAL '2 days'),
        (demo_user_id, 'message_sent', '{"conversation_id": "' || conv2_id || '"}'::jsonb, NOW() - INTERVAL '2 days'),
        (demo_user_id, 'message_received', '{"conversation_id": "' || conv2_id || '"}'::jsonb, NOW() - INTERVAL '2 days'),
        (demo_user_id, 'conversation_created', '{"title": "Database design help"}'::jsonb, NOW() - INTERVAL '1 day'),
        (demo_user_id, 'message_sent', '{"conversation_id": "' || conv3_id || '"}'::jsonb, NOW() - INTERVAL '1 day'),
        (demo_user_id, 'message_received', '{"conversation_id": "' || conv3_id || '"}'::jsonb, NOW() - INTERVAL '1 day'),
        (demo_user_id, 'profile_updated', '{"field": "username"}'::jsonb, NOW() - INTERVAL '4 days'),
        (demo_user_id, 'profile_updated', '{"field": "bio"}'::jsonb, NOW() - INTERVAL '4 days');

    RAISE NOTICE 'Demo data seeded: 3 conversations, 8 messages, 13 analytics events.';
END $$;
