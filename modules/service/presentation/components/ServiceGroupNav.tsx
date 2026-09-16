"use client";

import { Button } from "@/shared/components/ui/button";
import { useEffect, useState } from "react";

export interface ServiceGroupNavItem {
  name: string;
  anchor: string;
}

export function ServiceGroupNav({ groups }: { groups: ServiceGroupNavItem[] }) {
  const [activeAnchor, setActiveAnchor] = useState(groups[0]?.anchor);

  useEffect(() => {
    const elements = groups
      .map((group) => document.getElementById(group.anchor))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // rootMargin đẩy vùng "đang xem" xuống dưới header (64px) + chính
    // thanh chip này, và chỉ tính 30% đầu viewport để tránh 2 nhóm cùng
    // active một lúc khi cuộn nhanh qua nhiều ô ngắn.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveAnchor(visible[0].target.id);
        }
      },
      { rootMargin: "-130px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [groups]);

  if (groups.length <= 1) return null;

  return (
    <nav
      aria-label="Chuyển nhanh tới nhóm dịch vụ"
      className="sticky top-16 z-30 -mx-4 md:-mx-6 lg:-mx-8 -mt-6 md:-mt-8 lg:-mt-10 mb-2 flex items-center gap-2 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur-sm md:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {groups.map((group) => (
        <Button
          key={group.anchor}
          asChild
          size="sm"
          variant={activeAnchor === group.anchor ? "default" : "secondary"}
          className="shrink-0 rounded-full whitespace-nowrap"
        >
          <a href={`#${group.anchor}`}>{group.name}</a>
        </Button>
      ))}
    </nav>
  );
}
