"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeWatcher() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    // Xác định màu dựa trên theme thực tế mà user đang xem trên web
    const themeColor = resolvedTheme === "dark" ? "#18181b" : "#ffffff";

    // 1. Tìm các thẻ meta theme-color hiện có (kể cả thẻ tĩnh có media query)
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');

    if (metaTags.length > 0) {
      metaTags.forEach((meta) => {
        // Ghi đè hoặc xóa tạm thời attribute media để nó ăn theo màu chuẩn xác nhất
        meta.removeAttribute("media");
        meta.setAttribute("content", themeColor);
      });
    } else {
      // Nếu chưa có thì tạo mới injection vào head
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = themeColor;
      document.head.appendChild(meta);
    }
  }, [resolvedTheme]);

  return null;
}
