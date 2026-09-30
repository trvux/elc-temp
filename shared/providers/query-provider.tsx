"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// Loader, not a static import — this is what actually makes LazyMotion lazy.
// A static `import { domAnimation } from "motion/react"` here would bundle
// the whole animation feature set into whatever chunk this provider (root
// layout wraps every page in it) lands in, defeating the point of
// LazyMotion entirely. Confirmed via PSI mobile audit 2026-10-01: this was
// a prime suspect for the ~794ms single-chunk main-thread scripting cost
// found on the homepage.
const loadFeatures = () =>
  import("./motion-features").then((mod) => mod.default);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    // Catch-all for mutations that throw instead of returning a graceful
    // { error } result (expired session mid-edit, stale Server Action
    // reference after a redeploy, network failure, etc). Without this, a
    // mutation with no per-call onError silently fails — button stops
    // loading, no toast, no console error — indistinguishable from the app
    // just not responding. Per-hook onSuccess({error}) handling elsewhere is
    // unaffected: that's the separate, already-working path for actions that
    // return { data: null, error: "..." } normally.
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra, vui lòng thử lại");
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </QueryClientProvider>
  );
}
