// src/components/admin/festival/sets/types.ts

export type DayRow = {
  id: string;
  dayDate: string; // YYYY-MM-DD-ish
  label: string | null;
  sortOrder: number;
  groupKey: string | null;
  groupLabel: string | null;
};

export type StageRow = { id: string; name: string; sortOrder: number };
export type ArtistRow = { id: string; name: string; imageUrl: string | null };

export type ViewMode = "table" | "conflicts" | "timeline";

export type DayOption = { key: string; label: string };

export function norm(s: string) {
  return s.trim().toLowerCase();
}

export function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(v: string) {
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

/**
 * IMPORTANT: Avoid Date#toLocaleString / toLocaleTimeString in SSR Client Components.
 * Always format with explicit locale + timeZone to keep server/client HTML identical.
 */
export function fmtAdminDateTime(iso: string, timeZone: string = "UTC") {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function fmtAdminTime(iso: string, timeZone: string = "UTC") {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Invalid time";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
