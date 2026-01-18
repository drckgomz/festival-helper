// src/components/admin/date-time-field.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/admin/time-picker";


type Props = {
  name: string; // "startDate" | "endDate"
  label: string;
  description?: string;
  initialValue?: string; // optional ISO-like or datetime-local string
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Produces a "datetime-local" string like "2026-10-02T19:30"
 * (no timezone suffix) which your server action already parses via new Date(...)
 */
function toLocalInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function DateTimeField({ name, label, description, initialValue }: Props) {
  const initial = React.useMemo(() => {
    if (!initialValue) return null;
    const d = new Date(initialValue);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [initialValue]);

  const [date, setDate] = React.useState<Date | null>(initial);
  const [time, setTime] = React.useState<string>(() => {
    if (!initial) return "19:00";
    return `${pad2(initial.getHours())}:${pad2(initial.getMinutes())}`;
  });

  // derived hidden input value
  const hiddenValue = React.useMemo(() => {
    if (!date) return "";
    const [hh, mi] = time.split(":");
    const d = new Date(date);
    d.setHours(Number(hh || 0), Number(mi || 0), 0, 0);
    return toLocalInputValue(d);
  }, [date, time]);

  return (
    <div className="grid gap-2">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{label}</label>

      <input type="hidden" name={name} value={hiddenValue} />

      <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-start rounded-md border-zinc-200 bg-white px-3 text-left text-sm font-normal text-zinc-900 shadow-sm
                         hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
              {date ? format(date, "PPP") : <span className="text-zinc-500">Pick a date</span>}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-2" align="start">
            <Calendar
              mode="single"
              selected={date ?? undefined}
              onSelect={(d) => setDate(d ?? null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <TimePicker value={time} onChange={setTime} stepMinutes={10} />
      </div>

      {description ? <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{description}</p> : null}
    </div>
  );
}
