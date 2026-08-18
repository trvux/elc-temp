"use client";

import { useEffect } from "react";

export function ChunkErrorListener(): null {
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent): void => {
      const error = event.error;
      if (error && typeof error.message === "string") {
        const isChunkLoadFailed =
          error.message.includes("Failed to fetch dynamically imported module") ||
          error.message.includes("Loading chunk") ||
          error.message.includes("ChunkLoadError");

        if (isChunkLoadFailed) {
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleGlobalError);
    return () => {
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  return null;
}
