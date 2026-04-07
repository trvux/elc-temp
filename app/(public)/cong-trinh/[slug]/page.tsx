import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { InfoTOC } from "@/components/user/info-toc";
import { Badge } from "@/components/ui/badge";

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch project data with category
  const { data: project } = await supabase
    .from("projects")
    .select("*, categories(name)")
    .eq("slug", slug)
    .single();

  if (!project) {
    notFound();
  }

  // Fetch all projects for the TOC
  const { data: allProjects } = await supabase
    .from("projects")
    .select("id, title, slug")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const images = project.images || [];

  return (
    <main className="w-full pt-32 pb-24 px-4 min-h-screen bg-white font-sans tracking-tight">
      <div className="max-w-[800px] mx-auto">
        
        {/* Header: Project Title + Badge on left, TOC on right */}
        <header className="mb-10 md:mb-14 border-b border-zinc-100 pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col items-start gap-3">
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 text-zinc-600 text-[12px] md:text-[13px] font-medium bg-transparent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-yellow-500">
                  <path d="M12 2C12 2 12 9 19 12C12 15 12 22 12 22C12 22 12 15 5 12C12 9 12 2 12 2Z" />
                </svg>
                {project.categories?.name || "Dự án"}
             </span>
             <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 leading-none">
                {project.title}
             </h1>
          </div>
          <div className="shrink-0 flex items-center md:pb-1">
             <InfoTOC pages={allProjects || []} currentSlug={project.slug} basePath="/cong-trinh" />
          </div>
        </header>

        {/* Main Article Section */}
        <article className="animate-in fade-in duration-1000 ease-out">
           
           {/* Hero Image */}
           {images[0] && (
             <div className="w-full mb-16 relative aspect-[16/9] overflow-hidden bg-[#f6f6f6]">
                <Image 
                   src={images[0]} 
                   alt={project.title} 
                   fill 
                   className="object-cover" 
                   priority 
                   sizes="(max-width: 800px) 100vw, 800px"
                />
             </div>
           )}

           {/* Rich Text Editor Content */}
           <div 
             className="prose prose-zinc prose-lg md:prose-xl max-w-none 
               font-serif 
               prose-p:leading-[1.65] prose-p:my-10 prose-p:text-[20px] prose-p:text-zinc-800
               prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900
               prose-headings:mt-16 prose-headings:mb-6
               prose-a:text-zinc-900 prose-a:underline prose-a:underline-offset-4
               prose-img:rounded-none prose-img:w-full prose-img:block prose-img:mx-auto prose-img:my-12"
             dangerouslySetInnerHTML={{ __html: project.description || '' }}
           />

           {/* Additional Images (if any) */}
           {images.length > 1 && (
             <div className="mt-20 space-y-12">
                {images.slice(1).map((img: string, i: number) => (
                   <div key={i} className="relative aspect-auto w-full bg-[#f6f6f6]">
                      <img 
                        src={img} 
                        alt={`${project.title} - ảnh ${i + 1}`} 
                        className="w-full h-auto object-contain" 
                        loading="lazy"
                      />
                   </div>
                ))}
             </div>
           )}
        </article>

        {/* Minimal Footer */}
        <footer className="mt-40 pt-10 border-t border-zinc-100 flex items-center justify-between text-[12px] text-zinc-400 font-medium">
           <span>&copy; {new Date().getFullYear()} ELC Architecture</span>
           <a 
             href="#"
             className="hover:text-zinc-900 transition-colors"
           >
             Trở lên đầu trang
           </a>
        </footer>
      </div>
    </main>
  );
}
