import { FileText, X } from 'lucide-react';

interface FileAttachmentChipProps {
  name: string;
  onRemove?: () => void;
}

export default function FileAttachmentChip({
  name,
  onRemove,
}: FileAttachmentChipProps) {
  return (
    <div
      className="
        inline-flex items-center gap-2
        h-12 min-w-[12rem]
        bg-secondary border border-border rounded-[10px] px-3 py-2
        text-foreground text-sm
      "
    >
      <FileText size={20} className="shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove attachment"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            shrink-0 w-5 h-5 rounded-full flex items-center justify-center
            bg-transparent border-none text-muted-foreground
            hover:bg-accent hover:text-accent-foreground
            cursor-pointer transition-colors
          "
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
