"use client";

import { useEffect } from "react";
import { AnimatePresence, m } from "motion/react";

import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { useProductFloating } from "@/shared/providers/product-floating-provider";

interface ProjectLeadFloatingBarProps {
  projectId: string;
  entityName: string;
}

// Always visible while mounted (no scroll-position gating like
// ProductFloatingBar's sentinel) — the point is a one-tap CTA that mobile
// visitors have regardless of how far they scroll into the case study.
// Sized/positioned to match the global StickyContactActions pill exactly
// (same corner, same height) and flips its shared floating-active flag off
// instead of stacking a second element in that corner — a full-width bottom
// bar was tried first but read as too heavy for a single text CTA.
export function ProjectLeadFloatingBar({
  projectId,
  entityName,
}: ProjectLeadFloatingBarProps) {
  const { setActive } = useProductFloating();

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-2 right-4 md:right-6 lg:right-8 z-[100]"
      >
        <div className="bg-background/30 backdrop-blur-md border border-white/30 shadow-2xl rounded-md p-1">
          <LeadForm
            projectId={projectId}
            entityName={entityName}
            entityKind="project"
            triggerLabel="Yêu cầu tư vấn"
            triggerVariant="default"
            triggerSize="lg"
            showIcon={false}
            className="shadow-md"
          />
        </div>
      </m.div>
    </AnimatePresence>
  );
}
