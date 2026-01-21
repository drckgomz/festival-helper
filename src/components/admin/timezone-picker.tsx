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
  const supported = (Intl as any)?.supportedValuesOf?.("timeZone") as string[] | undefined;
  if (Array.isArray(supported) && supported.length) return supported;
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
    return orderWithChicagoFirst(all, defaultValue);
  }, [defaultValue]);

  const [value, setValue] = React.useState<string>(defaultValue);

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
            className={cn(
              "h-10 w-full justify-start rounded-md px-3 text-left text-sm font-normal shadow-sm",
              "border-border bg-background text-foreground",
              // ✅ readability-safe hover tokens
              "hover:bg-hover hover:text-hover-foreground",
              "focus-visible:ring-ring/40"
            )}
          >
            <Globe2 className="mr-2 h-4 w-4 opacity-70" />
            <span className={cn(!value && "text-muted-foreground")}>{value || label}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={cn("w-60 p-2", "border-border bg-popover text-popover-foreground shadow-sm")}
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput placeholder="Search timezone…" className="h-8 text-xs" />
            <CommandEmpty>No timezones found.</CommandEmpty>

            <CommandList className="max-h-56 overflow-auto">
              <CommandGroup>
                {zones.map((tz) => {
                  const selected = tz === value;
                  return (
                    <CommandItem
                      key={tz}
                      value={tz}
                      onSelect={() => {
                        setValue(tz);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between py-2",
                        // ✅ keep list hover/focus readable in dark mode
                        "aria-selected:bg-hover aria-selected:text-hover-foreground",
                        "data-[selected=true]:bg-hover data-[selected=true]:text-hover-foreground"
                      )}
                    >
                      <span className="text-xs">{tz}</span>
                      {selected ? <Check className="h-4 w-4 opacity-70" /> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>

          <p className="pt-2 text-[11px] text-muted-foreground">
            Chicago is pinned at the top.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
