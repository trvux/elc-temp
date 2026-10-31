import type { Metadata } from "next";

import { CTASection } from "@/shared/components/organisms/sections/cta";
import { HeroSection } from "@/shared/components/organisms/sections/hero";
import { ProjectBounceCardsSection } from "@/shared/components/organisms/sections/project-bounce-cards";

import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";

import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// Every other page in the app sets its own alternates.canonical — the
// homepage was the one exception (root layout.tsx's metadata has none),
// so it had no canonical tag at all.
export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

async function getCachedHomeData() {
  const [projects, contacts, brands] = await Promise.all([
    getProjectsAction({
      isPublished: true,
      limit: 200,
    }).then(unwrapActionResult),
    getContactsAction().then(unwrapActionResult),
    getBrandsAction({ limit: 100 }).then(unwrapActionResult),
  ]);

  return { projects, contacts, brands };
}

export default async function Home() {
  const { projects, contacts, brands } = await getCachedHomeData();

  const sections = [
    {
      id: "project-marquee",
      component: (
        <ProjectBounceCardsSection
          projects={(projects || [])
            .filter((p) => p.isFeatured)
            .map(({ id, slug, title, images }) => ({
              id,
              slug,
              title,
              images: images.slice(0, 1),
            }))}
          title="Dự án tiêu biểu nổi bật"
        />
      ),
    },
    {
      id: "cta",
      component: <CTASection contacts={contacts || []} />,
    },
  ];

  // Render layout sections
  return (
    <>
      <main className="w-full flex flex-col mt-0 mb-0">
        {/* id read by useIsOverHero — the header (and sticky contact pill)
            stay in their "floating over a dark hero" look for exactly this
            region, not a fixed pixel guess. */}
        <div id="hero-chat-region">
          <HeroSection brands={brands || []} />
        </div>
        {/* Section separation is now pure spacing, no divider/diamond — see
            grid-section.tsx's own removal comment (2026-09-24) for why. */}
        {sections.map((section) => (
          <div key={section.id} id={section.id} className="w-full relative">
            <div className="mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative py-12 md:py-20 lg:py-32">
              {section.component}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
