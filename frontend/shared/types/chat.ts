export type ChatRole = 'user' | 'assistant';

export type Citation = {
  sourceId: string;
  label: string;
  documentId: string | null;
  chunkId: string | null;
  chunkIndex: number | null;
  pageNumber: number | null;
  filename: string | null;
  preview: string;
};

export type Message = {
  id: string;
  role: ChatRole;
  content: string;
  attachment?: { name: string };
  citations?: Citation[];
  tone?: 'normal' | 'success' | 'error';
};

export type ChatApiMessage = {
  role: ChatRole;
  content: string;
};

export type ChatConversationApi = {
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

export type ChatHistoryMessageApi = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations?: Citation[];
};

export type ChatResponse = {
  conversationId?: string;
  conversation?: Conversation | null;
  reply?: string;
  citations?: Citation[];
  retrieval?: {
    sourceCount: number;
    retrievalFailed: boolean;
    contextTruncated: boolean;
  };
  warnings?: string[];
  error?: string;
};

export type ChatConversationsResponse = {
  conversations?: ChatConversationApi[];
  error?: string;
};

export type ChatMessagesResponse = {
  conversationId?: string;
  messages?: ChatHistoryMessageApi[];
  error?: string;
};

export type DeleteConversationResponse = {
  ok?: boolean;
  deleted?: number;
  error?: string;
};

export type SendPayload = {
  text: string;
  file: File | null;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  latestMessagePreview?: string;
  document?: {
    id: string;
    filename: string | null;
  } | null;
  messages: Message[];
};
