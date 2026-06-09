import MessageActions from '@/app/_components/actions/MessageActions';
import FileAttachmentChip from '@/app/_components/chat/FileAttachmentChip';
import { memo } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: { name: string };
}

interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
}

function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] flex flex-col items-end gap-2">
          {message.attachment && (
            <FileAttachmentChip name={message.attachment.name} />
          )}
          {message.content && (
            <div
              className="
                bg-secondary rounded-none border border-border
                px-[18px] py-2 text-[15px] leading-6
                text-secondary-foreground whitespace-pre-wrap break-words font-['JetBrains_Mono']
              "
            >
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="m-0 text-[15px] leading-[26px] text-foreground whitespace-pre-wrap break-words font-['JetBrains_Mono']">
        {message.content}
      </p>
      <MessageActions onCopy={() => onCopy?.(message.content)} />
    </div>
  );
}

export default memo(
  MessageBubble,
  (prev, next) => prev.message === next.message && prev.onCopy === next.onCopy,
);
