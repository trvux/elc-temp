import { AspectRatio } from "@/components/ui/aspect-ratio";
import { generateBreadcrumbSchema, SEO_CONFIG } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

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

  const allProjects = (projects as unknown as Project[]) || [];
  const featured = allProjects[0];
  const rest = allProjects.slice(1);

  const getUrl = (p: Project) =>
    p.categories?.slug
      ? `/du-an/${p.categories.slug}/${p.slug}`
      : `/du-an/${p.slug}`;

  const getCat = (p: Project) =>
    p.categories?.parent?.name
      ? `${p.categories.parent.name} / ${p.categories.name}`
      : p.categories?.name || "Khác";

  // --- STYLES ---
  const styles = {
    main: "w-full px-4 py-12 md:px-8",
    container: "mx-auto w-full px-4 md:px-6 max-w-7xl flex flex-col gap-20",
    header: "flex flex-col items-center text-center gap-3",
    title: "text-4xl md:text-6xl lg:text-7xl leading-tight",
    badge:
      "text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-bold",
    featured: "group block mb-16 md:mb-24",
    featImg: "overflow-hidden rounded-lg shadow-2xl",
    featTitle: "text-2xl md:text-4xl leading-tight",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12",
    card: "group flex flex-col gap-4",
    cardTitle:
      "text-base md:text-lg font-medium leading-tight group-hover:underline underline-offset-8",
    cardCat: "text-xs text-muted-foreground/60 tracking-wider",
    viewMore:
      "text-[10px] text-primary uppercase tracking-[0.2em] font-bold opacity-0 group-hover:opacity-100 transition-all duration-500",
    mobileAspect: "md:hidden overflow-hidden rounded-lg",
    desktopAspect: "hidden md:block overflow-hidden rounded-lg",
    empty:
      "w-full h-full bg-muted/50 flex items-center justify-center text-[10px] tracking-widest uppercase text-muted-foreground/40",
  };

  const ProjectCard = ({
    project,
    isFeatured = false,
  }: {
    project: Project;
    isFeatured?: boolean;
  }) => {
    const url = getUrl(project);
    const cat = getCat(project);

    if (isFeatured) {
      return (
        <Link href={url} className={styles.featured}>
          <div className={styles.featImg}>
            <AspectRatio ratio={16 / 9}>
              {project.images?.[0] ? (
                <Image
                  src={project.images[0]}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className={styles.empty}>Chưa có ảnh</div>
              )}
            </AspectRatio>
          </div>
          <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-2">
              <h2 className={styles.featTitle}>{project.title}</h2>
              <p className={styles.cardCat}>{cat}</p>
            </div>
            <span className={styles.viewMore}>Khám phá dự án —</span>
          </div>
        </Link>
      );
    }

    return (
      <Link href={url} className={styles.card}>
        {/* Mobile: 16/9 */}
        <div className={styles.mobileAspect}>
          <AspectRatio ratio={16 / 9}>
            {project.images?.[0] ? (
              <Image
                src={project.images[0]}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="100vw"
              />
            ) : (
              <div className={styles.empty}>Chưa có ảnh</div>
            )}
          </AspectRatio>
        </div>
        {/* Desktop: 4/5 */}
        <div className={styles.desktopAspect}>
          <AspectRatio ratio={4 / 5}>
            {project.images?.[0] ? (
              <Image
                src={project.images[0]}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className={styles.empty}>Chưa có ảnh</div>
            )}
          </AspectRatio>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className={styles.cardTitle}>{project.title}</h3>
          <p className={styles.cardCat}>{cat}</p>
          <span className={styles.viewMore}>Xem chi tiết</span>
        </div>
      </Link>
    );
  };

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Trang chủ", item: "/" },
    { name: "Dự án", item: "/du-an" },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: allProjects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SEO_CONFIG.baseUrl}${getUrl(p)}`,
      name: p.title,
      image: p.images?.[0] || "",
    })),
  };

  return (
    <main className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dự án hoàn thiện</h1>
          <p className={styles.badge}>
            {allProjects.length} công trình tiêu biểu
          </p>
        </header>

        {featured && <ProjectCard project={featured} isFeatured />}

        {rest.length > 0 && (
          <div className={styles.grid}>
            {rest.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {!allProjects.length && (
          <div className="py-32 text-center">
            <p className="text-muted-foreground/40 italic text-sm font-newsreader">
              Hiện chưa có dự án nào được cập nhật.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
