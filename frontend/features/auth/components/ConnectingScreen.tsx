'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react';

const MESSAGES = [
  'Opening your company workspace...',
  'Checking your company access...',
  'Preparing your AI assistant...',
  'Finalizing secure connection...',
  'Redirecting to Dashboard...',
];

const STEP_DURATION = 800;

interface ConnectingScreenProps {
  onContinue?: () => void;
}

export default function ConnectingScreen({
  onContinue,
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
        }
        return Math.min(next, MESSAGES.length - 1);
      });
    }, STEP_DURATION);

    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, []);

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
              {isDone ? (
                <CheckCircle2 className="w-10 h-10 text-white" />
              ) : (
                <LockKeyhole className="w-10 h-10 text-white" />
              )}
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
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <LoaderCircle className="w-4 h-4 text-white animate-spin" />
              )}
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

          {isDone && (
            <button
              type="button"
              onClick={onContinue}
              className="mt-10 w-full h-12 rounded bg-white text-[#2f3131] text-[16px] leading-[24px] font-medium hover:bg-[#e2e2e2] transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
