'use client';

import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type AuthMode = 'sign-in' | 'sign-up';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading, configError, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading session...
      </div>
    );
  }

  if (session) {
    return children;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        await signUp(email, password);
        setStatus(
          'Check your email and confirm your account before signing in.',
        );
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Auth failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-lg border border-border bg-sidebar p-5 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#00e5cc] text-black">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Research Docs
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue.
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-3" onSubmit={submit}>
          <label className="flex flex-col gap-1.5 text-sm">
            Email
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting || Boolean(configError)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Password
            <div className="relative">
              <Input
                type={showPassword && mode === 'sign-up' ? 'text' : 'password'}
                autoComplete={
                  mode === 'sign-in' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting || Boolean(configError)}
                minLength={6}
                className={mode === 'sign-up' ? 'pr-10' : undefined}
                required
              />
              {mode === 'sign-up' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting || Boolean(configError)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </Button>
              )}
            </div>
          </label>
          {mode === 'sign-up' && (
            <label className="flex flex-col gap-1.5 text-sm">
              Confirm password
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isSubmitting || Boolean(configError)}
                minLength={6}
                required
              />
            </label>
          )}

          {(configError || status) && (
            <p className="min-h-5 text-sm text-muted-foreground">
              {configError || status}
            </p>
          )}

          <Button
            type="submit"
            className="mt-1 bg-[#00e5cc] text-black hover:bg-[#00d4b8]"
            disabled={isSubmitting || Boolean(configError)}
          >
            {mode === 'sign-in' ? (
              <LogIn className="size-4" aria-hidden="true" />
            ) : (
              <UserPlus className="size-4" aria-hidden="true" />
            )}
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          className="mt-3 w-full"
          onClick={() =>
            setMode((current) => {
              setStatus(null);
              setConfirmPassword('');
              setShowPassword(false);
              return current === 'sign-in' ? 'sign-up' : 'sign-in';
            })
          }
          disabled={isSubmitting || Boolean(configError)}
        >
          {mode === 'sign-in'
            ? 'Need an account? Create one'
            : 'Already have an account? Sign in'}
        </Button>
      </section>
    </main>
  );
}
