'use client';

import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply?: string;
  error?: string;
}

const chatApiUrl =
  process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:4000/chat';

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(chatApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = (await response.json()) as ChatResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chatbot response.');
      }

      const reply = data.reply?.trim() || 'No response.';

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: reply },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'The backend chatbot did not respond. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-mono">
      <div className="w-full flex flex-col h-[90vh] bg-zinc-900 rounded-2xl border border-zinc-700/50 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Sparkles size={15} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 tracking-wide">
              Gemini
            </p>
            <p className="text-[11px] text-zinc-500">backend chatbot</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-zinc-500">online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Bot size={26} className="text-zinc-400" />
              </div>
              <p className="text-zinc-500 text-sm">
                Send a message to start chatting
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-amber-400/10 border border-amber-400/20'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                {msg.role === 'user' ? (
                  <User size={13} className="text-amber-400" />
                ) : (
                  <Bot size={13} className="text-zinc-400" />
                )}
              </div>

              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-amber-400/10 border border-amber-400/15 text-zinc-100 rounded-tr-sm'
                    : 'bg-zinc-800 border border-zinc-700/60 text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-start">
              <div className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Bot size={13} className="text-zinc-400" />
              </div>
              <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-zinc-800 border border-zinc-700/60">
                <Loader2 size={14} className="text-zinc-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-zinc-700/50 bg-zinc-900/80">
          <div className="flex gap-2 items-center bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 focus-within:border-amber-400/40 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-50"
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              aria-label="Send message"
            >
              <Send size={13} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
