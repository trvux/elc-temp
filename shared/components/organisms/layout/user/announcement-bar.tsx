"use client";

import { usePathname } from "next/navigation";

// Thin strip above the header, homepage only. It sits in normal flow (not
// sticky), so it scrolls away and the sticky header takes the top edge as before.
// The layout is a server component with no access to the path, hence the
// usePathname check here; the bar is still rendered into the server HTML.
export function AnnouncementBar() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <aside
      aria-label="Thông báo từ Điện máy ELC"
      className="dark bg-muted text-foreground px-4 py-2 text-center"
    >
      <p className="type-body-sm">
        Thông báo: Điện máy ELC đang nâng cấp website và cập nhật nội dung nên đôi khi chưa hoàn thiện.
      </p>
    </aside>
  );
}
