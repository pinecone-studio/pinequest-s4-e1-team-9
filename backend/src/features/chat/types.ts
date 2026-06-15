export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatMessageHistoryItem = ChatMessage & {
  id: string;
  createdAt: string;
  citations?: unknown[];
  eventSources?: unknown[];
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  latestMessagePreview: string;
  document?: {
    id: string;
    filename: string | null;
  } | null;
};
