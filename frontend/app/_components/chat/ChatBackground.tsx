import { memo } from 'react';

function ChatBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}

export default memo(ChatBackground);
