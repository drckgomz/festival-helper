// src/components/admin/time-picker.tsx
"use client";

import * as React from "react";
import { Check, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Props = {
  value: string; // "HH:mm" (24h)
  onChange: (value: string) => void;
  stepMinutes?: 5 | 10 | 15 | 30;
  label?: string;
  disabled?: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function format12h(hhmm: string) {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${suffix}`;
}

function buildTimes(step: number) {
  const out: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += step) {
      const v = `${pad2(h)}:${pad2(m)}`;
      out.push({ value: v, label: format12h(v) });
    }
  }
  return out;
}

const QUICK = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"] as const;

export function TimePicker({
  value,
  onChange,
  stepMinutes = 10,
  label = "Pick a time",
  disabled,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const times = React.useMemo(() => buildTimes(stepMinutes), [stepMinutes]);
  const selectedLabel = value ? format12h(value) : label;

  return (
    <div className="grid gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-start rounded-md border-zinc-200 bg-white px-3 text-left text-sm font-normal text-zinc-900 shadow-sm
                       hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            <Clock className="mr-2 h-4 w-4 opacity-70" />
            <span className={cn(!value && "text-zinc-500 dark:text-zinc-400")}>{selectedLabel}</span>
          </Button>
        </PopoverTrigger>

        {/* smaller + scrollable */}
        <PopoverContent className="w-[240px] p-2" align="start">
          {/* compact quick picks */}
          <div className="flex flex-wrap gap-1 pb-2">
            {QUICK.map((t) => (
              <Button
                key={t}
                type="button"
                variant="outline"
                className="h-7 rounded-full px-2 text-[11px]"
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
              >
                {format12h(t)}
              </Button>
            ))}
          </div>

          <Command>
            <CommandInput placeholder="Search…" className="h-8 text-xs" />
            <CommandEmpty>No times found.</CommandEmpty>

            {/* CommandList gives us a nice scroll container */}
            <CommandList className="max-h-56 overflow-auto">
              <CommandGroup>
                {times.map((t) => (
                  <CommandItem
                    key={t.value}
                    value={`${t.value} ${t.label}`}
                    onSelect={() => {
                      onChange(t.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-xs">{t.label}</span>
                    {t.value === value ? <Check className="h-4 w-4 opacity-70" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Stored as <span className="font-medium">{value || "—"}</span> (24h).
      </p>
    </div>
  );
}
