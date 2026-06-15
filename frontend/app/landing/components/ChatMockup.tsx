import { ProductLogo, StatusPill } from '@/shared/ui/product';

const sourceChunks = [
  {
    label: 'Source',
    text: 'Vacation accrual begins on an employee\u2019s start date. Unused vacation may roll over up to a limit defined by local policy.',
    active: false,
  },
  {
    label: 'Source',
    text: 'Full-time employees are eligible for 15 days of paid vacation annually after six months of continuous service. Vacation time must be requested and approved at least two weeks in advance.',
    active: true,
  },
  {
    label: 'Source',
    text: 'For part-time staff, vacation accrual is prorated based on scheduled hours per week.',
    active: false,
  },
];

export default function ChatMockup() {
  return (
    <div
      id="product"
      className="relative mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)] scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-[var(--surface-2)] px-4 py-3">
        <ProductLogo />
        <StatusPill tone="success">3 sources ready</StatusPill>
      </div>

      <div className="grid min-h-[420px] lg:grid-cols-[260px_1fr_300px]">
        <aside className="hidden border-r border-border bg-sidebar p-3 lg:block">
          <button className="mb-3 flex h-9 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
            New conversation
          </button>
          <div className="grid gap-2">
            {['Vacation policy', 'Onboarding steps', 'Expense rules'].map((item, index) => (
              <div
                key={item}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  index === 0
                    ? 'border-[color-mix(in_srgb,var(--accent)_42%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]'
                    : 'border-transparent bg-transparent text-muted-foreground'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex flex-col gap-5 p-5 text-left">
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
              What is our vacation policy?
            </div>
          </div>

          <div className="max-w-[92%] text-sm leading-7 text-foreground">
            Full-time employees get 15 days of paid vacation per year after six
            months of service. Requests need approval at least two weeks ahead.
            <span className="ml-1 rounded-md border border-[color-mix(in_srgb,var(--accent)_42%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-1.5 py-0.5 text-xs font-medium text-accent">
              [Source 1]
            </span>
          </div>

          <div className="mt-auto rounded-lg border border-border bg-background p-2">
            <div className="px-2 py-2 text-sm text-muted-foreground">
              Ask from this AI&apos;s documents...
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-border bg-[var(--surface-2)] p-4 lg:block">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Sources
          </p>
          <div className="mt-3 grid gap-2">
            {sourceChunks.map((chunk, index) => (
              <div
                key={index}
                className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                  chunk.active
                    ? 'border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-foreground'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <span className="font-medium text-muted-foreground">
                  {chunk.label} {index + 1} · Employee Handbook, p. 12
                </span>
                <p className="mt-1">{chunk.text}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
