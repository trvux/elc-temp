import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Project {
  id: string;
  title: string;
  slug: string;
  images: string[];
  is_published: boolean;
  order_index: number;
  categories?: {
    name: string;
    slug: string;
    parent?: {
      name: string;
    };
  };
}

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Fetch all published projects and categories
  const { data: projects } = await supabase
    .from("projects")
    .select("*, categories(name, slug, parent:parent_id(name))")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const allProjects = projects || [];

  return (
    <main className="w-full bg-background pt-24 pb-48 font-sans">
      {/* Centered Container with Fluid Padding */}
      <div className="mx-auto w-full px-container max-w-[1400px]">
        {/* Clean Header - Centered */}
        <header className="py-20 flex flex-col items-center text-center space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Công Trình Tiêu Biểu
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground tracking-widest capitalize font-medium">
            {allProjects.length} Dự án đã hoàn thiện
          </p>
        </header>

        {/* Zara Editorial Grid - Much more spacious */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 md:gap-x-16 gap-y-32 md:gap-y-40">
          {allProjects.map((project: Project, index: number) => (
            <Link
              key={project.id}
              href={`/cong-trinh/${project.categories?.slug ? project.categories.slug + "/" : ""}${project.slug}`}
              className="group flex flex-col"
            >
              <div className="w-full overflow-hidden bg-muted/20">
                <AspectRatio ratio={2 / 3}>
                  {project.images?.[0] ? (
                    <Image
                      src={project.images[0]}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 2}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-[10px] font-bold capitalize tracking-[0.3em]">
                      Gallery
                    </div>
                  )}
                </AspectRatio>
              </div>

              {/* Info with refined spacing */}
              <div className="mt-6 flex flex-col space-y-2 px-0.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base md:text-lg font-bold text-foreground leading-tight tracking-tight lowercase first-letter:capitalize shrink-0">
                    {project.title}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border text-muted-foreground text-[10px] md:text-[11px] font-medium bg-transparent shrink-0">
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
                    {project.categories?.parent?.name
                      ? `${project.categories.parent.name} / ${project.categories.name}`
                      : project.categories?.name || "Khác"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground font-bold tracking-widest capitalize text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Xem chi tiết
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!allProjects.length && (
          <div className="col-span-full py-24 text-center">
            <p className="text-muted-foreground/60 italic text-xs md:text-sm capitalize tracking-widest">
              Hiện chưa có công trình nào.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
