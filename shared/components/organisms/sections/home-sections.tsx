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

// Full years since COMPANY.founded ("dd/mm/yyyy"), so the copy never goes stale.
function yearsInBusiness(): number {
  const [d, m, y] = COMPANY.founded.split("/").map(Number);
  const now = new Date();
  let years = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) years -= 1;
  return Math.max(years, 0);
}

// Plain-text trust block: service area, commitment, experience. Only facts the
// company has stated (founding date, "TP.HCM và các tỉnh phía Nam", quality and
// reputation as the commitment); no prices, durations or warranty terms.
export function HomeTrust() {
  const years = yearsInBusiness();
  const items = [
    {
      title: "Khu vực phục vụ: TP.HCM và các tỉnh phía Nam",
      text: "ELC nhận khảo sát, tư vấn, cung ứng thiết bị và thi công điều hòa, thông gió cho công trình tại TP.HCM và các tỉnh phía Nam. Biệt thự, nhà phố, căn hộ, văn phòng, nhà hàng, cơ sở kinh doanh, trường học, cơ sở y tế và công trình công nghiệp đều nằm trong phạm vi ELC nhận làm. Địa chỉ văn phòng, kho kỹ thuật và số điện thoại liên hệ có trong trang thông tin của ELC.",
    },
    {
      title: "Cam kết uy tín và chất lượng",
      text: "ELC làm việc theo nguyên tắc uy tín và chất lượng: thiết bị chính hãng từ các thương hiệu như Daikin, LG, Menred, tư vấn đúng nhu cầu và đúng tải lạnh của công trình, thi công theo quy trình kỹ thuật và nghiệm thu bằng văn bản trước khi bàn giao. Khách hàng chỉ ký hợp đồng sau khi đã xem bản vẽ, thiết bị đề xuất và báo giá.",
    },
    {
      title: `Hơn ${years} năm kinh nghiệm thi công điều hòa và thông gió`,
      text: `Công ty thành lập ngày ${COMPANY.founded}. Trong ${years} năm hoạt động, ELC đã thi công nhiều công trình điều hòa trung tâm VRV/VRF, điều hòa multi, split và hệ thống cấp khí tươi thu hồi nhiệt, đồng thời chăm sóc sau bàn giao bằng dịch vụ vệ sinh, bảo trì và sửa chữa. Các công trình tiêu biểu được đăng đầy đủ ở mục dự án.`,
    },
  ];
  return (
    <section aria-labelledby="home-trust" className={SECTION}>
      <SectionHeading
        id="home-trust"
        lead="Ba điều khách hàng thường hỏi trước khi chọn nhà thầu: ELC làm ở đâu, cam kết gì và đã làm được bao lâu."
      >
        Vì sao chọn Điện máy ELC làm nhà thầu điều hòa và thông gió
      </SectionHeading>
      <ul className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="flex">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  <h3>{item.title}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="type-body text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {/* Prose built only from facts already published on the site (service pages,
          project types, brand filters, the 5-step process): no price, duration
          or warranty term. */}
      <div className="mt-10 flex max-w-3xl flex-col gap-4 type-body text-muted-foreground">
        <p>
          Điện máy ELC nhận trọn gói điều hòa không khí và thông gió cho nhiều loại công trình: biệt thự, nhà phố, căn
          hộ chung cư, văn phòng, trụ sở cơ quan, nhà hàng và trung tâm tiệc cưới, cơ sở kinh doanh, cơ sở giáo dục,
          cơ sở y tế, khu vui chơi giải trí và công trình công nghiệp. Mỗi loại công trình có nhu cầu khác nhau về tải
          lạnh, số phòng, mật độ người và chất lượng không khí, nên ELC khảo sát trước rồi mới đề xuất hệ thống phù
          hợp.
        </p>
        <p>
          Về hệ thống, ELC thi công điều hòa trung tâm VRV/VRF, điều hòa multi, máy lạnh treo tường, âm trần, giấu trần
          nối ống gió, áp trần và tủ đứng, cùng hệ thống cấp gió tươi thu hồi nhiệt ERV/HRV. Với phòng kín, nhà hàng
          hay trường học, khí tươi giúp không khí trong nhà không bị ngột trong khi điều hòa vẫn giữ được độ mát.
          ELC cũng cung cấp máy lọc nước RO chính hãng.
        </p>
        <p>
          Thiết bị được cung ứng từ các thương hiệu Daikin, LG, Menred, Panasonic, Mitsubishi, Toshiba, Samsung,
          Midea, Gree, Carrier, Hagisu và Acis, chọn theo tải lạnh và ngân sách của từng công trình. Khách có thể xem
          sản phẩm theo thương hiệu ở mục sản phẩm, hoặc gửi bản vẽ để nhân viên tư vấn đề xuất thiết bị phù hợp.
        </p>
        <p>
          Quy trình làm việc gồm năm bước: khảo sát và tư vấn, thiết kế sơ đồ kỹ thuật, chuẩn bị vật tư, thi công lắp
          đặt, kiểm tra vận hành và nghiệm thu. Tư vấn, tính tải lạnh, bản vẽ, bóc khối lượng, thi công và giám sát
          đều do đội của ELC đảm nhận, nên khách chỉ làm việc với một đầu mối từ lúc nêu nhu cầu đến khi bàn giao.
        </p>
        <p>
          Sau khi bàn giao, ELC tiếp tục đồng hành bằng dịch vụ vệ sinh bảo trì định kỳ, sửa chữa, thu cũ đổi mới và
          cho thuê máy lạnh, áp dụng cho công trình ELC đã thi công và cả máy đang sử dụng. Khu vực phục vụ là TP.HCM
          và các tỉnh phía Nam. Bạn có thể xem các công trình đã hoàn thành ở mục dự án để hình dung kết quả trước
          khi liên hệ.
        </p>
        <h3 className="type-headline text-foreground">Chọn hệ thống điều hòa nào cho công trình</h3>
        <p>
          Công trình có nhiều phòng và cần điều khiển riêng từng khu vực thường phù hợp với điều hòa trung tâm VRV/VRF:
          một cụm dàn nóng nối nhiều dàn lạnh, chạy theo tải thực tế của từng phòng. Nhà ở chỉ có vài phòng thường
          dùng điều hòa multi hoặc máy lạnh split đặt riêng cho từng phòng, gọn hơn và dễ bảo trì hơn.
        </p>
        <p>
          Công suất cần chọn phụ thuộc vào diện tích, chiều cao trần, hướng nắng, số người sử dụng và lượng nhiệt từ
          thiết bị trong phòng, nên chọn theo tính tải lạnh thay vì chỉ theo diện tích. Phòng kín, đông người hoặc có
          nhiều mùi và hơi nóng nên có thêm hệ thống cấp khí tươi thu hồi nhiệt để không khí trong nhà luôn được thay
          mới mà điều hòa không phải gánh thêm tải.
        </p>
      </div>
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
