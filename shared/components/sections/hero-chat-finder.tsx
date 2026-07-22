import { ProductChatFinder } from "@/modules/catalog/presentation/components/ProductChatFinder";

// Sits directly under HeroSection (bg-black, see hero.tsx) — same dark
// backdrop, same h-screen/min-h-[650px] sizing, so the AI finder reads as
// its own full "screen" in the scroll (matching the hero's own scale)
// rather than a small widget squeezed under it. Previously lived inside
// /san-pham's toolbar, easy to miss next to the category grid; this is the
// actual point in the funnel where "I don't know exactly what I need yet"
// visitors land first.
//
// The heading itself lives inside ProductChatFinder, not here — its
// position (centered mid-page vs. a small header once a conversation
// starts) reacts to the same turns-state the composer/transcript do, so it
// has to be co-located with that state rather than a static element a
// parent passes down.
export function HeroChatFinderSection() {
  return (
    <section className="relative flex h-screen min-h-[650px] w-full flex-col items-center overflow-hidden bg-black px-6 pt-24 pb-10">
      {/* pt-24 (~5.75rem, matching the layout's own fixed-header
          clearance — see (public)/layout.tsx's pt-[5.75rem], which only
          reserves that space once at the very top of the page, above
          HeroSection). Once this section scrolls up so its own top edge
          reaches the viewport top, the fixed header would otherwise
          overlap whatever sits right at this section's top — the title,
          now that it's top-anchored (not vertically centered like the
          old items-center/justify-center layout) instead of clearing it. */}
      {/* h-full (not the old wrapper's shrink-to-content sizing) is
          load-bearing: this section's parent flex box no longer stretches
          it, so without an explicit height it sizes to its own content —
          which for a growing chat transcript means growing past the
          section's h-screen instead of scrolling inside it. ProductChatFinder
          needs the full, bounded height so its own flex-1/min-h-0 scroller
          chain has something real to constrain against. */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col">
        <ProductChatFinder />
      </div>
    </section>
  );
}
