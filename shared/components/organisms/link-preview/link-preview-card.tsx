"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

async function fetchLinkPreview(href: string): Promise<LinkPreviewData> {
  const res = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`);
  if (!res.ok) throw new Error("preview fetch failed");
  return res.json();
}

export function LinkPreviewCard({ href }: { href: string }) {
  const { data, isLoading, isError } = useQuery({
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
      <div className="w-72 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
        <Skeleton className="h-32 w-full rounded-none" />
        <div className="flex flex-col gap-1.5 p-3">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  // No usable metadata (fetch failed, blocked host, non-HTML target) — a
  // bare-URL fallback still beats no card at all after the hover delay the
  // user just sat through.
  if (isError || !data || (!data.title && !data.description && !data.image)) {
    return (
      <div className="w-72 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
        <span className="text-muted-foreground">{hostname}</span>
      </div>
    );
  }

  return (
    <div className="w-72 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
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
  );
}
