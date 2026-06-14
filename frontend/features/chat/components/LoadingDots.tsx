interface LoadingDotsProps {
  label?: string;
}

export default function LoadingDots({
  label = 'Thinking...',
}: LoadingDotsProps) {
  return (
    <div
      className="flex items-center gap-2 py-1 text-[12px] text-muted-foreground font-['Inter']"
      aria-label={label}
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#00e5cc] inline-block animate-geminipulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}
