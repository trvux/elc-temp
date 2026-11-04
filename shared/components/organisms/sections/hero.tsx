import Image from "next/image";
import heroBg from "@/public/images/hero-section-bg.jpg";
import { Brand } from "@/modules/brand/domain";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { HeroBrandMarquee } from "./hero-brand-marquee";

interface HeroSectionProps {
  brands?: Brand[];
}

// Tileable fractal-noise grain, laid between the bg photo and the dark
// scrim below — breaks up the sky photo's smooth gradient banding without
// needing an extra image asset. The matrix zeroes out RGB and drives only
// alpha from the turbulence (gain 0.8, so alpha stays mostly in the
// 0-0.6 range — visible specks, not a wash), so this paints translucent
// black specks straight onto whatever's beneath — visible on any
// photo/color, unlike a flat gray tile blended with mix-blend-mode. (An
// earlier gain of 8 clipped nearly every pixel to full alpha, which is
// why it looked like a flat dark overlay instead of grain.)
const NOISE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0" />
  </filter>
  <rect width="100%" height="100%" filter="url(#n)" />
</svg>
`;
const NOISE_BG_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

export function HeroSection({ brands = [] }: HeroSectionProps) {
  return (
    // Outer section is only the gap (sides/bottom) around the rounded hero
    // card, so the photo no longer runs edge to edge into the footer. There is
    // no top gap on purpose: the header's own padding below its links already
    // acts as one, and a second gap made the space above vs below the menu
    // uneven. The card's height is the first viewport minus the sticky header
    // (--header-height) minus the bottom gap, so the whole card and its
    // rounded bottom corners are visible without scrolling.
    <section aria-labelledby="hero-heading" className="w-full px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        // Content is top-anchored (pt-*, items-start) rather than true-centered
        // so it sits in the clear sky area of the bg photo instead of getting
        // covered by the clouds lower down. isolate gives the card its own
        // stacking context so overflow-hidden + rounded corners also clip the
        // scaled/blurred photo in Safari.
        className="relative isolate flex h-[calc(100svh-var(--header-height)-0.75rem)] min-h-163 w-full items-start justify-center overflow-hidden rounded-2xl bg-[#173b84] pt-28 sm:h-[calc(100svh-var(--header-height)-1rem)] sm:rounded-3xl sm:pt-32 lg:pt-40"
      >
        <Image
          src={heroBg}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          // object-[center_35%] biases the cover-crop toward the top of the
          // (portrait, cloud-heavy-at-the-bottom) source photo — pushes the
          // cloud line further down the viewport instead of sitting right
          // behind the description/CTA text, without needing extra
          // darkening on top of it. Only mobile/tablet need this: on wide
          // short (desktop) viewports the cover-crop window is already much
          // shorter, so the same 35% bias crops almost all the way past the
          // clouds, leaving just a sliver at the very bottom. lg: reverts to
          // plain center, matching how this looked before the bias existed.
          // blur-[1.5px] softens the photo; a CSS blur fades the image's own
          // edges to transparent, so scale-105 pushes those edges outside the
          // section's overflow-hidden box instead of showing a pale rim. The
          // grain layer below stays unblurred on top, which is what gives the
          // frosted look.
          className="scale-105 object-cover object-[center_35%] blur-[1.5px] lg:object-center"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] opacity-60"
          style={{
            backgroundImage: NOISE_BG_IMAGE,
            backgroundRepeat: "repeat",
          }}
        />

        {/* Top-to-bottom linear fade — clean edge-to-edge scrim rather than
          a spotlight/ellipse (an earlier radial-gradient version read as
          an odd floating blob instead of an intentional effect). Dark at
          the top where the header/heading/CTA sit, fully transparent
          well before the clouds lower in the frame, so the photo stays
          untouched there. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.12) 30%, rgba(0,0,0,0) 50%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-1/3 bg-gradient-to-b from-transparent to-black"
        />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center select-none sm:gap-6">
          <p className="type-label text-white/70">Điện máy ELC</p>

          <h1
            id="hero-heading"
            className="type-display text-white drop-shadow-sm"
          >
            Nhà thầu EPC{" "}
            <span className="type-body-strong md:type-title mt-2 block text-balance md:whitespace-nowrap">
              (Engineering - Procurement - Construction)
            </span>
          </h1>

          <p className="type-body max-w-md text-white/80 drop-shadow-sm">
            Chuyên về Hệ thống Điều hòa Không khí và Thông gió Cơ khí
            (Mechanical Ventilation &amp; Air Conditioning - MV&amp;AC). Tập
            trung hoàn toàn vào làm mát, khử ẩm, lọc không khí và trao đổi khí
            tươi.
          </p>

          {/* Single CTA into the full-screen consultation form at /form
            (see LeadForm) — replaces the previous "Gọi ngay" / "Tư vấn
            miễn phí" button pair. No entity context passed, since this is
            a general homepage inquiry rather than about one product. */}
          <div className="mt-2 sm:mt-4">
            <LeadForm
              triggerLabel="Yêu cầu tư vấn"
              triggerSize="lg"
              triggerVariant="default"
              showIcon={false}
              className="bg-white text-neutral-900 shadow-lg hover:bg-white/90"
            />
          </div>
        </div>

        {/* Sits low inside the hero itself (not a separate section below it),
          matching the reference's tool-logo row layered over its photo. */}
        {brands.length > 0 && (
          <div className="absolute inset-x-0 bottom-10 z-10 px-6 md:bottom-14">
            <HeroBrandMarquee brands={brands} caption="Đối tác thương hiệu" />
          </div>
        )}
      </div>
    </section>
  );
}
