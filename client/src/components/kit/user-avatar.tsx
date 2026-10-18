import { cn, getAvatarColor } from "@/lib/utils";

interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  xs: "h-6 w-6 text-[10px] rounded-md",
  sm: "h-8 w-8 text-xs rounded-lg",
  md: "h-9 w-9 text-[13px] rounded-lg",
  lg: "h-11 w-11 text-sm rounded-xl",
  xl: "h-16 w-16 text-xl rounded-2xl",
};

export function UserAvatar({ firstName, lastName, size = "md", className }: UserAvatarProps) {
  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10",
        SIZES[size],
        getAvatarColor(initials),
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
