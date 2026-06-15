export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 pb-16 sm:px-6 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-2xl font-semibold text-foreground md:text-3xl">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              1. Create an AI
            </p>
            <p className="text-sm text-muted-foreground">
              Pick a use case, define the audience, and set source-backed
              answer behavior.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              2. Add knowledge
            </p>
            <p className="text-sm text-muted-foreground">
              Upload PDFs and monitor each document as it prepares for chat.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              3. Ask questions
            </p>
            <p className="text-sm text-muted-foreground">
              Members chat with the assistant and open citations back to the
              secured source PDF.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
