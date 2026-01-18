// src/app/(admin)/festivals/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { festivals } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimeField } from "@/components/admin/date-time-field";
import { TimezonePicker } from "@/components/admin/timezone-picker";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function normSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDateOrNull(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function createFestival(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;

  const timezone = String(formData.get("timezone") ?? "America/Chicago").trim() || "America/Chicago";

  // Now these come from the shadcn picker hidden input as "YYYY-MM-DDTHH:mm"
  const startDate = parseDateOrNull(formData.get("startDate"));
  const endDate = parseDateOrNull(formData.get("endDate"));

  const isPublished = formData.get("isPublished") === "on";

  if (!name) throw new Error("name is required");

  const slug = normSlug(slugInput || name);
  if (!slug) throw new Error("slug is required");

  if (startDate && endDate && endDate < startDate) {
    throw new Error("endDate must be after startDate");
  }

  const inserted = await db
    .insert(festivals)
    .values({
      name,
      slug,
      city,
      timezone,
      startDate,
      endDate,
      isPublished,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: festivals.id });

  const id = inserted[0]?.id;
  if (!id) throw new Error("Failed to create festival");

  redirect(`/admin/festivals/${id}`);
}

function FieldLabel(props: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{props.children}</label>;
}
function HelpText(props: { children: React.ReactNode }) {
  return <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{props.children}</p>;
}

export default function NewFestivalPage() {
  return (
    <div className="grid gap-4">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Create festival</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                Create the festival first, then add days, stages, and import sets.
              </p>
            </div>

            <Button asChild variant="outline" className="h-9 rounded-full px-4">
              <Link href="/admin/festivals">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <form action={createFestival} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Name *</FieldLabel>
                <Input name="name" placeholder="Austin City Limits 2026" required className="h-10" />
                <HelpText>Display name for admin + public pages.</HelpText>
              </div>

              <div className="grid gap-2">
                <FieldLabel>Slug</FieldLabel>
                <Input name="slug" placeholder="acl-2026 (leave blank to auto-generate)" className="h-10" />
                <HelpText>Unique. If blank, it’s generated from the name.</HelpText>
              </div>

              <div className="grid gap-2">
                <FieldLabel>City</FieldLabel>
                <Input name="city" placeholder="Austin, TX" className="h-10" />
                <HelpText>Optional, but helps for display/search.</HelpText>
              </div>

              <div className="grid gap-2">
                <FieldLabel>Timezone</FieldLabel>

                <TimezonePicker name="timezone" defaultValue="America/Chicago" />

                <HelpText>Used for schedule grouping + date display.</HelpText>
              </div>

            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <DateTimeField
                name="startDate"
                label="Start date & time"
                description="Select a date, then a time. Stored as timestamp with timezone."
              />
              <DateTimeField
                name="endDate"
                label="End date & time"
                description="Optional. Must be after start date if provided."
              />
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  name="isPublished"
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                />
                Publish immediately
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" className="h-9 rounded-full px-4">
                  <Link href="/admin/festivals">Cancel</Link>
                </Button>
                <Button className="h-9 rounded-full px-4">Create</Button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Next steps: add Days → add Stages → import Sets.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
