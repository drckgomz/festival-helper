// src/components/admin/timezone-picker.tsx
"use client";

import * as React from "react";
import { Check, Globe2 } from "lucide-react";

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
  name: string; // form field name, e.g. "timezone"
  defaultValue?: string; // "America/Chicago"
  disabled?: boolean;
  label?: string;
};

function getAllTimeZones(): string[] {
  // Modern browsers / Node runtimes may support this
  const supported = (Intl as any)?.supportedValuesOf?.("timeZone") as string[] | undefined;
  if (Array.isArray(supported) && supported.length) return supported;

  // Fallback: at least keep your default usable if unsupported
  return ["America/Chicago"];
}

function orderWithChicagoFirst(zones: string[], chicago = "America/Chicago") {
  const set = new Set(zones);
  const rest = zones.filter((z) => z !== chicago);
  return set.has(chicago) ? [chicago, ...rest] : [chicago, ...rest];
}

export function TimezonePicker({
  name,
  defaultValue = "America/Chicago",
  disabled,
  label = "Select timezone",
}: Props) {
  const [open, setOpen] = React.useState(false);

  const zones = React.useMemo(() => {
    const all = getAllTimeZones();
    return orderWithChicagoFirst(all);
  }, []);

  const [value, setValue] = React.useState<string>(defaultValue);

  // in case defaultValue changes (rare, but safe)
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={value} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-start rounded-md border-zinc-200 bg-white px-3 text-left text-sm font-normal text-zinc-900 shadow-sm
                       hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            <Globe2 className="mr-2 h-4 w-4 opacity-70" />
            <span className={cn(!value && "text-zinc-500 dark:text-zinc-400")}>
              {value || label}
            </span>
          </Button>
        </PopoverTrigger>

        {/* small popout */}
        <PopoverContent className="w-[260px] p-2" align="start">
          <Command>
            <CommandInput placeholder="Search timezone…" className="h-8 text-xs" />
            <CommandEmpty>No timezones found.</CommandEmpty>

            {/* scrollable list */}
            <CommandList className="max-h-56 overflow-auto">
              <CommandGroup>
                {zones.map((tz) => (
                  <CommandItem
                    key={tz}
                    value={tz}
                    onSelect={() => {
                      setValue(tz);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-xs">{tz}</span>
                    {tz === value ? <Check className="h-4 w-4 opacity-70" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          <p className="pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            Chicago is pinned at the top.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
