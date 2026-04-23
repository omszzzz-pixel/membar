"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "홈",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2v-9z"
          stroke="currentColor"
          strokeWidth={a ? 2 : 1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill={a ? "currentColor" : "none"}
          fillOpacity={a ? 0.12 : 0}
        />
      </svg>
    ),
  },
  {
    href: "/schedule",
    label: "일정",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="3.5"
          y="5"
          width="17"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth={a ? 2 : 1.6}
          fill={a ? "currentColor" : "none"}
          fillOpacity={a ? 0.12 : 0}
        />
        <path
          d="M3.5 10h17M8 3v4M16 3v4"
          stroke="currentColor"
          strokeWidth={a ? 2 : 1.6}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "알림",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 10a6 6 0 1 1 12 0v4l2 3H4l2-3v-4z"
          stroke="currentColor"
          strokeWidth={a ? 2 : 1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill={a ? "currentColor" : "none"}
          fillOpacity={a ? 0.12 : 0}
        />
        <path
          d="M10 20a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth={a ? 2 : 1.6}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/me",
    label: "나",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth={a ? 2 : 1.6}
          fill={a ? "currentColor" : "none"}
          fillOpacity={a ? 0.12 : 0}
        />
        <path
          d="M4 21a8 8 0 0 1 16 0"
          stroke="currentColor"
          strokeWidth={a ? 2 : 1.6}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t border-paper/8 bg-ink"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-gold" : "text-paper/55 hover:text-paper/80"
              }`}
            >
              {t.icon(!!active)}
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
