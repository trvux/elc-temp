import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { FAQAccordion } from "@/modules/faq/presentation/components/FAQAccordion";
import type { FAQ } from "@/modules/faq/domain/types";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import type { News } from "@/modules/news/domain/types";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";
import type { ProjectWithCategory } from "@/modules/project/domain/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  COMPANY,
  HOME_BRANDS,
  HOME_ENTRIES,
  HOME_FAQS,
  HOME_INTENTS,
  HOME_PROCESS,
} from "@/shared/lib/home-content";

// Built only from shadcn atoms (Card, Badge, Button) and the design-system type
// utilities / color tokens (docs/design-system.md §4, §5): no raw <button>, no
// hex, no arbitrary px. Density is "comfortable" (gap-6 / p-6) per §6.
// All sections are Server Components and receive only the fields they print, so
// the homepage stays small (RFC §5: no product cards, a few dozen links). Each
// section is an <h2> under the hero's single <h1>; card titles are <h3>.

const SECTION = "mx-auto w-full max-w-6xl px-6 py-12 md:py-16";

// Text link = shadcn Button (variant="link") wrapping next/link, never a raw <a>.
function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="link" className="h-auto justify-start px-0 py-0 text-foreground">
      <Link href={href}>
        {children}
        <ArrowRight weight="bold" aria-hidden="true" />
      </Link>
    </Button>
  );
}

function SectionHeading({ id, children, lead }: { id: string; children: React.ReactNode; lead?: string }) {
  return (
    <div className="mb-8 flex max-w-3xl flex-col gap-3 md:mb-10">
      <h2 id={id} className="type-title">
        {children}
      </h2>
      {lead && <p className="type-body text-muted-foreground">{lead}</p>}
    </div>
  );
}

function SectionHeadingRow({ id, children, href, linkLabel }: { id: string; children: React.ReactNode; href: string; linkLabel: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <h2 id={id} className="type-title max-w-3xl">
        {children}
      </h2>
      <ArrowLink href={href}>{linkLabel}</ArrowLink>
    </div>
  );
}

