'use client';

import { Mail, ExternalLink } from 'lucide-react';

interface EmailVerificationProps {
  onOpenEmailApp?: () => void;
  onResend?: () => void;
  onUseDifferentEmail?: () => void;
}

export default function EmailVerification({
  onOpenEmailApp,
  onResend,
  onUseDifferentEmail,
}: EmailVerificationProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#131313]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #2a2a2a 1px, transparent 1px),
          linear-gradient(to bottom, #2a2a2a 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        backgroundPosition: 'center top',
      }}
    >
      <header className="fixed top-0 left-0 w-full flex justify-center items-center py-4 z-50 bg-[#131313]/80 backdrop-blur-md border-b border-[#444748] px-12">
        <div className="flex items-center gap-2 cursor-pointer">
          <Mail className="w-5 h-5 text-white" />
          <span className="text-2xl md:text-[32px] font-semibold tracking-tight text-white">
            CompanyDoc AI
          </span>
        </div>
      </header>

      <main className="w-full max-w-md border border-[#444748] rounded-xl p-6 flex flex-col items-center text-center mt-10 z-10 relative shadow-2xl bg-[#201f1f]">
        <div className="w-16 h-16 rounded-full bg-[#201f1f] flex items-center justify-center border border-[#444748] mb-6">
          <Mail className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
          Check your email
        </h1>
        <p className="text-[16px] leading-[24px] text-[#c4c7c8] mb-10 px-2">
          We sent a verification link to your email. Verify your account to
          continue.
        </p>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={onOpenEmailApp}
            className="w-full bg-white text-[#2f3131] py-3 rounded text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium uppercase hover:bg-[#e2e2e2] transition-colors flex items-center justify-center gap-2"
          >
            Open email app
            <ExternalLink className="w-4 h-4" />
          </button>

          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={onResend}
              className="w-full bg-transparent border border-[#444748] text-white py-3 rounded text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium uppercase hover:bg-[#201f1f] transition-colors"
            >
              Resend verification email
            </button>
            <button
              onClick={onUseDifferentEmail}
              className="w-full text-[#c4c7c8] py-2 text-[14px] leading-[20px] hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full flex justify-center items-center py-4 text-center text-[#c4c7c8] text-[14px] leading-[20px] bg-[#131313]/90 z-0">
        © 2026 CompanyDoc AI. Enterprise-Grade Intelligence.
      </footer>
    </div>
  );
}
