"use client";

import Link from "next/link";

type Props = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, lastUpdated, children }: Props) {
  return (
    <main className="relative min-h-dvh pb-24">
      <header className="sticky top-0 z-10 border-b border-paper/8 bg-ink px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <Link
            href="/me"
            className="rounded-lg p-1.5 text-paper/65 transition hover:bg-paper/8 hover:text-paper"
            aria-label="뒤로"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 className="text-[18px] font-bold text-paper">{title}</h1>
        </div>
        <div className="mt-1 pl-9 text-[11.5px] text-paper/50">
          최종 수정일 · {lastUpdated}
        </div>
      </header>

      <article className="px-5 pt-5 text-[13.5px] leading-[1.75] text-paper/85">
        {children}
      </article>
    </main>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-7 text-[15.5px] font-bold text-paper">{children}</h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 text-[14px] font-semibold text-paper">{children}</h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-2">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-paper/40">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: React.ReactNode }) {
  return (
    <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-paper/40">
      {children}
    </ol>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-paper/10">
      <table className="w-full text-[12.5px]">
        <thead className="bg-paper/6">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold text-paper/80"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-paper/8">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-paper/75">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
