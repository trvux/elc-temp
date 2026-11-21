import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { FAQAccordion } from "@/modules/faq/presentation/components/FAQAccordion";
import type { FAQ } from "@/modules/faq/domain/types";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import type { News } from "@/modules/news/domain/types";
import { ProjectCard } from "@/modules/project/presentation/components/ProjectCard";
import type { ProjectWithCategory } from "@/modules/project/domain/types";
import {
  COMPANY,
  HOME_BRANDS,
  HOME_ENTRIES,
  HOME_FAQS,
  HOME_INTENTS,
  HOME_PROCESS,
} from "@/shared/lib/home-content";

// All sections are Server Components and receive only the few fields they print,
// so the homepage stays small (RFC §5: HTML < 400KB, no product cards, a few
// dozen links). Each section is an <h2> under the hero's single <h1>.

const SECTION = "mx-auto w-full max-w-6xl px-6 py-12 md:py-16";
const LINK =
  "inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline";

function SectionHeading({ id, children, lead }: { id: string; children: React.ReactNode; lead?: string }) {
  return (
    <div className="mb-8 max-w-3xl space-y-3 md:mb-10">
      <h2 id={id} className="type-title">
        {children}
      </h2>
      {lead && <p className="type-body text-muted-foreground">{lead}</p>}
    </div>
  );
}

// Answer-first definition of the entity. This is the block an AI answer or a
// featured snippet quotes for "Điện máy ELC là gì / làm gì".
export function HomeAbout({ projectCount }: { projectCount: number }) {
  return (
    <section aria-labelledby="home-about" className={SECTION}>
      <SectionHeading id="home-about">Điện máy ELC là nhà thầu điều hòa và thông gió trọn gói</SectionHeading>
      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4 type-body text-muted-foreground">
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
        <dl className="grid grid-cols-2 gap-3 self-start">
          <Fact term="Thành lập" value={COMPANY.founded} />
          <Fact term="Công trình đã đăng" value={projectCount > 0 ? String(projectCount) : "—"} />
          <Fact term="Hệ thống" value="VRV/VRF, multi, split, khí tươi ERV/HRV" />
          <Fact term="Hình thức" value="Tư vấn, thiết kế, cung ứng, thi công" />
        </dl>
      </div>
    </section>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <dt className="type-label text-muted-foreground">{term}</dt>
      <dd className="type-body-strong mt-1">{value}</dd>
    </div>
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
      <ul className="grid gap-4 sm:grid-cols-2">
        {HOME_ENTRIES.map((entry) => (
          <li key={entry.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-6">
            <h3 className="type-body-strong">{entry.title}</h3>
            <p className="type-body-sm text-muted-foreground">{entry.text}</p>
            <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {entry.links.map((l) => (
                <Link key={l.href} href={l.href} className={LINK}>
                  {l.label}
                  <ArrowRight weight="bold" aria-hidden="true" />
                </Link>
              ))}
            </div>
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_INTENTS.map((i) => (
          <li key={i.space} className="flex flex-col gap-3 rounded-2xl border border-border p-6">
            <h3 className="type-body-strong">{i.space}</h3>
            <p className="type-body-sm text-muted-foreground">{i.need}</p>
            <div className="mt-auto flex flex-col gap-2 pt-2">
              <Link href={i.service.href} className={LINK}>
                {i.service.label}
                <ArrowRight weight="bold" aria-hidden="true" />
              </Link>
              <Link href={i.projects.href} className={LINK}>
                {i.projects.label}
                <ArrowRight weight="bold" aria-hidden="true" />
              </Link>
            </div>
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
      <ol className="grid gap-4 md:grid-cols-5">
        {HOME_PROCESS.map((step, n) => (
          <li key={step.title} className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-5">
            <span className="type-label text-muted-foreground">Bước {n + 1}</span>
            <h3 className="type-body-strong">{step.title}</h3>
            <p className="type-body-sm text-muted-foreground">{step.text}</p>
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <h2 id="home-projects" className="type-title max-w-3xl">
          Công trình điều hòa và thông gió ELC đã thi công
        </h2>
        <Link href="/du-an" className={LINK}>
          Xem tất cả dự án
          <ArrowRight weight="bold" aria-hidden="true" />
        </Link>
      </div>
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
    ownerType: "page" as FAQ["ownerType"],
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <h2 id="home-news" className="type-title">
          Kiến thức điều hòa, thông gió và khí tươi
        </h2>
        <Link href="/tin-tuc" className={LINK}>
          Xem tất cả bài viết
          <ArrowRight weight="bold" aria-hidden="true" />
        </Link>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {news.map((n) => (
          <li key={n.id} className="rounded-2xl border border-border p-6">
            <h3 className="type-body-strong line-clamp-3">
              <Link href={`/tin-tuc/${n.slug}`} className="hover:underline underline-offset-4">
                {n.title}
              </Link>
            </h3>
            {n.excerpt && <p className="type-body-sm mt-2 line-clamp-3 text-muted-foreground">{n.excerpt}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeContact() {
  return (
    <section aria-labelledby="home-contact" className={SECTION}>
      <div className="flex flex-col items-start gap-4 rounded-3xl border border-border bg-muted/30 p-8 md:p-12">
        <h2 id="home-contact" className="type-title max-w-3xl">
          Gửi bản vẽ hoặc mô tả công trình để ELC tư vấn
        </h2>
        <p className="type-body max-w-2xl text-muted-foreground">
          Nhân viên tư vấn xem bản vẽ, khảo sát, tính tải lạnh rồi gửi bạn thiết bị đề xuất cùng báo giá. Bạn đồng ý
          rồi mới ký hợp đồng.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <LeadForm triggerLabel="Yêu cầu tư vấn" triggerSize="lg" showIcon={false} />
          <Link href="/thong-tin" className={LINK}>
            Địa chỉ văn phòng và kho kỹ thuật
            <ArrowRight weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
