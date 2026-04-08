import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoTOC } from "@/components/user/info-toc";
import { ScrollToTop } from "@/components/user/scroll-to-top";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
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
    <main className="w-full pt-30 pb-40 px-container min-h-screen bg-background font-sans tracking-tight">
      <div className="max-w-[750px] mx-auto">
        {/* Simplified Header - Match Medium 1:1 minimalist style */}
        <header className="mb-12 border-b border-border pb-4 flex items-center justify-between">
          <div className="text-md md:text-lg font-bold capitalize tracking-widest text-foreground opacity-90 truncate">
            {page.title}
          </div>
          <div className="scale-90 origin-right shrink-0">
            <InfoTOC pages={allPages} currentSlug={slug} />
          </div>
        </header>

        <article className="animate-in fade-in duration-1000 ease-out">
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
            dangerouslySetInnerHTML={{ __html: page.content || "" }}
          />
        </article>

        <footer className="flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span>&copy; {new Date().getFullYear()} ELC Information Center</span>
          <ScrollToTop className="hover:text-foreground transition-colors">
            Trở lên đầu trang
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
