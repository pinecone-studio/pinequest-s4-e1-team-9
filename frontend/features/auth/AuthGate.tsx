'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  UserCircle,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Alert,
  FormField,
  LoadingState,
  ProductLogo,
  StatusPill,
  Surface,
} from '@/shared/ui/product';

type AuthMode = 'sign-in' | 'sign-up';

function AuthTextInput({
  className = '',
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      className={[
        'h-9 w-full min-w-0 rounded-lg border border-input bg-input px-3 py-1 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 md:text-sm',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

function validateDisplayName(value: string) {
  const name = value.replace(/\s+/g, ' ').trim();

  if (name.length < 2) {
    return 'Name must be at least 2 characters.';
  }

  if (name.length > 80) {
    return 'Name must be 80 characters or fewer.';
  }

  return null;
}

function ProfileCompletionScreen({
  initialName,
  onSave,
}: {
  initialName: string;
  onSave: (name: string) => Promise<unknown>;
}) {
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateDisplayName(value);

    if (validation) {
      setError(validation);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(value);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <Surface className="w-full max-w-md p-5 sm:p-6">
        <div className="mb-5">
          <ProductLogo />
          <h1 className="mt-5 text-xl font-semibold">Complete your profile</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add the name other members and AI owners should see before you continue.
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form className="grid gap-4" onSubmit={submit}>
          <FormField id="complete-profile-name" label="Name" error={error ?? undefined}>
            <Input
              id="complete-profile-name"
              value={value}
              minLength={2}
              maxLength={80}
              autoComplete="name"
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'complete-profile-name-error' : undefined}
              required
            />
          </FormField>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save and continue'}
          </Button>
        </form>
      </Surface>
    </div>
  );
}

export default function AuthGate({
  children,
  initialMode = 'sign-in',
  authenticatedRedirectTo,
}: {
  children: React.ReactNode;
  initialMode?: AuthMode;
  authenticatedRedirectTo?: string;
}) {
  const router = useRouter();
  const {
    session,
    isLoading,
    isProfileLoading,
    configError,
    profile,
    profileError,
    refreshProfile,
    signIn,
    signUp,
    updateProfileName,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (
      session &&
      profile &&
      !profile.requiresNameCompletion &&
      authenticatedRedirectTo
    ) {
      router.replace(authenticatedRedirectTo);
    }
  }, [authenticatedRedirectTo, profile, router, session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <LoadingState label="Checking your session..." className="min-h-[calc(100vh-2rem)]" />
      </div>
    );
  }

  if (session) {
    if (isProfileLoading) {
      return (
        <div className="min-h-screen bg-background p-4">
          <LoadingState label="Loading your profile..." className="min-h-[calc(100vh-2rem)]" />
        </div>
      );
    }

    if (profileError && !profile) {
      return (
        <div className="grid min-h-screen place-items-center bg-background px-4">
          <div className="w-full max-w-md">
            <Alert variant="error" title="Profile could not load" className="mb-4">
              {profileError}
            </Alert>
            <Button type="button" onClick={() => void refreshProfile()} className="w-full">
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (profile?.requiresNameCompletion) {
      return (
        <ProfileCompletionScreen
          initialName={profile.name}
          onSave={updateProfileName}
        />
      );
    }

    if (authenticatedRedirectTo) {
      return (
        <div className="min-h-screen bg-background p-4">
          <LoadingState label="Opening your workspace..." className="min-h-[calc(100vh-2rem)]" />
        </div>
      );
    }

    return children;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else {
        const validation = validateDisplayName(name);
        if (validation) {
          setStatus(validation);
          return;
        }
        await signUp(name, email, password);
      }
      if (authenticatedRedirectTo) {
        router.replace(authenticatedRedirectTo);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSignUp = mode === 'sign-up';

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex min-h-14 items-center justify-between">
          <ProductLogo />
          <StatusPill tone="success">
            <ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />
            Private workspace
          </StatusPill>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,440px)]">
          <section className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Document AI platform
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Secure answers from the documents your team trusts.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Create AI assistants, upload source PDFs, invite members, and keep
              every chat scoped to the right workspace.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Create AIs', 'Guided setup'],
                ['Upload PDFs', 'Source-backed answers'],
                ['Invite safely', 'Owner and Member roles'],
              ].map(([title, detail]) => (
                <div
                  key={title}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <Surface className="p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                {isSignUp ? 'Create your account' : 'Sign in'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isSignUp
                  ? 'Start a workspace or join one with an invitation code.'
                  : 'Open your dashboard, chats, and AI management tools.'}
              </p>
            </div>

            {configError && (
              <Alert variant="error" title="Authentication is not configured" className="mb-4">
                {configError}
              </Alert>
            )}

            {status && (
              <Alert variant="error" className="mb-4">
                {status}
              </Alert>
            )}

            <form className="grid gap-4" onSubmit={submit}>
              {isSignUp && (
                <FormField
                  id="name"
                  label="Name"
                  description="Use the display name other members should see."
                >
                  <div className="relative">
                    <UserCircle
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <AuthTextInput
                      id="name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </FormField>
              )}

              <FormField
                id="email"
                label="Email address"
                description="Use the email tied to your workspace invitation."
              >
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <AuthTextInput
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>

              <FormField
                id="password"
                label="Password"
                description={isSignUp ? 'Use at least 6 characters.' : undefined}
              >
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <AuthTextInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormField>

              <Button type="submit" disabled={isSubmitting || Boolean(configError)} className="mt-2">
                {isSignUp ? (
                  <UserPlus className="size-4" aria-hidden="true" />
                ) : (
                  <ArrowRight className="size-4" aria-hidden="true" />
                )}
                {isSubmitting
                  ? isSignUp
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(isSignUp ? 'sign-in' : 'sign-up');
                  setStatus(null);
                }}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </Surface>
        </main>
      </div>
    </div>
  );
}
