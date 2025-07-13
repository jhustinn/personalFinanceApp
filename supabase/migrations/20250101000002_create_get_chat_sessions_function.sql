/*
  # Create RPC function to get user chat sessions
  1. New Function: get_user_chat_sessions()
  2. Logic: Groups messages by session_id, returning the first message as a title and the timestamp of the last message for sorting.
  3. Security: Uses SECURITY DEFINER to work with RLS while correctly identifying the calling user via auth.uid().
*/
CREATE OR REPLACE FUNCTION get_user_chat_sessions()
RETURNS TABLE(session_id uuid, first_message text, last_message_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Using a CTE to get the first user message for each session
  WITH session_titles AS (
    SELECT
      session_id,
      message,
      created_at,
      ROW_NUMBER() OVER(PARTITION BY session_id ORDER BY created_at ASC) as rn
    FROM public.ai_chat_messages
    WHERE user_id = auth.uid() AND type = 'user'
  ),
  -- Using another CTE to get the last message time for each session
  session_last_activity AS (
    SELECT
      session_id,
      MAX(created_at) as last_activity
    FROM public.ai_chat_messages
    WHERE user_id = auth.uid()
    GROUP BY session_id
  )
  -- Joining the results to get a clean session list
  SELECT
    sla.session_id,
    COALESCE(st.message, 'Percakapan Baru') as first_message,
    sla.last_activity as last_message_at
  FROM session_last_activity sla
  LEFT JOIN session_titles st ON sla.session_id = st.session_id AND st.rn = 1
  ORDER BY sla.last_activity DESC;
$$;

COMMENT ON FUNCTION public.get_user_chat_sessions() IS 'Retrieves a summary of all chat sessions for the currently authenticated user.';
