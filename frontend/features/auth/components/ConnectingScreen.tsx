'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Opening your company workspace...',
  'Checking your company access...',
  'Preparing your AI assistant...',
  'Finalizing secure connection...',
  'Redirecting to Dashboard...',
];

const STEP_DURATION = 800;

interface ConnectingScreenProps {
  onComplete?: () => void;
}

export default function ConnectingScreen({
  onComplete,
}: ConnectingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const isDone = messageIndex >= MESSAGES.length - 1;

  useEffect(() => {
    const kickoff = setTimeout(() => setProgress(100), 100);

    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = prev + 1;
        if (next >= MESSAGES.length) {
          clearInterval(interval);

          setTimeout(() => onComplete?.(), 600);
        }
        return Math.min(next, MESSAGES.length - 1);
      });
    }, STEP_DURATION);

    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col bg-[#131313] text-[#e5e2e1] antialiased">
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="text-[400px] text-[#c4c7c8]">⬡</span>
        </div>

        <div className="z-10 flex flex-col items-center max-w-sm w-full text-center">
          <div className="mb-10 relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 border border-[#444748] rounded-full animate-pulse" />

            <div className="absolute inset-2 border border-[#353534] rounded-full bg-[#1c1b1b] flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl md:text-[32px] md:leading-[40px] font-semibold tracking-tight text-white mb-2">
            Authentication Successful
          </h1>
          <p className="text-[16px] leading-[24px] text-[#c4c7c8] mb-10 max-w-xs mx-auto">
            Securely connecting to your enterprise environment.
          </p>

          <div className="w-full bg-[#353534] border border-[#444748] rounded-full h-1 overflow-hidden mb-4 relative">
            <div
              className="h-full bg-white absolute left-0 top-0"
              style={{
                width: `${progress}%`,
                transition: `width ${STEP_DURATION * MESSAGES.length}ms cubic-bezier(0.65, 0, 0.35, 1)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 text-white ${isDone ? '' : 'animate-spin'}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <span
                className={`text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium text-[#c4c7c8] transition-opacity duration-300 ${
                  isDone ? 'text-white opacity-100' : 'opacity-70'
                }`}
              >
                {MESSAGES[messageIndex]}
              </span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium text-[#c4c7c8]">
              AES-256
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
