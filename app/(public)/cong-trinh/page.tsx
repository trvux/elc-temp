import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Fetch all published projects and categories
  const { data: projects } = await supabase
    .from("projects")
    .select("*, categories(name)")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const allProjects = projects || [];

  return (
    <main className="w-full bg-white pt-24 pb-48 font-sans">
      {/* Centered Container with Fluid Padding */}
      <div className="mx-auto w-full px-container max-w-[1400px]">
        {/* Clean Header - Centered */}
        <header className="py-20 flex flex-col items-center text-center space-y-4">
          <h1 className="text-[clamp(24px,3vw,40px)] font-bold tracking-tight text-zinc-900">
            Công Trình Tiêu Biểu
          </h1>
          <p className="text-[clamp(12px,1.2vw,14px)] text-zinc-500 tracking-widest uppercase font-medium">
            {allProjects.length} Dự án đã hoàn thiện
          </p>
        </header>

        {/* Zara Editorial Grid - Much more spacious */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 md:gap-x-16 gap-y-32 md:gap-y-40">
          {allProjects.map((project) => (
            <Link
              key={project.id}
              href={`/cong-trinh/${project.slug}`}
              className="group flex flex-col"
            >
              {/* Image with Zara Aspect Ratio */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#f9f9f9]">
                {project.images?.[0] ? (
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px] font-bold capitalize tracking-[0.3em]">
                    Gallery
                  </div>
                )}
              </div>

              {/* Info with refined spacing */}
              <div className="mt-6 flex flex-col space-y-2 px-0.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[clamp(12px,1.2vw,16px)] font-bold text-zinc-900 leading-tight tracking-tight lowercase first-letter:capitalize shrink-0">
                    {project.title}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-zinc-200 text-zinc-500 text-[10px] md:text-[11px] font-medium bg-transparent shrink-0">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-yellow-500"
                    >
                      <path d="M12 2C12 2 12 9 19 12C12 15 12 22 12 22C12 22 12 15 5 12C12 9 12 2 12 2Z" />
                    </svg>
                    {project.categories?.name || "Khác"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-zinc-400 font-bold tracking-widest capitalize text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Xem chi tiết
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!allProjects.length && (
          <div className="col-span-full py-24 text-center">
            <p className="text-zinc-400 italic text-[12px] capitalize tracking-widest">
              Hiện chưa có công trình nào.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
