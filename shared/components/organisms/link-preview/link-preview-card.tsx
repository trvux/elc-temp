"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";

interface LinkPreviewData {
  url?: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  // Set for routine "couldn't preview this" outcomes (unreachable, blocked
  // host, not HTML, requires auth, ...) — the API route always answers 200
  // for these, since they're normal results of previewing an arbitrary
  // URL, not application errors. `data` still renders (the bare-hostname
  // fallback below), so callers don't need an isError branch for them.
  error?: string;
}

async function fetchLinkPreview(href: string): Promise<LinkPreviewData> {
  const res = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`);
  return res.json();
}

// Outer wrapper card holds the "Truy cập" action outside/below the inner
// content card, so the click target for actually following the link stays
// visually distinct from the (non-interactive) metadata preview above it.
function CardShell({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="w-72 rounded-xl bg-muted p-2 text-popover-foreground shadow-md">
      {children}
      <Button asChild variant="default" size="sm" className="mt-2 w-full">
        <a href={href} target="_blank" rel="noopener noreferrer">
          Truy cập
          <ArrowSquareOut size={14} />
        </a>
      </Button>
    </div>
  );
}

export function LinkPreviewCard({ href }: { href: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["link-preview", href],
    queryFn: () => fetchLinkPreview(href),
    staleTime: 60 * 60 * 1000, // matches the API route's own 1h cache
    retry: false,
  });

  let hostname = href;
  try {
    hostname = new URL(href).hostname;
  } catch {
    // keep raw href as fallback label
  }

  if (isLoading) {
    return (
      <CardShell href={href}>
        <div className="overflow-hidden rounded-lg bg-background shadow-sm">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="flex flex-col gap-1.5 p-3">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </CardShell>
    );
  }

  // No usable metadata (fetch failed, blocked host, non-HTML target) — a
  // bare-URL fallback still beats no card at all after the hover delay the
  // user just sat through.
  if (!data || data.error || (!data.title && !data.description && !data.image)) {
    return (
      <CardShell href={href}>
        <div className="rounded-lg bg-muted/50 p-3 text-sm ring-1 ring-foreground/5">
          <span className="text-muted-foreground">{hostname}</span>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell href={href}>
      <div className="overflow-hidden rounded-lg bg-background shadow-sm">
        {data.image && (
          // Arbitrary external domain — not worth registering every one in
          // next.config's image allowlist just for a hover preview thumbnail.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image} alt="" className="h-32 w-full object-cover" />
        )}
        <div className="flex flex-col gap-1 p-3">
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {data.siteName || hostname}
          </span>
          {data.title && <span className="line-clamp-2 text-sm font-medium">{data.title}</span>}
          {data.description && (
            <span className="line-clamp-2 text-xs text-muted-foreground">{data.description}</span>
          )}
        </div>
      </div>
    </CardShell>
  );
}
