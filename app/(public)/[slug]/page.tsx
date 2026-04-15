import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographySmall,
} from "@/components/ui/typography";

// Design System / Style Constants
const STYLES = {
  main: cn(
    "w-full pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen font-sans tracking-tight"
  ),
  container: cn("max-w-3xl mx-auto"),
  header: cn("mb-20"),
  title: cn(
    "text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1.05] lowercase first-letter:capitalize mb-8 border-none"
  ),
  meta: cn(
    "flex items-center gap-4 font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-12"
  ),
  lead: cn(
    "text-xl md:text-2xl leading-[1.6] text-muted-foreground/80 font-medium italic border-l-4 border-primary/20 pl-8 my-16 font-serif"
  ),
  prose: cn(
    "prose prose-zinc prose-lg md:prose-xl dark:prose-invert max-w-none",
    "font-serif",
    "prose-p:leading-[1.8] prose-p:my-12 prose-p:text-lg md:prose-p:text-xl prose-p:text-foreground/90",
    "prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-foreground",
    "prose-headings:mt-24 prose-headings:mb-10 prose-headings:leading-[1.1]",
    "prose-a:text-primary prose-a:underline prose-a:underline-offset-8 decoration-primary/20 hover:decoration-primary transition-all",
    "prose-img:rounded-none prose-img:w-full prose-img:block prose-img:mx-auto prose-img:my-20 prose-img:shadow-2xl prose-img:shadow-foreground/5",
    "prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:text-muted-foreground",
    "prose-ul:list-disc prose-ul:pl-8 prose-ol:list-decimal prose-ol:pl-8"
  ),
  footerNav: cn("mt-40 pt-16 border-t border-border flex flex-col gap-12"),
  backLink: cn(
    "group flex flex-col gap-4 no-underline max-w-max py-4 px-6 -mx-6 rounded-2xl transition-all duration-300 hover:bg-foreground/[0.03]"
  ),
  backLabel: cn(
    "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 group-hover:text-primary transition-colors"
  ),
  backTitle: cn(
    "text-2xl font-bold tracking-tight text-foreground/80 group-hover:text-foreground transition-all border-none"
  ),
  footer: cn(
    "mt-24 pt-12 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-8 text-muted-foreground/40"
  ),
  scrollToTop: cn("hover:text-foreground transition-colors cursor-pointer"),
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("slug")
    .eq("is_published", true);
  return (pages ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("title, meta_title, meta_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) return { title: "Không tìm thấy nội dung" };

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || "Thông tin chính thức từ ELC Holdings",
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch current page content
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <div className={STYLES.meta}>
            <TypographySmall className="font-black">
              Tài liệu chính thức
            </TypographySmall>
            <span className="w-1 h-1 bg-border rounded-full" />
            <TypographySmall className="font-black">
              {new Date(page.created_at).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </TypographySmall>
          </div>
          <TypographyH1 className={STYLES.title}>{page.title}</TypographyH1>
        </header>

        <article>
          {page.meta_description && (
            <TypographyLead className={STYLES.lead}>
              {page.meta_description}
            </TypographyLead>
          )}

          <div
            className={STYLES.prose}
            dangerouslySetInnerHTML={{
              __html: (page.content || "").replace(
                /<img(\s[^>]*?)?>/gi,
                (_match: string, attrs: string = "") => {
                  const a = attrs
                    .replace(/\bloading="[^"]*"/gi, "")
                    .replace(/\bwidth="[^"]*"/gi, "")
                    .replace(/\bheight="[^"]*"/gi, "");
                  return `<img${a} loading="lazy" width="1200" height="800">`;
                }
              ),
            }}
          />
        </article>

        <nav className={STYLES.footerNav}>
          <Link href="/thong-tin" className={STYLES.backLink}>
            <div className={STYLES.backLabel}>
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
              <span>Quay lại danh mục</span>
            </div>
            <TypographyH2 className={STYLES.backTitle}>
              Thông tin về ELC
            </TypographyH2>
          </Link>
        </nav>

        <footer className={STYLES.footer}>
          <TypographySmall className="font-bold tracking-widest uppercase">
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall className="font-bold tracking-widest uppercase">
              Trở lên đầu trang
            </TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
