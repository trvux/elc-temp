import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const STYLES = {
  main: cn("w-full min-h-screen py-12 px-4 md:px-8"),
  container: cn("max-w-5xl mx-auto flex flex-col gap-24"),
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  list: cn("grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16"),
  article: cn(
    "group flex flex-col gap-6 no-underline transition-all duration-300",
  ),
  imageWrapper: cn("relative aspect-video rounded-2xl overflow-hidden border bg-muted"),
  image: cn("object-cover transition-transform duration-500 group-hover:scale-105"),
  articleHeader: cn("flex justify-between items-start gap-4"),
  articleTitle: cn("text-primary/70 group-hover:text-primary transition-colors"),
  articleIcon: cn(
    "w-6 h-6 shrink-0 mt-2 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all",
  ),
  articleDescription: cn("line-clamp-3 text-muted-foreground"),
  footer: cn(
    "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

export default async function ServicesHub() {
  const supabase = await createClient();

  // Fetch all published services
  const { data: allServices } = await supabase
    .from("services")
    .select("id, title, slug, image, meta_description, created_at")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (!allServices) {
    return (
      <main className={STYLES.main}>
        <div className={STYLES.container}>
          <TypographyP className="animate-pulse">
            Đang tải dữ liệu...
          </TypographyP>
        </div>
      </main>
    );
  }

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>Dịch vụ</TypographyH1>
          <TypographyLead className={STYLES.description}>
            Giải pháp chuyên nghiệp dành cho hệ thống lạnh công nghiệp, điều hòa trung tâm và bảo trì hệ thống cơ điện.
          </TypographyLead>
        </header>

        <div className={STYLES.list}>
          {allServices.map((service) => (
            <Link
              key={service.id}
              href={`/dich-vu/${service.slug}`}
              className={STYLES.article}
            >
              {service.image && (
                <div className={STYLES.imageWrapper}>
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className={STYLES.image}
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className={STYLES.articleHeader}>
                  <TypographyH4 className={STYLES.articleTitle}>
                    {service.title}
                  </TypographyH4>
                  <ArrowUpRight className={STYLES.articleIcon} />
                </div>

                {service.meta_description && (
                  <TypographyP className={STYLES.articleDescription}>
                    {service.meta_description}
                  </TypographyP>
                )}
                
                <TypographySmall className="text-muted-foreground/40 font-medium">
                  Cập nhật: {new Date(service.created_at).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </TypographySmall>
              </div>
            </Link>
          ))}
        </div>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
