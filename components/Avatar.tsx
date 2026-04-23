"use client";

function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "·";
  return trimmed[0].toUpperCase();
}

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-9 w-9 text-[14px]",
  md: "h-11 w-11 text-[16px]",
  lg: "h-14 w-14 text-[20px]",
};

export default function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: Size;
}) {
  return (
    <div
      className={`${SIZES[size]} flex shrink-0 select-none items-center justify-center rounded-full bg-paper/8 font-semibold text-paper/70`}
      aria-hidden
    >
      {initialOf(name)}
    </div>
  );
}
