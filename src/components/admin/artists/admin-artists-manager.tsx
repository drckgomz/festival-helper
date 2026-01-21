// src/components/admin/artists/admin-artists-manager.tsx
"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ArtistRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  spotifyUrl: string | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function AdminArtistsManager(props: { initialArtists: ArtistRow[] }) {
  const [artists, setArtists] = React.useState<ArtistRow[]>(props.initialArtists);
  const [q, setQ] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const query = norm(q);
    if (!query) return artists;
    return artists.filter((a) => norm(a.name).includes(query));
  }, [artists, q]);

  const exactMatch = React.useMemo(() => {
    const query = norm(q);
    if (!query) return null;
    return artists.find((a) => norm(a.name) === query) ?? null;
  }, [artists, q]);

  const selected = React.useMemo(
    () => artists.find((a) => a.id === selectedId) ?? null,
    [artists, selectedId]
  );

  async function createFromQuery() {
    const name = q.trim();
    if (!name) return;

    setErr(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/artists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to create artist");
      }

      const j = await res.json();
      const created: ArtistRow = j.artist;

      // If it already existed, API can return the existing row too.
      setArtists((prev) => {
        const exists = prev.some((p) => p.id === created.id);
        const next = exists
          ? prev.map((p) => (p.id === created.id ? created : p))
          : [created, ...prev];
        return next.slice().sort((a, b) => a.name.localeCompare(b.name));
      });

      setSelectedId(created.id);
      setQ(created.name);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  function onPick(id: string) {
    setSelectedId(id);
    const a = artists.find((x) => x.id === id);
    if (a) setQ(a.name);
  }

  function onUpdated(next: ArtistRow) {
    setArtists((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Left: Search + list */}
      <Card className="border-border bg-card text-card-foreground lg:col-span-5">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">Search</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick an artist to edit. If none match, create a new entry.
          </p>

          <div className="mt-4 grid gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type an artist name…"
              className="h-10"
            />

            {q.trim() && !exactMatch ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-3 text-foreground">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">No exact match</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Create: <span className="font-medium text-foreground">{q.trim()}</span>
                  </p>
                </div>
                <Button onClick={createFromQuery} disabled={creating} className="h-9 rounded-full px-4">
                  {creating ? "Creating…" : "Create"}
                </Button>
              </div>
            ) : null}

            {err ? <p className="text-xs text-destructive">{err}</p> : null}
          </div>

          <Separator className="my-4" />

          <div className="grid gap-2">
            {filtered.slice(0, 50).map((a) => {
              const active = selectedId === a.id;

              return (
                <button
                  key={a.id}
                  onClick={() => onPick(a.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md border p-3 text-left",
                    "border-border bg-background text-foreground",
                    // ✅ hover tokens keep contrast correct in dark mode
                    "festival-hover-pressable",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    active && "ring-2 ring-ring/40"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {a.imageUrl ? "has image" : "no image"} •{" "}
                      {a.spotifyUrl ? "spotify" : "no spotify"} •{" "}
                      {a.websiteUrl ? "website" : "no website"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Edit</span>
                </button>
              );
            })}

            {filtered.length > 50 ? (
              <p className="text-xs text-muted-foreground">
                Showing first 50 results. Refine your search.
              </p>
            ) : null}

            {artists.length === 0 ? (
              <p className="text-xs text-muted-foreground">No artists yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Right: Editor */}
      <div className="lg:col-span-7">
        {selected ? (
          <ArtistEditor artist={selected} onUpdated={onUpdated} />
        ) : (
          <Card className="border-border bg-card text-card-foreground">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Select an artist</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose from the list on the left to edit details and upload an image.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ===========================
   Editor
   =========================== */

function ArtistEditor(props: { artist: ArtistRow; onUpdated: (a: ArtistRow) => void }) {
  const [name, setName] = React.useState(props.artist.name);
  const [spotifyUrl, setSpotifyUrl] = React.useState(props.artist.spotifyUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = React.useState(props.artist.websiteUrl ?? "");
  const [imageUrl, setImageUrl] = React.useState(props.artist.imageUrl ?? "");

  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(props.artist.name);
    setSpotifyUrl(props.artist.spotifyUrl ?? "");
    setWebsiteUrl(props.artist.websiteUrl ?? "");
    setImageUrl(props.artist.imageUrl ?? "");
    setMsg(null);
    setErr(null);
  }, [props.artist.id]);

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch(`/api/admin/artists/${props.artist.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          spotifyUrl: spotifyUrl.trim() || null,
          websiteUrl: websiteUrl.trim() || null,
          imageUrl: imageUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }

      const j = await res.json();
      const updated: ArtistRow = j.artist;

      props.onUpdated(updated);
      setMsg("Saved.");
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Edit artist</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ID: <span className="font-mono text-foreground">{props.artist.id}</span>
            </p>
          </div>

          <Button onClick={save} disabled={saving} className="h-9 rounded-full px-4">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="mt-5 grid gap-4">
          {/* Name */}
          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
          </div>

          {/* Image (URL for now) */}
          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">Image</label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="h-16 w-16 overflow-hidden rounded-md border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    none
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL (wire upload later)"
                  className="h-10"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Next step: replace this with an actual upload that returns a URL.
                </p>
              </div>
            </div>
          </div>

          {/* Spotify */}
          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">Spotify URL</label>
            <Input
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/…"
              className="h-10"
            />
          </div>

          {/* Website */}
          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">Website URL</label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://artist.com"
              className="h-10"
            />
          </div>

          {msg ? <p className="text-xs text-emerald-600">{msg}</p> : null}
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
