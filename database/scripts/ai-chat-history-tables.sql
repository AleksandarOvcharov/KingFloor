-- Create chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations
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
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages
(
    id
    UUID
    DEFAULT
    gen_random_uuid
(
) PRIMARY KEY,
    conversation_id UUID REFERENCES public.chat_conversations
(
    id
) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK
(
    role
    IN
(
    'user',
    'model'
)),
    content TEXT NOT NULL,
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only see/manage their own
CREATE
POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR
SELECT
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can create their own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE
POLICY "Users can update their own conversations"
  ON public.chat_conversations FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE
POLICY "Users can delete their own conversations"
  ON public.chat_conversations FOR DELETE
USING (auth.uid() = user_id);

-- Messages: users can only see/manage messages in their conversations
CREATE
POLICY "Users can view messages in their conversations"
  ON public.chat_messages FOR
SELECT
    USING (
    EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
    )
    );

CREATE
POLICY "Users can insert messages in their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id
    ON public.chat_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
    ON public.chat_messages(conversation_id);