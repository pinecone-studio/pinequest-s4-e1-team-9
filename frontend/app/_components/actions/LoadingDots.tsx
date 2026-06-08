export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Thinking…">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#00e5cc] inline-block animate-geminipulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
