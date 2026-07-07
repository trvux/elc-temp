const SITE_NAME = "Điện máy ELC";

interface SeoSnippetPreviewProps {
  title: string;
  description: string;
  url: string;
}

// Approximates how Google renders a result — helps staff judge truncation
// and tone before publishing, not a pixel-perfect clone. Google frequently
// rewrites the snippet from page content anyway (see docs/SEO-REDESIGN.md),
// so this is a guide, not a guarantee of what actually shows up.
export function SeoSnippetPreview({ title, description, url }: SeoSnippetPreviewProps) {
  return (
    <div className="rounded-lg border bg-background p-4 font-sans">
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">Xem trước trên Google</p>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
          {SITE_NAME.charAt(0)}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-foreground">{SITE_NAME}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[320px]">{url}</span>
        </div>
      </div>
      <p className="mt-1 truncate text-[#1a0dab] text-lg leading-tight dark:text-[#8ab4f8]">
        {title || "Tiêu đề trang sẽ hiển thị ở đây"}
      </p>
      <p className="mt-0.5 line-clamp-2 text-sm text-[#4d5156] dark:text-[#bdc1c6]">
        {description || "Mô tả trang sẽ hiển thị ở đây..."}
      </p>
    </div>
  );
}
