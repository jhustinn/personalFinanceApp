/*
  # Create ai_chat_messages table
  1. New Table: ai_chat_messages (id, user_id, session_id, message, type, created_at)
  2. Indexes: Add index on (user_id, created_at) for faster history retrieval.
  3. Security: Enable RLS and add policies for users to access their own chat data.
*/
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type IN ('user', 'ai')),
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_chat_messages IS 'Stores chat history for the AI assistant feature.';
COMMENT ON COLUMN public.ai_chat_messages.session_id IS 'Groups messages into a single conversation.';

-- Add index for efficient querying of user's chat history
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id_created_at ON public.ai_chat_messages(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Users can view their own chat messages"
ON public.ai_chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.ai_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
