import { getBranchBySlug, getBranches } from "@/modules/branch";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  TypographyH1,
  TypographyH4,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { notFound } from "next/navigation";

// Helper to control Google Maps zoom level
const getZoomedUrl = (url: string, zoomLevel = "13.1") => {
  return url.replace(/!4f[\d.]+/, `!4f${zoomLevel}`);
};

// Design System / Style Constants
const STYLES = {
  main: cn("min-h-screen w-full px-4 py-12 md:px-8"),
  container: cn(
    "mx-auto flex max-w-3xl flex-col items-center justify-center gap-6",
  ),
  title: cn("w-full max-w-none! text-wrap!"),
  section: cn("w-full"),
  accordion: cn("w-full"),
  accordionItem: cn("flex flex-col gap-4 border-b last:border-b-0"),
  accordionContent: cn("text-lg"),
  prose: cn("prose prose-neutral max-w-none dark:prose-invert"),
  mapCard: cn("m-1 overflow-hidden p-2 shadow-sm bg-background/60"),
  mapIframe: cn(
    "w-full h-full rounded-lg transition-all duration-2000 ease-in-out ",
  ),
  footer: cn(
    "mt-10 flex w-full flex-col items-center justify-between gap-10 border-t border-border pt-8 text-muted-foreground md:flex-row",
  ),
};

export async function generateStaticParams() {
  const branches = await getBranches({ isPublished: true });
  return branches.map((b) => ({ slug: b.slug }));
}

export default async function BranchDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const branch = await getBranchBySlug(slug);

  if (!branch || !branch.isPublished) {
    notFound();
  }

  const items = [
    {
      value: "address",
      trigger: "Địa chỉ chi nhánh",
      content: (
        <div>
          <span>{branch.address}</span>
          {branch.mapsEmbed && (
            <Card className={STYLES.mapCard}>
              <CardContent className="p-0">
                <AspectRatio ratio={16 / 9}>
                  <iframe
                    src={getZoomedUrl(
                      branch.mapsEmbed.match(/src="([^"]+)"/)?.[1] ||
                        branch.mapsEmbed,
                      "15",
                    )}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className={STYLES.mapIframe}
                  />
                </AspectRatio>
              </CardContent>
            </Card>
          )}
        </div>
      ),
      isVisible: !!branch.address,
    },
    {
      value: "phone",
      trigger: "Số điện thoại liên hệ",
      content: (
        <a href={`tel:${branch.phone?.replace(/\s/g, "")}`}>
          {branch.phone || ""}
        </a>
      ),
      isVisible: !!branch.phone,
    },

    {
      value: "email",
      trigger: "Địa chỉ email",
      content: <a href={`mailto:${branch.email}`}>{branch.email}</a>,
      isVisible: !!branch.email,
    },
  ].filter((item) => item.isVisible);

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header>
          <TypographyH1 className={STYLES.title}>{branch.name}</TypographyH1>
        </header>
        <section className={STYLES.section}>
          <Accordion
            type="single"
            collapsible
            className={STYLES.accordion}
            defaultValue="address"
          >
            {items.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className={STYLES.accordionItem}
              >
                <AccordionTrigger>
                  <TypographyH4>{item.trigger}</TypographyH4>
                </AccordionTrigger>
                <AccordionContent>
                  <div className={STYLES.accordionContent}>{item.content}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <article>
          <PreviewContent
            content={branch.description}
            hideFirstHeading={true}
          />
        </article>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
