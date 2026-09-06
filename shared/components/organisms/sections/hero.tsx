import Image from "next/image";
import heroBg from "@/public/images/hero-section-bg.jpg";
import { Brand } from "@/modules/brand/domain";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { TypographyP } from "@/shared/components/ui/typography";
import { HeroBrandMarquee } from "./hero-brand-marquee";

interface HeroSectionProps {
  brands?: Brand[];
}

// Tileable fractal-noise grain, laid between the bg photo and the dark
// scrim below — breaks up the sky photo's smooth gradient banding without
// needing an extra image asset. The matrix zeroes out RGB and drives only
// alpha from the turbulence (gain 0.5, so alpha stays mostly in the
// 0-0.4 range — fine specks, not a wash), so this paints translucent
// black specks straight onto whatever's beneath — visible on any
// photo/color, unlike a flat gray tile blended with mix-blend-mode. (An
// earlier gain of 8 clipped nearly every pixel to full alpha, which is
// why it looked like a flat dark overlay instead of grain.)
const NOISE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" />
  </filter>
  <rect width="100%" height="100%" filter="url(#n)" />
</svg>
`;
const NOISE_BG_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

export function HeroSection({ brands = [] }: HeroSectionProps) {
  return (
    <section
      // -mt cancels the (public) layout's fixed-header clearance so this
      // full-bleed section reaches the very top, matching the reference:
      // the header sits transparently over the hero, not above it. Content
      // is top-anchored (pt-*, items-start) rather than true-centered so it
      // sits in the clear sky area of the bg photo instead of getting
      // covered by the clouds lower down.
      className="relative -mt-16 flex h-screen min-h-163 w-full items-start justify-center overflow-hidden bg-[#173b84] pt-28 sm:pt-32 lg:pt-40"
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
        className="object-cover object-[center_35%] lg:object-center"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] opacity-40"
        style={{ backgroundImage: NOISE_BG_IMAGE, backgroundRepeat: "repeat" }}
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
        <span className="text-sm font-semibold text-white/70">
          Điện máy ELC
        </span>

        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
          Đối Tác Điện Lạnh Trọn Gói
        </h1>

        <TypographyP className="max-w-md text-base leading-relaxed font-medium text-white/80 drop-shadow-sm sm:text-lg">
          Phân phối chính hãng máy lạnh và hệ thống cấp khí tươi thu hồi
          nhiệt Menred, thi công công trình trọn gói từ dân dụng đến công
          nghiệp, cùng dịch vụ bảo trì, vệ sinh, sửa chữa chuyên nghiệp.
        </TypographyP>

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
    </section>
  );
}
