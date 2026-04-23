import type { Person } from "./types";

export function formatShareText(p: Person): string {
  const lines: string[] = [];

  const head: string[] = [p.name];
  if (p.title) head.push(p.title);
  const header = head.join(" · ");
  lines.push(p.company ? `${header} @ ${p.company}` : header);

  const meta: string[] = [];
  if (p.education) meta.push(p.education);
  if (p.birth_year) meta.push(`${p.birth_year}년생`);
  if (p.location) meta.push(p.location);
  if (meta.length) lines.push(meta.join(" / "));

  lines.push("");

  if (p.relationship) lines.push(`관계: ${p.relationship}`);
  if (p.interests?.length)
    lines.push(`관심사: ${p.interests.join(", ")}`);
  if (p.business?.length)
    lines.push(`비즈니스: ${p.business.join(", ")}`);
  if (p.tags?.length)
    lines.push(`태그: ${p.tags.map((t) => `#${t}`).join(" ")}`);

  const fam: string[] = [];
  if (p.family?.spouse) fam.push("배우자 있음");
  if (p.family?.children) fam.push(`자녀 ${p.family.children}명`);
  if (p.family?.father) fam.push(`아버지 ${p.family.father}`);
  if (p.family?.mother) fam.push(`어머니 ${p.family.mother}`);
  if (p.family?.siblings) fam.push(`형제 ${p.family.siblings}`);
  if (fam.length) lines.push(`가족: ${fam.join(", ")}`);

  if (p.meetings && p.meetings.length > 0) {
    const recent = [...p.meetings]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map((m) => {
        const parts = [m.date];
        if (m.place) parts.push(m.place);
        return parts.join(" ");
      });
    lines.push(`최근 만남: ${recent.join(" / ")}`);
  }

  if (p.notes) {
    lines.push("");
    lines.push(p.notes);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
