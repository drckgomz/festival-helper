// src/lib/time.ts
export function formatTimeRange(startsAt: Date, endsAt: Date) {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${fmt.format(startsAt)} – ${fmt.format(endsAt)}`;
}

export function formatDayTitle(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
