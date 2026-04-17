import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
  TypographySmall,
} from "@/components/ui/typography";
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

  // --- STYLES (Only Layout & Interactions) ---
  const styles = {
    main: "w-full px-4 py-12 md:px-8",
    container: "mx-auto w-full px-4 md:px-6 max-w-7xl flex flex-col gap-20",
    header: "flex flex-col items-center text-center gap-3",
    featured: "group block mb-16 md:mb-24",
    featImg: "overflow-hidden rounded-lg shadow-2xl",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12",
    card: "group flex flex-col gap-4",
    cardTitle: "group-hover:underline underline-offset-8",
    viewMore:
      "text-primary opacity-0 group-hover:opacity-100 transition-all duration-500",
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
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              ) : (
                <div className={styles.empty}>Chưa có ảnh</div>
              )}
            </AspectRatio>
          </div>
          <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-2">
              <TypographyH2>{project.title}</TypographyH2>
              <TypographyMuted>{cat}</TypographyMuted>
            </div>
            <TypographySmall className={styles.viewMore}>
              Khám phá dự án —
            </TypographySmall>
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
                sizes="(max-width: 768px) 100vw, 1px"
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
                sizes="(max-width: 1024px) 50vw, 400px"
              />
            ) : (
              <div className={styles.empty}>Chưa có ảnh</div>
            )}
          </AspectRatio>
        </div>
        <div className="flex flex-col gap-2">
          <TypographyH3 className={styles.cardTitle}>
            {project.title}
          </TypographyH3>
          <TypographyMuted>{cat}</TypographyMuted>
          <TypographySmall className={styles.viewMore}>
            Xem chi tiết
          </TypographySmall>
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
          <TypographyH1>Dự án hoàn thiện</TypographyH1>
          <TypographyMuted>
            {allProjects.length} công trình tiêu biểu
          </TypographyMuted>
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
            <TypographyMuted className="italic font-newsreader opacity-40">
              Hiện chưa có dự án nào được cập nhật.
            </TypographyMuted>
          </div>
        )}
      </div>
    </main>
  );
}
