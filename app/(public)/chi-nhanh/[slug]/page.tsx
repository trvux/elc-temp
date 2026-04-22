import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import {
  TypographyH1,
  TypographyH4,
  TypographySmall,
} from "@/components/ui/typography";
import { PhoneConfirmation } from "@/components/user/phone-confirmation";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { SEO_CONFIG, extractMetaDescription, generateSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { PreviewContent } from "@/components/user/preview-content";

// Helper to control Google Maps zoom level
const getZoomedUrl = (url: string, zoomLevel = "13.1") => {
  // Thay thế giá trị !4f... bằng giá trị zoom mong muốn
  // 13.1 là mức trung bình, số càng nhỏ thì zoom càng xa, càng lớn thì càng gần
  return url.replace(/!4f[\d.]+/, `!4f${zoomLevel}`);
};

// Design System / Style Constants
const STYLES = {
  main: cn("min-h-screen w-full px-4 py-12 md:px-8"),
  container: cn(
    "mx-auto flex max-w-3xl flex-col items-center justify-center gap-6",
  ),
  title: cn("w-full max-w-none! text-wrap!"),
  section: cn("w-full"), // Giữ nguyên style nhưng loại bỏ flex justify-center thừa khi child là w-full
  accordion: cn("w-full"),
  accordionItem: cn("flex flex-col gap-4 border-b last:border-b-0"),
  accordionContent: cn("text-lg"),
  // prose: cn(
  //   // 1. Reset & Base (Loại bỏ khoảng cách mặc định của thư viện prose)
  //   "prose prose-neutral max-w-none dark:prose-invert",
  //   "prose-p:my-2 prose-headings:my-2 prose-headings:mt-6 prose-blockquote:my-6 prose-ul:my-2 prose-ol:my-2 prose-li:my-2",
  //   "prose-img:my-2 prose-table:my-2",

  //   // 2. Typography H1 (Dựa trên TypographyH1)
  //   "prose-h1:scroll-m-20 prose-h1:text-4xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:text-balance",

  //   // 3. Typography H2 (Dựa trên TypographyH2)
  //   "prose-h2:scroll-m-20 prose-h2:text-3xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:border-b-0",

  //   // 4. Typography H3 & H4
  //   "prose-h3:scroll-m-20 prose-h3:text-2xl prose-h3:font-semibold prose-h3:tracking-tight",
  //   "prose-h4:scroll-m-20 prose-h4:text-xl prose-h4:font-semibold prose-h4:tracking-tight",

  //   // 5. Paragraph & Lead (Dựa trên TypographyP)
  //   "prose-p:leading-7 prose-p:text-foreground/90",

  //   // 6. Blockquote (Dựa trên TypographyBlockquote)
  //   "prose-blockquote:border-l-2 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground",
  //   "prose-blockquote:border-foreground/20",

  //   // 7. Table (Dựa trên TypographyTable & TableCell)
  //   "prose-th:border prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-bold",
  //   "prose-td:border prose-td:px-4 prose-td:py-2 prose-td:text-left",

  //   // 8. Lists (Dựa trên TypographyList)
  //   "prose-ul:list-disc prose-ol:list-decimal",
  //   "prose-li:leading-7",
  //   "prose-li:marker:text-foreground/80",

  //   // 9. Inline Code (Dựa trên TypographyInlineCode)
  //   "prose-code:relative prose-code:rounded prose-code:bg-muted prose-code:px-[0.3rem] prose-code:py-[0.2rem] prose-code:font-mono prose-code:text-sm prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-['']",

  //   // 10. Custom (Giữ lại vẻ cao cấp cho link)
  //   "prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:text-primary/80 transition-colors",
  // ),

  prose: cn("prose prose-neutral max-w-none dark:prose-invert"),

  mapCard: cn("my-2 overflow-hidden p-2 shadow-md bg-background/60"),
  mapIframe: cn(
    "w-full h-full rounded-lg transition-all duration-2000 ease-in-out",
  ),

  footer: cn(
    "mt-10 flex w-full flex-col items-center justify-between gap-10 border-t border-border pt-8 text-muted-foreground md:flex-row",
  ),
};

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("slug")
    .eq("is_published", true);
  return (branches ?? []).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!branch) return { title: SEO_CONFIG.defaultTitle };

  const title =
    // @ts-ignore
    branch.meta_title ||
    `Điện máy ELC - ${branch.name} | ${branch.address}`;
  const description =
    // @ts-ignore
    branch.meta_description || 
    extractMetaDescription(branch.description || "", 160);

  const url = `${SEO_CONFIG.baseUrl}/chi-nhanh/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function BranchDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch current branch data
  const { data: branch } = await supabase
    .from("branches")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!branch) {
    notFound();
  }

  const items = [
    {
      value: "address",
      trigger: "Địa chỉ chi nhánh",
      content: (
        <div>
          <span>{branch.address}</span>
          {branch.maps_embed && (
            <Card className={STYLES.mapCard}>
              <CardContent className="p-0">
                <AspectRatio ratio={16 / 9}>
                  <iframe
                    src={getZoomedUrl(
                      branch.maps_embed.match(/src="([^"]+)"/)?.[1] ||
                        branch.maps_embed,
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
        <PhoneConfirmation phone={branch.phone}>
          <div>{branch.phone}</div>
        </PhoneConfirmation>
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

  const schema = generateSchema("LocalBusiness", {
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    url: `${SEO_CONFIG.baseUrl}/chi-nhanh/${slug}`,
    image: SEO_CONFIG.baseUrl + "/logo.png", // Fallback to logo
  });

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Trang chủ", item: "/" },
    { name: "Chi nhánh", item: "/chi-nhanh" },
    { name: branch.name, item: `/chi-nhanh/${slug}` },
  ]);

  return (
    <main className={STYLES.main}>
      {/* JSON-LD for Branch */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
      )}
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
          <PreviewContent content={branch.description} hideFirstHeading={true} />
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
