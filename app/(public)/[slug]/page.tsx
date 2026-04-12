import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { InfoTOC } from "@/components/user/info-toc";
import { ScrollToTop } from "@/components/user/scroll-to-top";

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

  // Fetch page metadata
  const { data: page } = await supabase
    .from("pages")
    .select("title, meta_title, meta_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) return { title: "Không tìm thấy trang" };

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || "Thông tin từ ELC",
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch all published pages for the TOC
  const { data: allPages } = await supabase
    .from("pages")
    .select("id, title, slug")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  // Fetch current page content
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page || !allPages) {
    notFound();
  }

  return (
    <main className="w-full pt-32 md:38 pb-24 px-4 md:px-6 min-h-screen font-sans tracking-tight">
      <div className="max-w-4xl mx-auto">
        {/* Header - Reorganized for consistency */}
        <header className="mb-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-8 md:gap-8">
            {/* TOC - First on mobile, Right on Desktop */}
            <div className="order-1 md:order-2 w-full md:w-auto">
              <InfoTOC
                pages={allPages}
                currentSlug={slug}
                className="w-full md:w-56"
              />
            </div>

            {/* Title - Second on mobile, Left on Desktop */}
            <h1 className="order-2 md:order-1 text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-none lowercase first-letter:capitalize shrink-0">
              {page.title}
            </h1>
          </div>
        </header>

        <article>
          {/* Subheading/Lead paragraph */}
          {page.meta_description && (
            <header className="mb-10">
              <p className="text-fluid-h3 leading-[1.3] text-muted-foreground/80 font-medium italic border-l-2 border-primary/20 pl-6">
                {page.meta_description}
              </p>
            </header>
          )}

          {/* Medium Body Typography Style - NO decorative background text */}
          <div
            className="prose prose-zinc prose-lg md:prose-xl dark:prose-invert max-w-none 
                font-serif 
                prose-p:leading-[1.7] prose-p:my-10 prose-p:text-fluid-base prose-p:text-foreground/90
                prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                prose-headings:mt-16 prose-headings:mb-6
                prose-a:text-primary prose-a:underline prose-a:underline-offset-4
                prose-img:rounded-none prose-img:w-full prose-img:block prose-img:mx-auto prose-img:my-12 prose-img:cursor-zoom-in"
            dangerouslySetInnerHTML={{
                __html: (page.content || "").replace(
                  /<img(\s[^>]*?)?>/gi,
                  (_match: string, attrs: string = "") => {
                    const a = attrs
                      .replace(/\bloading="[^"]*"/gi, "")
                      .replace(/\bwidth="[^"]*"/gi, "")
                      .replace(/\bheight="[^"]*"/gi, "");
                    return `<img${a} loading="lazy" width="760" height="507">`;
                  }
                ),
              }}
          />
        </article>

        <footer className="mt-24 pt-8 border-t border-border flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span>&copy; {new Date().getFullYear()} ELC Information Center</span>
          <ScrollToTop className="hover:text-foreground transition-colors">
            Trở lên đầu trang
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
