interface UserAvatarProps {
  letter?: string;
  className?: string;
}

export default function UserAvatar({
  letter = 'L',
  className = '',
}: UserAvatarProps) {
  return (
    <button
      aria-label="User profile"
      className={`
        w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center
        text-sm font-semibold text-white cursor-pointer shrink-0
        hover:bg-violet-500 transition-colors duration-150
        ${className}
      `}
    >
      {letter}
    </button>
  );
}
