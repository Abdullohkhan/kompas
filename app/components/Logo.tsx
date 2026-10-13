import { useId } from "react";

/** Kompas mark: a compass needle pointing up-right (growth) on a sky→indigo tile. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="1.6" />
      <path d="M22 10 17.8 17.8 14.2 14.2Z" fill="#fff" />
      <path d="M10 22 14.2 14.2 17.8 17.8Z" fill="#fff" fillOpacity=".5" />
      <circle cx="16" cy="16" r="1.3" fill="#4f46e5" />
    </svg>
  );
}
