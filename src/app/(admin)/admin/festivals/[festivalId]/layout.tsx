// src/app/(admin)/admin/festivals/[festivalId]/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LayoutCtx<T extends Record<string, string>> = {
  params: Promise<T>;
};

function stripTrailingSlash(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function FestivalPillLink(props: {
  href: string;
  label: string;
  active?: boolean;
}) {
  const { href, label, active } = props;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export default async function AdminFestivalLayout({
  children,
  params,
}: { children: ReactNode } & LayoutCtx<{ festivalId: string }>) {
  const { festivalId } = await params;
  const base = `/admin/festivals/${festivalId}`;

  // Server layouts can't read usePathname(), so we default to non-active pills.
  // If you want active pills, move the pill row into a small client component.
  // (I can give you that version too.)
  const baseNoSlash = stripTrailingSlash(base);

  return (
    <div className="grid gap-4">
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Festival admin</p>
              <p className="mt-1 text-xs text-muted-foreground">
                festivalId: <span className="font-mono">{festivalId}</span>
              </p>
            </div>

            <Link
              href="/admin/festivals"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              All festivals →
            </Link>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            <FestivalPillLink href={baseNoSlash} label="Overview" />
            <FestivalPillLink href={`${baseNoSlash}/days`} label="Days" />
            <FestivalPillLink href={`${baseNoSlash}/stages`} label="Stages" />
            <FestivalPillLink href={`${baseNoSlash}/locations`} label="Locations" />
            <FestivalPillLink href={`${baseNoSlash}/sets`} label="Sets" />
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
