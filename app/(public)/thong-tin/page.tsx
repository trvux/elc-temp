import Link from "next/link";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InfoTOC } from "@/components/user/info-toc";
import { Separator } from "@/components/ui/separator";
import { ScrollToTop } from "@/components/user/scroll-to-top";

export default async function InformationHub() {
  const supabase = await createClient();

  // Fetch all published pages for the TOC
  const { data: allPages } = await supabase
    .from("pages")
    .select("id, title, slug")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (!allPages) {
    return (
      <main className="w-full pt-24 pb-48 px-4 max-w-3xl mx-auto text-center font-sans font-medium">
        <p className="text-muted-foreground/40">Đang tải...</p>
      </main>
    );
  }

  const currentTitle = "Thông tin về ELC";

  return (
    <main className="w-full pt-32 md:38 pb-24 px-4 md:px-6 min-h-screen font-sans tracking-tight">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-8 md:gap-8">
            {/* TOC - First on mobile, Right on Desktop */}
            <div className="order-1 md:order-2 w-full md:w-auto">
              <InfoTOC pages={allPages || []} className="w-full md:w-56" />
            </div>

            {/* Title - Second on mobile, Left on Desktop */}
            <div className="order-2 md:order-1 text-2xl md:text-4xl font-bold capitalize tracking-tight text-foreground opacity-90 truncate">
              {currentTitle}
            </div>
          </div>
        </header>
        <Separator className="mb-12 bg-border/30" />

        <article>
          <div
            className="prose prose-zinc prose-lg md:prose-xl max-w-none 
               font-serif 
               prose-p:leading-[1.65] prose-p:my-10 prose-p:text-lg md:prose-p:text-xl prose-p:text-foreground/90 
               prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground 
               prose-headings:mt-16 prose-headings:mb-6
               prose-a:text-primary prose-a:underline prose-a:underline-offset-4
               prose-img:rounded-none prose-img:w-full prose-img:block prose-img:mx-auto prose-img:my-12"
          >
            <p>
              Chào mừng quý khách đến với không gian thông tin số của ELC. Đây
              là kho lưu trữ minh bạch—nơi vinh danh các giá trị cốt lõi, công
              bố khế ước bảo hành và định hình những triết lý kiến tạo đằng sau
              từng thiết bị.
            </p>

            <h2>Giá trị định danh</h2>
            <p>
              Sự am tường kỹ thuật và phong thái phục vụ là dấu ấn của chúng
              tôi. ELC tuân thủ nghiêm ngặt các quy chuẩn quốc tế, mang đến
              chuyên môn lạnh sâu cùng những giải pháp có hàm lượng thẩm mỹ cao
              nhất cho công trình của bạn.
            </p>

            <h2>Bảo chứng cam kết</h2>
            <div className="not-prose my-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {/* Dark Card */}
                <div className="aspect-square bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-end">
                  <div className="mb-auto">
                    <div className="w-8 h-8 rounded-full border border-primary-foreground/20 flex items-center justify-center">
                      <span className="w-2 h-2 bg-primary-foreground rounded-full text-primary flex items-center justify-center text-[10px]"></span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 tracking-tight">
                    Lifetime Legacy
                  </h3>
                  <p className="text-[13px] text-primary-foreground/60 font-medium leading-[1.6]">
                    Truy cập toàn bộ văn bản thỏa thuận, cam kết bảo hành và đặc
                    quyền bảo dưỡng trọn vòng đời cho sản phẩm của ELC.
                  </p>
                </div>

                {/* Light Card */}
                <div className="aspect-square bg-muted/30 p-8 md:p-10 flex flex-col justify-between">
                  <div className="text-[10px] font-bold capitalize tracking-[0.3em] text-muted-foreground/40">
                    Response Rate
                  </div>
                  <div>
                    <div className="text-5xl md:text-6xl font-black tracking-tighter text-foreground mb-1">
                      100
                      <span className="text-[32px] align-top text-foreground">
                        %
                      </span>
                    </div>
                    <div className="text-4xl md:text-5xl font-black tracking-tighter text-muted-foreground/20 mb-6">
                      SLA
                    </div>
                    <div className="h-px w-full bg-border mb-4"></div>
                    <p className="text-[11px] font-bold text-foreground capitalize tracking-widest">
                      Hỗ trợ tức thời
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p>
              Vui lòng lựa chọn các danh mục tại thanh công cụ phía trên để truy
              xuất các ấn bản thông tin liên quan đến quyền lợi pháp lý, chỉ dẫn
              tương tác và chuẩn mực kỹ thuật.
            </p>
          </div>
        </article>

        <footer className="mt-24 pt-8 border-t border-border flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span>&copy; {new Date().getFullYear()} ELC Information Hub</span>
          <ScrollToTop className="hover:text-foreground transition-colors">
            Trở lên đầu trang
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
