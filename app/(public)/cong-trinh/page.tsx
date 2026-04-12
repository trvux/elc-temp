import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getOptimizedImage } from "@/lib/image";

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
    parent?: { name: string };
  };
}

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, categories(name, slug, parent:parent_id(name))")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const allProjects = projects || [];
  const featured = allProjects[0];
  const rest = allProjects.slice(1);

  const getUrl = (project: Project) =>
    project.categories?.slug
      ? `/cong-trinh/${project.categories.slug}/${project.slug}`
      : `/cong-trinh/${project.slug}`;

  const getCat = (project: Project) =>
    project.categories?.parent?.name
      ? `${project.categories.parent.name} / ${project.categories.name}`
      : project.categories?.name || "Khác";

  return (
    <main className="w-full pt-24 pb-24">
      <div className="mx-auto w-full px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <header className="py-16 flex flex-col items-center text-center gap-3">
          <h1 className="font-newsreader text-4xl md:text-5xl lg:text-6xl italic leading-tight">
            Công trình dự án
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-medium">
            {allProjects.length} dự án đã hoàn thiện
          </p>
        </header>

        {/* Featured */}
        {featured && (
          <Link href={getUrl(featured)} className="group block mb-12 md:mb-16">
            <div className="overflow-hidden rounded-sm">
              <AspectRatio ratio={16 / 9}>
                {featured.images?.[0] ? (
                  <Image
                    src={getOptimizedImage(featured.images[0])}
                    alt={featured.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="100vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs tracking-widest uppercase">
                    Chưa có ảnh
                  </div>
                )}
              </AspectRatio>
            </div>
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h2 className="font-newsreader text-2xl md:text-3xl italic leading-tight">
                  {featured.title}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {getCat(featured)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Xem chi tiết →
              </span>
            </div>
          </Link>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <>
            <div className="border-t border-border mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((project) => (
                <Link
                  key={project.id}
                  href={getUrl(project)}
                  className="group flex flex-col"
                >
                  {/* Mobile: 16/9 */}
                  <div className="block md:hidden overflow-hidden rounded-sm">
                    <AspectRatio ratio={16 / 9}>
                      {project.images?.[0] ? (
                        <Image
                          src={getOptimizedImage(project.images[0], 800)}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="100vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          Chưa có ảnh
                        </div>
                      )}
                    </AspectRatio>
                  </div>

                  {/* Desktop: 4/5 */}
                  <div className="hidden md:block overflow-hidden rounded-sm">
                    <AspectRatio ratio={4 / 5}>
                      {project.images?.[0] ? (
                        <Image
                          src={getOptimizedImage(project.images[0], 800)}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          Chưa có ảnh
                        </div>
                      )}
                    </AspectRatio>
                  </div>

                  <div className="mt-3 flex flex-col gap-1">
                    <h3 className="text-sm md:text-base font-medium leading-tight group-hover:underline underline-offset-4">
                      {project.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {getCat(project)}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Xem chi tiết
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {!allProjects.length && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground/60 italic text-sm">
              Hiện chưa có công trình nào.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