// Answer-first definition of the entity. This is the block an AI answer or a
// featured snippet quotes for "Điện máy ELC là gì / làm gì".
export function HomeAbout({ projectCount }: { projectCount: number }) {
  const facts = [
    { term: "Thành lập", value: COMPANY.founded },
    { term: "Công trình đã đăng", value: projectCount > 0 ? String(projectCount) : "—" },
    { term: "Hệ thống", value: "VRV/VRF, multi, split, khí tươi ERV/HRV" },
    { term: "Hình thức", value: "Tư vấn, thiết kế, cung ứng, thi công" },
  ];
  return (
    <section aria-labelledby="home-about" className={SECTION}>
      <SectionHeading id="home-about">Điện máy ELC là nhà thầu điều hòa và thông gió trọn gói</SectionHeading>
      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4 type-body text-muted-foreground">
          <p>
            <strong className="text-foreground">{COMPANY.brand}</strong> ({COMPANY.legalName}, thành lập{" "}
            {COMPANY.founded}) là nhà thầu EPC chuyên điều hòa không khí và thông gió cơ khí (HVAC/MV&amp;AC): khảo
            sát, thiết kế, cung ứng thiết bị và thi công cho biệt thự, văn phòng, nhà hàng, cơ sở kinh doanh và nhà ở
            tại TP.HCM và các tỉnh phía Nam.
          </p>
          <p>
            Khách chỉ làm việc với một đầu mối. Tư vấn, tính tải lạnh, bản vẽ, bóc khối lượng, thi công và giám sát
            đều do đội của ELC đảm nhận. Thiết bị đến từ {HOME_BRANDS}, chọn theo tải lạnh của từng công trình.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-4 self-start">
          {facts.map((f) => (
            <li key={f.term} className="flex">
              <Card size="sm" className="w-full">
                <CardHeader>
                  <CardDescription>{f.term}</CardDescription>
                  <CardTitle>{f.value}</CardTitle>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeCapabilities() {
  return (
    <section aria-labelledby="home-capabilities" className={SECTION}>
      <SectionHeading
        id="home-capabilities"
        lead="Bốn mảng ELC nhận làm. Mỗi mảng có trang riêng với thông tin chi tiết, giá và dự án thực tế."
      >
        ELC thi công những hệ thống điều hòa và thông gió nào
      </SectionHeading>
      <ul className="grid gap-6 sm:grid-cols-2">
        {HOME_ENTRIES.map((entry) => (
          <li key={entry.title} className="flex">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  <h3>{entry.title}</h3>
                </CardTitle>
                <CardDescription>{entry.text}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto flex-wrap gap-x-6 gap-y-2">
                {entry.links.map((l) => (
                  <ArrowLink key={l.href} href={l.href}>
                    {l.label}
                  </ArrowLink>
                ))}
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Intent router: the visitor names their space, we send them to the service page
// that owns that need and to projects of the same type.
export function HomeIntentRouter() {
  return (
    <section aria-labelledby="home-intent" className={SECTION}>
      <SectionHeading
        id="home-intent"
        lead="Chọn loại công trình gần nhất với bạn để xem giải pháp ELC đề xuất và các công trình đã làm cùng loại."
      >
        Công trình của bạn cần hệ thống điều hòa, thông gió nào
      </SectionHeading>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_INTENTS.map((i) => (
          <li key={i.space} className="flex">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  <h3>{i.space}</h3>
                </CardTitle>
                <CardDescription>{i.need}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto flex-col items-start gap-2">
                <ArrowLink href={i.service.href}>{i.service.label}</ArrowLink>
                <ArrowLink href={i.projects.href}>{i.projects.label}</ArrowLink>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeProcess() {
  return (
    <section aria-labelledby="home-process" className={SECTION}>
      <SectionHeading
        id="home-process"
        lead="Từ lúc bạn nêu nhu cầu đến khi bàn giao, mọi bước đều do ELC phụ trách và có biên bản nghiệm thu bằng văn bản."
      >
        Quy trình nhà thầu EPC chìa khóa trao tay: 5 bước
      </SectionHeading>
      <ol className="grid gap-6 md:grid-cols-5">
        {HOME_PROCESS.map((step, n) => (
          <li key={step.title} className="flex">
            <Card size="sm" className="w-full">
              <CardHeader>
                <Badge variant="secondary" className="mb-2 w-fit">
                  Bước {n + 1}
                </Badge>
                <CardTitle>
                  <h3>{step.title}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="type-body-sm text-muted-foreground">{step.text}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HomeProjects({ projects }: { projects: ProjectWithCategory[] }) {
  if (projects.length === 0) return null;
  return (
    <section aria-labelledby="home-projects" className={SECTION}>
      <SectionHeadingRow id="home-projects" href="/du-an" linkLabel="Xem tất cả dự án">
        Công trình điều hòa và thông gió ELC đã thi công
      </SectionHeadingRow>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id} className="flex flex-col">
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeFaq() {
  const faqs: FAQ[] = HOME_FAQS.map((f, n) => ({
    id: `home-faq-${n}`,
    ownerType: "page",
    ownerId: "home",
    question: f.question,
    answer: f.answer,
    orderIndex: n,
    isPublished: true,
    createdAt: "",
    updatedAt: "",
  }));
  return (
    <div className="px-6 py-12 md:py-16">
      <FAQAccordion faqs={faqs} title="Câu hỏi thường gặp về nhà thầu điều hòa và thông gió" />
    </div>
  );
}

export function HomeNews({ news }: { news: News[] }) {
  if (news.length === 0) return null;
  return (
    <section aria-labelledby="home-news" className={SECTION}>
      <SectionHeadingRow id="home-news" href="/tin-tuc" linkLabel="Xem tất cả bài viết">
        Kiến thức điều hòa, thông gió và khí tươi
      </SectionHeadingRow>
      <ul className="grid gap-6 md:grid-cols-3">
        {news.map((n) => (
          <li key={n.id} className="flex">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="line-clamp-3">
                  <h3>
                    <Link href={`/tin-tuc/${n.slug}`} className="underline-offset-4 hover:underline">
                      {n.title}
                    </Link>
                  </h3>
                </CardTitle>
                {n.excerpt && <CardDescription className="line-clamp-3">{n.excerpt}</CardDescription>}
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeContact() {
  return (
    <section aria-labelledby="home-contact" className={SECTION}>
      <Card className="rounded-3xl bg-muted/30 p-4 md:p-6">
        <CardHeader>
          <CardTitle className="type-title">
            <h2 id="home-contact">Gửi bản vẽ hoặc mô tả công trình để ELC tư vấn</h2>
          </CardTitle>
          <CardDescription className="type-body max-w-2xl">
            Nhân viên tư vấn xem bản vẽ, khảo sát, tính tải lạnh rồi gửi bạn thiết bị đề xuất cùng báo giá. Bạn đồng ý
            rồi mới ký hợp đồng.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-wrap gap-x-6 gap-y-3">
          <LeadForm triggerLabel="Yêu cầu tư vấn" triggerSize="lg" showIcon={false} />
          <ArrowLink href="/thong-tin">Địa chỉ văn phòng và kho kỹ thuật</ArrowLink>
        </CardFooter>
      </Card>
    </section>
  );
}
