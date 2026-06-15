interface LoadingDotsProps {
  label?: string;
}

export default function LoadingDots({
  label = 'Thinking...',
}: LoadingDotsProps) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground" aria-label={label}>
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-1.5 animate-geminipulse rounded-full bg-accent"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}
