import { Copy } from 'lucide-react';

interface MessageActionsProps {
  onCopy?: () => void;
}

export default function MessageActions({ onCopy }: MessageActionsProps) {
  return (
    <div className="flex items-center gap-0.5 mt-1">
      <button
        type="button"
        aria-label="Copy"
        title="Copy"
        onClick={onCopy}
        className="
          w-8 h-8 rounded-full flex items-center justify-center
          bg-transparent border-none text-muted-foreground
          hover:bg-muted hover:text-foreground
          cursor-pointer transition-all duration-150
        "
      >
        <Copy size={16} />
      </button>
    </div>
  );
}
