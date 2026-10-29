"use client";

import { useEffect, useState } from "react";
import { m } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import type { ProjectWithCategory } from "@/modules/project/domain/types";
import { Button } from "@/shared/components/ui/button";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

// Only what the card renders — callers slim projects before crossing the
// server/client boundary so full project content isn't serialized into the page.
export type ProjectBounceCard = Pick<ProjectWithCategory, "id" | "slug" | "title" | "images">;

interface ProjectBounceCardsSectionProps {
  title?: string;
  description?: string;
  projects?: ProjectBounceCard[];
}

// Generated fan positions — a small sine jitter on top of the linear
// spread keeps it from reading as a perfectly even chart. Center card
// sits at rotate 0 / x 0; the rest fan out symmetrically from there.
// Tighter steps on mobile — at the desktop spacing, 15 cards spill past
// a ~360px viewport and the outer ones get clipped off-screen entirely.
function buildFan(count: number, isMobile: boolean) {
  const center = (count - 1) / 2;
  const rotateStep = isMobile ? 1.6 : 2.4;
  const xStep = isMobile ? 15 : 26;
  return Array.from({ length: count }, (_, i) => {
    const offset = i - center;
    const jitter = Math.sin(i * 2.1) * (isMobile ? 1 : 1.6);
    return { rotate: offset * rotateStep + jitter, x: offset * xStep };
  });
}

const CARD_COUNT = 15;

export function ProjectBounceCardsSection({
  title = "Dự án tiêu biểu nổi bật",
  description = "",
  projects = [],
}: ProjectBounceCardsSectionProps) {
  const isMobile = useIsMobile();
  const cards = (projects || []).slice(0, CARD_COUNT);
  const fan = buildFan(cards.length, isMobile);
  const center = (cards.length - 1) / 2;
  const [hovered, setHovered] = useState<number | null>(null);
  // Stagger the bounce-in only on mount — once it's settled, hover
  // transitions should react immediately, not replay the entrance delay.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 260 + cards.length * 80);
    return () => clearTimeout(t);
  }, [cards.length]);

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="featured-projects-heading" className="w-full max-w-7xl mx-auto px-4 md:px-0">
      <div className="flex flex-col items-center text-center gap-3 mb-14 md:mb-20">
        <h2 id="featured-projects-heading" className="type-title">{title}</h2>
        {description && (
          <p className="type-body text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>

      <ul className="relative mx-auto flex items-center justify-center h-[170px] sm:h-[230px]">
        {cards.map((project, idx) => {
          const base = fan[idx] ?? { rotate: 0, x: 0 };
          const isHovered = hovered === idx;
          const pushed =
            hovered !== null && hovered !== idx
              ? (idx < hovered ? -1 : 1) *
                (isMobile ? 20 + Math.abs(hovered - idx) * 3 : 40 + Math.abs(hovered - idx) * 6)
              : 0;
          const scaleDown = hovered !== null && !isHovered ? 0.94 : 1;

          return (
            <li
              key={project.id}
              className="absolute"
              style={{ zIndex: isHovered ? 20 : Math.round(10 - Math.abs(idx - center)) }}
            >
            <Link
              href={`/du-an/${project.slug}`}
              aria-label={`Xem dự án ${project.title}`}
              className="block"
            >
              <m.div
                className="relative w-[86px] h-[86px] sm:w-[150px] sm:h-[150px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-4 border-background shadow-xl bg-muted cursor-pointer"
                // Framer Motion rounds the transform it writes to fewer decimal
                // places than the raw `base.rotate` float baked into the SSR-ed
                // inline style, so the two markups disagree on the transform
                // string by a fraction of a degree on first hydrate — same
                // value, just formatted differently, nothing to reconcile.
                suppressHydrationWarning
                initial={{ scale: 0, rotate: base.rotate, x: base.x }}
                animate={{
                  scale: (isHovered ? 1.07 : 1) * scaleDown,
                  rotate: isHovered ? 0 : base.rotate,
                  x: base.x + pushed,
                  y: isHovered ? -14 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                  delay: entered ? 0 : idx * 0.05,
                }}
                onHoverStart={() => setHovered(idx)}
                onHoverEnd={() => setHovered(null)}
              >
                <Image
                  src={primaryImageUrl(project.images) || "/placeholder.png"}
                  alt=""
                  fill
                  sizes="150px"
                  className="object-cover"
                  priority={idx < 4}
                />
                <div
                  className="absolute inset-x-0 bottom-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300"
                  style={{ opacity: isHovered ? 1 : 0 }}
                >
                  <p className="type-legal text-white line-clamp-2">
                    {project.title}
                  </p>
                </div>
              </m.div>
            </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-center mt-14 md:mt-20">
        <Button asChild variant="outline">
          <Link href="/du-an">
            Xem tất cả dự án
            <ArrowRight weight="bold" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
