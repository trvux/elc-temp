"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Matches the id app/(public)/page.tsx puts on the wrapper around
// HeroSection + HeroChatFinderSection — the combined region anything
// "floating over the dark hero" (the header capsule, the sticky contact
// pill) should stay in that look for. Measuring the real element instead
// of guessing a fixed scroll distance means this keeps working correctly
// if either section's height ever changes, instead of silently drifting
// out of sync with a hardcoded pixel constant (the previous version's
// HERO_SCROLL_CLEARANCE_PX=550 only ever covered part of one hero-height
// section, well short of the two full-viewport sections stacked here).
const HERO_CHAT_REGION_ID = "hero-chat-region";

/**
 * True while the homepage's Hero + chat finder region (the only
 * full-viewport dark sections on the site) is still in view; false on
 * every other route, and false once scrolled past it on "/". Shared by
 * anything that changes appearance or visibility depending on whether
 * it's currently floating over that region (the header capsule, the
 * sticky contact pill).
 */
export function useIsOverHero(): boolean {
  const pathname = usePathname();
  const isHeroRoute = pathname === "/";

  // Starts true (not measured from the DOM, which doesn't exist on the
  // server) so the very first client render matches SSR output exactly —
  // on "/" the page always starts scrolled to the top, over the hero
  // region. The effect then corrects it from the real element/scroll
  // position, never synchronously during render.
  const [isOverRegion, setIsOverRegion] = useState(true);

  useEffect(() => {
    if (!isHeroRoute) return;

    const region = document.getElementById(HERO_CHAT_REGION_ID);
    if (!region) return;

    const handleScroll = () => {
      // Still in view as long as the region's own bottom edge hasn't
      // scrolled above the top of the viewport.
      setIsOverRegion(region.getBoundingClientRect().bottom > 0);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHeroRoute]);

  return isHeroRoute && isOverRegion;
}
