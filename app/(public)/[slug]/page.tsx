import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoTOC } from "@/components/user/info-toc";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
    <main className="w-full pt-32 pb-24 px-4 min-h-screen bg-white dark:bg-zinc-950 font-sans tracking-tight">
      <div className="max-w-[700px] mx-auto">
        
        {/* Simplified Header - Match Medium 1:1 minimalist style */}
        <header className="mb-12 border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center justify-between">
           <div className="text-[13px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 opacity-90 truncate">
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
                 <p className="text-[22px] leading-[1.3] text-zinc-500 dark:text-zinc-400 font-medium italic border-l-2 border-emerald-500/20 pl-6">
                    {page.meta_description}
                 </p>
              </header>
           )}

           {/* Medium Body Typography Style - NO decorative background text */}
           <div 
             className="prose prose-zinc prose-lg md:prose-xl dark:prose-invert max-w-none 
               font-serif 
               prose-p:leading-[1.65] prose-p:my-10 prose-p:text-[20px] prose-p:text-zinc-800 dark:prose-p:text-zinc-200
               prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50
               prose-headings:mt-16 prose-headings:mb-6
               prose-a:text-zinc-900 dark:prose-a:text-zinc-50 prose-a:underline prose-a:underline-offset-4
               prose-img:rounded-none prose-img:w-full prose-img:block prose-img:mx-auto prose-img:my-12 prose-img:cursor-zoom-in"
             dangerouslySetInnerHTML={{ __html: page.content || "" }}
           />
        </article>

        <footer className="mt-40 pt-10 border-t border-border/10 text-center text-xs text-muted-foreground opacity-50">
           &copy; {new Date().getFullYear()} ELC Information Center
        </footer>
      </div>
    </main>
  );
}
