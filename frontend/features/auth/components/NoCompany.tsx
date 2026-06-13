'use client';

import {
  Building2,
  Plus,
  Mail,
  ArrowRight,
  Shield,
  FolderCog,
  Database,
} from 'lucide-react';

interface NoCompanyProps {
  onCreateCompany?: () => void;
  onContactAdmin?: () => void;
}

export default function NoCompany({
  onCreateCompany,
  onContactAdmin,
}: NoCompanyProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#131313] text-[#e5e2e1] antialiased">
      <header className="bg-[#131313] border-b border-[#444748] flex justify-between items-center w-full px-12 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-white" />
          <span className="text-[32px] leading-[40px] font-semibold tracking-tight text-white">
            CompanyDoc AI
          </span>
        </div>
        <button className="text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium text-white border border-[#444748] px-4 py-2 rounded hover:bg-[#201f1f] transition-colors">
          Support
        </button>
      </header>

      <main className="flex-grow flex w-full">
        <div className="flex flex-col md:flex-row w-full max-w-[1920px] mx-auto">
          <section className="w-full md:w-1/2 p-4 md:p-12 flex items-center justify-center bg-[#131313] border-r border-[#444748]">
            <div className="max-w-md w-full flex flex-col gap-10">
              <div className="flex flex-col gap-4">
                <div className="bg-[#2a2a2a] w-16 h-16 rounded flex items-center justify-center border border-[#444748] mb-2">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-[48px] leading-[56px] tracking-[-0.02em] font-bold text-white">
                  You're not connected to a company yet
                </h1>
                <p className="text-[16px] leading-[24px] text-[#c4c7c8]">
                  Ask your company admin to invite you, or create a new company
                  AI workspace if you are setting this up for your team.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={onCreateCompany}
                  className="w-full bg-white text-[#2f3131] text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium py-4 px-6 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create Company AI
                </button>
                <button
                  onClick={onContactAdmin}
                  className="w-full bg-transparent border border-[#444748] text-white text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium py-4 px-6 rounded hover:bg-[#201f1f] transition-colors flex items-center justify-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  Contact company admin
                </button>
              </div>

              <div className="pt-6 border-t border-[#444748]">
                <a
                  href="#"
                  className="text-[14px] leading-[20px] text-[#c4c7c8] hover:text-white transition-colors flex items-center gap-1 w-fit"
                >
                  Learn more about workspaces
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>

          <section className="hidden md:flex w-1/2 bg-[#131313] p-12 items-center justify-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />

            <div className="relative z-10 w-full max-w-2xl">
              <div className="relative w-full aspect-video rounded border border-[#444748] bg-[#201f1f] flex items-center justify-center p-10">
                <svg
                  className="absolute inset-0 w-full h-full text-[#444748] opacity-20"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <path
                    d="M 30,50 C 50,50 50,20 70,20"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="1 1"
                    strokeWidth="0.5"
                  />
                  <path
                    d="M 30,50 C 50,50 50,80 70,80"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="1 1"
                    strokeWidth="0.5"
                  />
                </svg>

                <div className="absolute left-[20%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-full bg-[#131313] border border-[#444748] flex items-center justify-center relative shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <Shield className="w-10 h-10 text-white" />
                    <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-[#131313] border border-[#444748] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  <p className="text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium text-white">
                    Enterprise Security
                  </p>
                </div>

                <div className="absolute right-[20%] top-[30%] -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded bg-[#131313] border border-[#444748] flex items-center justify-center">
                    <FolderCog className="w-6 h-6 text-[#c4c7c8]" />
                  </div>
                </div>

                <div className="absolute right-[20%] top-[70%] -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded bg-[#131313] border border-[#444748] flex items-center justify-center">
                    <Database className="w-6 h-6 text-[#c4c7c8]" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 w-64 p-4 bg-[#131313] border border-[#444748] rounded flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-white text-sm">✓</span>
                  <span className="text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium text-white">
                    Private Knowledge Base
                  </span>
                </div>
                <div className="h-1 w-full bg-[#2a2a2a] rounded overflow-hidden">
                  <div className="h-full bg-white w-2/3" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-[#131313] border-t border-[#444748] w-full flex flex-col md:flex-row justify-between items-center px-12 py-6 gap-4 mt-auto">
        <div className="text-[12px] leading-[16px] tracking-[0.05em] font-mono font-medium text-[#c4c7c8]">
          © 2026 CompanyDoc AI. Enterprise-Grade Intelligence.
        </div>
        <nav className="flex flex-wrap gap-4 text-[14px] leading-[20px]">
          {[
            'Privacy Policy',
            'Terms of Service',
            'Security',
            'Help Center',
          ].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[#c4c7c8] hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {link}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
