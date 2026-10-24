-- Create analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events
(
    id
    UUID
    DEFAULT
    gen_random_uuid
(
) PRIMARY KEY,
    user_id UUID REFERENCES auth.users
(
    id
) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own events
CREATE
POLICY "Users can view their own events"
  ON public.analytics_events FOR
SELECT
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can insert their own events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
    ON public.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type
    ON public.analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
    ON public.analytics_events(created_at DESC);