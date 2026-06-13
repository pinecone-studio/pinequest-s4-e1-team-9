'use client';

import { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';

type AuthMode = 'sign-in' | 'sign-up';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-[#0A0A0A] text-sm text-[#8e9192]">
        Loading session...
      </div>
    );
  }

  if (session) return children;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setStatus('Check your email to confirm your account.');
      }
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'sign-up') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col items-center justify-center p-4 md:p-12 antialiased">
        <div className="w-full max-w-md bg-[#171717] border border-[#262626] rounded-xl p-10 shadow-none">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2a2a2a] border border-[#444748] mb-4">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <h1 className="text-2xl md:text-[32px] md:leading-[40px] font-semibold tracking-tight text-white mb-2">
              Create your account
            </h1>
            <p className="text-[16px] leading-[24px] text-[#c4c7c8]">
              Start building or join your company's AI document assistant.
            </p>
          </div>

          {status && (
            <div className="mb-6 text-sm text-[#c4c7c8] bg-[#1c1b1b] border border-[#444748] rounded px-4 py-3">
              {status}
            </div>
          )}

          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="block text-[12px] leading-[16px] tracking-[0.05em] font-medium font-mono text-[#8e9192] uppercase"
              >
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-[#444748]" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#171717] border border-[#404040] focus:border-white focus:ring-0 text-white text-[16px] leading-[24px] rounded h-11 pl-10 pr-4 transition-colors placeholder:text-[#444748] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="workEmail"
                className="block text-[12px] leading-[16px] tracking-[0.05em] font-medium font-mono text-[#8e9192] uppercase"
              >
                Work email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-[#444748]" />
                </div>
                <input
                  id="workEmail"
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#171717] border border-[#404040] focus:border-white focus:ring-0 text-white text-[16px] leading-[24px] rounded h-11 pl-10 pr-4 transition-colors placeholder:text-[#444748] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signupPassword"
                className="block text-[12px] leading-[16px] tracking-[0.05em] font-medium font-mono text-[#8e9192] uppercase"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[#444748]" />
                </div>
                <input
                  id="signupPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#171717] border border-[#404040] focus:border-white focus:ring-0 text-white text-[16px] leading-[24px] rounded h-11 pl-10 pr-12 transition-colors placeholder:text-[#444748] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444748] hover:text-[#c4c7c8] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FAFAFA] text-[#0A0A0A] text-[16px] leading-[24px] font-medium h-11 rounded hover:bg-[#e2e2e2] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Creating account...</span>
              ) : (
                <>
                  Create account
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-[14px] leading-[20px] text-[#c4c7c8]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('sign-in');
                setStatus(null);
              }}
              className="text-white hover:underline transition-all ml-1"
            >
              Sign in
            </button>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 max-w-md text-center">
          <Lock className="w-4 h-4 text-[#444748] flex-shrink-0" />
          <p className="text-[14px] leading-[20px] text-[#444748]">
            Secure access. Company documents stay private to your workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#131313] text-[#e5e2e1] antialiased">
      <header className="w-full sticky top-0 z-50 bg-[#0e0e0e] border-b border-[#444748]">
        <div className="flex justify-between items-center h-16 px-6 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 text-[#c6c6c7]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <span className="font-bold text-[#c4c7c8] tracking-tight text-base">
              CompanyDoc AI
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row w-full">
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#131313] min-h-[calc(100vh-64px)]">
          <div className="w-full max-w-[400px]">
            <div className="mb-10">
              <h1 className="text-[32px] leading-[40px] font-semibold tracking-tight text-[#e5e2e1] mb-2">
                Welcome back
              </h1>
              <p className="text-[16px] leading-[24px] text-[#c4c7c8]">
                Sign in to access your company AI workspace.
              </p>
            </div>

            {status && (
              <div className="mb-6 text-sm text-[#c4c7c8] bg-[#1c1b1b] border border-[#444748] rounded px-4 py-3">
                {status}
              </div>
            )}

            <form className="space-y-6" onSubmit={submit}>
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-[12px] leading-[16px] tracking-[0.05em] font-medium font-mono text-[#c4c7c8] uppercase"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#171717] border border-[#404040] focus:border-white focus:ring-0 text-[#e5e2e1] text-[16px] leading-[24px] rounded h-12 px-4 transition-colors placeholder:text-[#8e9192] outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-[12px] leading-[16px] tracking-[0.05em] font-medium font-mono text-[#c4c7c8] uppercase"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[14px] text-white hover:text-[#c6c6c7] transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#171717] border border-[#404040] focus:border-white focus:ring-0 text-[#e5e2e1] text-[16px] leading-[24px] rounded h-12 px-4 pr-12 transition-colors placeholder:text-[#8e9192] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e9192] hover:text-[#c4c7c8] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-[#2f3131] text-[16px] leading-[24px] font-medium h-12 rounded hover:bg-[#e2e2e2] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    Sign in <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-[16px] leading-[24px] text-[#c4c7c8]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('sign-up');
                    setStatus(null);
                  }}
                  className="text-white hover:text-[#c6c6c7] transition-colors ml-1"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex w-1/2 bg-[#1c1b1b] border-l border-[#444748] p-12 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_#3a4a5f,_#131313,_#131313)] pointer-events-none" />
          <div className="relative w-full max-w-[600px] aspect-[4/3] bg-[#171717] border border-[#262626] rounded-xl flex flex-col overflow-hidden shadow-2xl">
            <div className="h-12 border-b border-[#262626] flex items-center px-4 gap-2 bg-[#0A0A0A]">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-[#404040]" />
                <div className="w-3 h-3 rounded-full bg-[#404040]" />
                <div className="w-3 h-3 rounded-full bg-[#404040]" />
              </div>
              <div className="flex-grow flex justify-center">
                <div className="bg-[#171717] border border-[#262626] h-6 px-6 rounded text-[12px] font-mono text-[#c4c7c8] flex items-center">
                  companydoc.ai/workspace
                </div>
              </div>
            </div>
            <div className="flex-grow p-4 grid grid-cols-3 gap-3 bg-[#0A0A0A]">
              <div className="col-span-1 border border-[#262626] rounded bg-[#171717] p-3 space-y-2">
                <div className="h-4 w-2/3 bg-[#262626] rounded mb-3" />
                <div className="h-3 w-full bg-[#262626] rounded opacity-50" />
                <div className="h-3 w-4/5 bg-[#262626] rounded opacity-50" />
                <div className="h-3 w-full bg-[#262626] rounded opacity-50" />
              </div>
              <div className="col-span-2 space-y-3 flex flex-col">
                <div className="h-24 border border-[#262626] rounded bg-[#171717] p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="h-4 w-1/3 bg-[#262626] rounded" />
                    <div className="h-4 w-4 bg-[#262626] rounded-full" />
                  </div>
                  <div className="h-8 w-1/2 bg-[#404040] rounded" />
                </div>
                <div className="flex-grow grid grid-cols-2 gap-3">
                  <div className="border border-[#262626] rounded bg-[#171717] p-3 flex flex-col gap-2">
                    <div className="h-3 w-1/2 bg-[#262626] rounded" />
                    <div className="flex-grow border border-[#262626] rounded bg-[#0A0A0A]" />
                  </div>
                  <div className="border border-[#262626] rounded bg-[#171717] p-3 flex flex-col gap-2">
                    <div className="h-3 w-1/2 bg-[#262626] rounded" />
                    <div className="h-3 w-full bg-[#262626] rounded opacity-30" />
                    <div className="h-3 w-4/5 bg-[#262626] rounded opacity-30" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-6 right-6 bg-[#262626] border border-[#525252] rounded px-2 py-1 flex items-center gap-2">
              <span className="w-4 h-4 text-white animate-pulse">✦</span>
              <div className="h-2 w-16 bg-[#404040] rounded" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
