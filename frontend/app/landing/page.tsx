'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import GeminiLogo from '@/features/chat/components/GeminiLogo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const isAuthenticated = !isLoading && Boolean(session);

  const getStartedLabel = isAuthenticated ? 'Open Dashboard' : 'Get Started';
  const chatLabel = isAuthenticated ? 'Open Chat' : 'Chat with My Company Bot';
  const createLabel = isAuthenticated ? 'Open Dashboard' : 'Create Company AI';
  const logInLabel = isAuthenticated ? 'Open Chat' : 'Log in';

  return (
    <div className="bg-background text-foreground antialiased min-h-screen flex flex-col font-['Inter']">
      {/* Top App Bar */}
      <header className="bg-background w-full top-0 sticky border-b border-border z-50">
        <div className="flex justify-between items-center h-16 px-6 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <GeminiLogo size={26} aria-label="Gemini" />
            <span className="font-semibold text-lg tracking-tight text-foreground">
              CompanyDoc AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#product"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
            >
              How it works
            </a>
            <a
              href="#security"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
            >
              Security
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  router.push('/chat');
                } else {
                  router.push('/login?redirect=/');
                }
              }}
              className="hidden md:block text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
            >
              {logInLabel}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="bg-foreground text-background text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              {getStartedLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-10 pb-10 md:pt-24 md:pb-32 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-secondary border border-border text-muted-foreground text-xs tracking-wide mb-6">
              Private AI assistants for internal company knowledge
            </span>

            <h1 className="font-bold text-4xl md:text-[56px] md:leading-[64px] text-foreground max-w-4xl mx-auto tracking-tight mb-6">
              Your company documents,
              <br />
              answered instantly.
            </h1>

            <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
              Create a secure AI assistant from PDFs, policies, manuals, and
              internal documents. Employees get clear answers with sources from
              approved company files.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 sm:mb-24">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="w-full sm:w-auto bg-foreground text-background text-sm font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
              >
                {createLabel}
              </button>
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="w-full sm:w-auto bg-background text-foreground border border-border text-sm font-medium px-6 py-3 rounded-lg hover:bg-secondary transition-colors shadow-sm"
              >
                {chatLabel}
              </button>
            </div>

            {/* Product mockup */}
            <div
              id="product"
              className="relative mx-auto max-w-5xl rounded-xl border border-border shadow-2xl bg-background overflow-hidden scroll-mt-24"
            >
              <div className="flex items-center px-4 py-3 bg-secondary border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <div className="w-3 h-3 rounded-full bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_260px]">
                {/* Sidebar */}
                <div className="flex flex-col gap-2 border-b border-border p-4 text-left md:border-b-0 md:border-r">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <GeminiLogo size={26} aria-label="Gemini" />
                    CompanyDoc AI
                  </div>
                  <div className="rounded-md px-2 py-1.5 text-sm text-muted-foreground">
                    Documents
                  </div>
                  <div className="rounded-md bg-secondary px-2 py-1.5 text-sm font-medium text-foreground">
                    Chat
                  </div>
                  <div className="rounded-md px-2 py-1.5 text-sm text-muted-foreground">
                    Members
                  </div>
                  <div className="rounded-md px-2 py-1.5 text-sm text-muted-foreground">
                    Settings
                  </div>
                  <div className="mt-auto pt-4 text-xs text-muted-foreground">
                    12 documents indexed
                  </div>
                </div>

                {/* Chat */}
                <div className="flex flex-col gap-3 border-b border-border p-4 text-left md:border-b-0 md:border-r">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl bg-secondary px-4 py-2 text-sm text-foreground">
                      What is our vacation policy?
                    </div>
                  </div>
                  <div className="max-w-[90%] rounded-2xl bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground">
                    According to the Employee Handbook, full-time employees are
                    eligible for 15 days of paid vacation annually after six
                    months of continuous service. Vacation time must be
                    requested and approved at least two weeks in advance.
                    <div className="mt-2">
                      <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        Employee Handbook, page 12
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document preview */}
                <div className="p-4 text-left text-sm">
                  <p className="mb-2 font-semibold text-foreground">
                    Employee Handbook
                  </p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Vacation accrual begins on an employee&apos;s start date.
                    Unused vacation may roll over up to a limit defined by local
                    policy. Requests should be submitted through the HR portal.
                  </p>
                  <p className="mb-2 rounded-md bg-accent/20 p-2 text-xs text-foreground">
                    Full-time employees are eligible for 15 days of paid
                    vacation annually after six months of continuous service.
                    Vacation time must be requested and approved at least two
                    weeks in advance.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For part-time staff, vacation accrual is prorated based on
                    scheduled hours per week.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="px-6 pb-16 md:pb-24 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center font-semibold text-2xl md:text-3xl text-foreground mb-8">
              How it works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border p-5">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  1. Upload documents
                </p>
                <p className="text-sm text-muted-foreground">
                  Add PDFs, policies, and manuals. They&apos;re chunked,
                  embedded, and indexed automatically.
                </p>
              </div>
              <div className="rounded-xl border border-border p-5">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  2. Invite your team
                </p>
                <p className="text-sm text-muted-foreground">
                  Share an invitation code so colleagues can join your company
                  workspace.
                </p>
              </div>
              <div className="rounded-xl border border-border p-5">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  3. Ask questions
                </p>
                <p className="text-sm text-muted-foreground">
                  Employees chat with the assistant and get answers with
                  citations back to the source PDF.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="px-6 pb-16 md:pb-24 scroll-mt-24">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="font-semibold text-2xl md:text-3xl text-foreground mb-4">
              Security
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Authentication is handled by Supabase Auth. Documents and chat
              history are scoped to your account with row-level security, and
              uploads are stored in a private storage bucket accessible only to
              your company.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 pb-16 md:pb-24 scroll-mt-24">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="font-semibold text-2xl md:text-3xl text-foreground mb-4">
              Pricing
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Create a company and invite your team for free during the pilot.
              Contact us for usage-based plans as your document library grows.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary/40 w-full py-10 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto px-6">
          <div className="col-span-1 md:col-span-1">
            <div className="font-bold text-lg text-foreground mb-2">
              CompanyDoc AI
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CompanyDoc AI. All rights reserved.
            </p>
          </div>
          <div className="col-span-1 md:col-span-3 flex flex-wrap gap-4 md:justify-end items-start">
            <a
              href="#product"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#security"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Security
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
