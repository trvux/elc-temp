"use client";

import { useEffect } from "react";

interface ScrollToActiveBranchProps {
  slug?: string;
}

export function ScrollToActiveBranch({ slug }: ScrollToActiveBranchProps) {
  useEffect(() => {
    if (slug) {
      const element = document.getElementById(slug);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("bg-primary/5");
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [slug]);

  return null;
}
