-- Repair Supabase projects where this migration was marked applied but the
-- physical chat_messages table was missing the newer chat history columns.
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx
  ON public.chat_messages(user_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_created_at_idx
  ON public.chat_messages(user_id, created_at);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_conversation_id_created_at_idx
  ON public.chat_messages(user_id, conversation_id, created_at);
