import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InfoTOC } from "@/components/user/info-toc";
import { Separator } from "@/components/ui/separator";

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
      <main className="w-full pt-32 pb-24 px-4 max-w-3xl mx-auto text-center font-sans font-medium">
        <p className="text-zinc-300">Đang tải...</p>
      </main>
    );
  }

  const currentTitle = "Thông tin về ELC";

  return (
    <main className="w-full pt-32 pb-24 px-4 min-h-screen bg-white font-sans tracking-tight">
      <div className="max-w-[750px] mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-[13px] font-bold uppercase tracking-widest text-zinc-900 opacity-90 truncate">
            {currentTitle}
          </div>
          <div className="scale-90 origin-left md:origin-right shrink-0">
            <InfoTOC pages={allPages || []} />
          </div>
        </header>
        <Separator className="mb-12 bg-zinc-100" />

        <article className="animate-in fade-in duration-1000 ease-out">
          <div
            className="prose prose-zinc prose-lg md:prose-xl max-w-none 
               font-serif 
               prose-p:leading-[1.65] prose-p:my-10 prose-p:text-[20px] prose-p:text-zinc-800 
               prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900 
               prose-headings:mt-16 prose-headings:mb-6
               prose-a:text-zinc-900 prose-a:underline prose-a:underline-offset-4
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
                <div className="aspect-square bg-zinc-900 text-white p-8 md:p-10 flex flex-col justify-end">
                  <div className="mb-auto">
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full text-zinc-900 flex items-center justify-center text-[10px]"></span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 tracking-tight">
                    Lifetime Legacy
                  </h3>
                  <p className="text-[13px] text-zinc-400 font-medium leading-[1.6]">
                    Truy cập toàn bộ văn bản thỏa thuận, cam kết bảo hành và đặc
                    quyền bảo dưỡng trọn vòng đời cho sản phẩm của ELC.
                  </p>
                </div>

                {/* Light Card */}
                <div className="aspect-square bg-[#f4f4f4] p-8 md:p-10 flex flex-col justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
                    Response Rate
                  </div>
                  <div>
                    <div className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 mb-1">
                      100
                      <span className="text-[32px] align-top text-zinc-900">
                        %
                      </span>
                    </div>
                    <div className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-300 mb-6">
                      SLA
                    </div>
                    <div className="h-px w-full bg-zinc-200 mb-4"></div>
                    <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest">
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

        <Separator className="mt-40 mb-10 bg-zinc-100" />
        
        <footer className="flex items-center justify-between text-[12px] text-zinc-400 font-medium">
          <span>&copy; {new Date().getFullYear()} ELC Information Hub</span>
          <a href="#" className="hover:text-zinc-900 transition-colors">
            Trở lên đầu trang
          </a>
        </footer>
      </div>
    </main>
  );
}
