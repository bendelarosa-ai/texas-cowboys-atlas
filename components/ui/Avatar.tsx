import { initials } from "@/lib/format";

const SIZES = {
  xs: "h-8 w-8 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-4xl",
} as const;

interface Props {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  muted?: boolean;
  className?: string;
}

/** Photo when one exists, otherwise consistent initials on a warm tint. */
export default function Avatar({ name, src, size = "sm", muted, className = "" }: Props) {
  const base = `${SIZES[size]} shrink-0 overflow-hidden rounded-full ${muted ? "grayscale" : ""} ${className}`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" loading="lazy" decoding="async" className={`${base} bg-stone-100 object-cover`} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${base} inline-flex select-none items-center justify-center bg-burnt/10 font-semibold tracking-wide text-burnt-dark ${muted ? "bg-stone-100 text-stone-500" : ""}`}
    >
      {initials(name)}
    </span>
  );
}
