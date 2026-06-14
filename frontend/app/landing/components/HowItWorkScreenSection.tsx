export default function HowItWorksSection() {
  return (
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
              Add PDFs, policies, and manuals. They&apos;re chunked, embedded,
              and indexed automatically.
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
              Employees chat with the assistant and get answers with citations
              back to the source PDF.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
