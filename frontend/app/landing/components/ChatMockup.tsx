import GeminiLogo from '@/features/chat/components/GeminiLogo';

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
      className="relative mx-auto max-w-3xl rounded-xl border border-border shadow-2xl bg-background overflow-hidden scroll-mt-24"
    >
      <div className="flex items-center px-4 py-3 bg-secondary border-b border-border">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <div className="w-3 h-3 rounded-full bg-muted" />
          <div className="w-3 h-3 rounded-full bg-muted" />
        </div>
        <div className="flex-grow flex justify-center">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <GeminiLogo size={14} aria-label="Gemini" />
            CompanyDoc AI &mdash; Chat
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 text-left">
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl bg-secondary px-4 py-2 text-sm text-foreground">
            What is our vacation policy?
          </div>
        </div>

        <div className="max-w-[92%] rounded-2xl bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground">
          Full-time employees get 15 days of paid vacation per year after six
          months of service. Requests need approval at least two weeks ahead.
          <span className="ml-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
            [1]
          </span>
        </div>

        <div className="mt-1 flex flex-col gap-2">
          {sourceChunks.map((chunk, index) => (
            <div
              key={index}
              className={`rounded-lg border px-3 py-2 text-xs leading-relaxed transition-colors ${
                chunk.active
                  ? 'border-accent/60 bg-accent/10 text-foreground'
                  : 'border-border bg-secondary/40 text-muted-foreground'
              }`}
            >
              <span className="mr-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {chunk.label} {index + 1} &middot; Employee Handbook, p. 12
              </span>
              <p className="mt-1">{chunk.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
