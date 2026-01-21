// src/components/admin/festival/sets/conflict.ts

export type SetRow = {
  id: string;
  festivalId: string;

  stageId: string | null;
  stageName: string | null;

  artistId: string;
  artistName: string;
  artistImageUrl: string | null;

  startsAt: string; // ISO
  endsAt: string; // ISO
  dayLabel: string | null;

  createdAt: string;
  updatedAt: string;
};

export type SetConflict = {
  stageId: string;
  stageName: string;
  dayKey: string;
  a: SetRow;
  b: SetRow;
};

function isValidDate(d: Date) {
  return Number.isFinite(d.getTime());
}

export function getDayKey(set: SetRow) {
  // Prefer explicit day label (admin-defined), otherwise derive from startsAt ISO date.
  if (set.dayLabel?.trim()) return set.dayLabel.trim();
  const d = new Date(set.startsAt);
  if (!isValidDate(d)) return "unknown-day";
  return d.toISOString().slice(0, 10);
}

export function overlaps(a: SetRow, b: SetRow) {
  const aStart = new Date(a.startsAt).getTime();
  const aEnd = new Date(a.endsAt).getTime();
  const bStart = new Date(b.startsAt).getTime();
  const bEnd = new Date(b.endsAt).getTime();

  // invalid intervals are handled elsewhere; treat as non-overlap here
  if (!Number.isFinite(aStart) || !Number.isFinite(aEnd) || !Number.isFinite(bStart) || !Number.isFinite(bEnd)) {
    return false;
  }
  if (aEnd <= aStart || bEnd <= bStart) return false;

  // overlap condition
  return aStart < bEnd && bStart < aEnd;
}

export function findStageConflicts(sets: SetRow[]) {
  const conflicts: SetConflict[] = [];

  // group by (dayKey, stageId)
  const map = new Map<string, SetRow[]>();

  for (const s of sets) {
    if (!s.stageId) continue; // unassigned stage -> skip stage overlap rule
    const dayKey = getDayKey(s);
    const k = `${dayKey}::${s.stageId}`;
    const list = map.get(k) ?? [];
    list.push(s);
    map.set(k, list);
  }

  for (const [k, list] of map.entries()) {
    const [dayKey, stageId] = k.split("::");
    const stageName = list.find((x) => x.stageName)?.stageName || "Stage";

    // sort by startsAt for linear scan
    const sorted = [...list].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];

        // early exit: if next starts after current ends (sorted by start)
        const aEnd = new Date(a.endsAt).getTime();
        const bStart = new Date(b.startsAt).getTime();
        if (Number.isFinite(aEnd) && Number.isFinite(bStart) && bStart >= aEnd) break;

        if (overlaps(a, b)) {
          conflicts.push({
            stageId,
            stageName,
            dayKey,
            a,
            b,
          });
        }
      }
    }
  }

  return conflicts;
}

export function isInvalidInterval(s: SetRow) {
  const start = new Date(s.startsAt).getTime();
  const end = new Date(s.endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return true;
  return end <= start;
}
