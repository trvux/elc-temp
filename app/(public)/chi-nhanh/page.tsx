import React from "react";
import { createClient } from "@/lib/supabase/server";
import { BranchTOC } from "@/components/user/branch-toc";
import { Separator } from "@/components/ui/separator";

export default async function BranchesHub() {
  const supabase = await createClient();

  // Fetch all published branches for the TOC
  const { data: allBranches } = await supabase
    .from("branches")
    .select("id, name, slug")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (!allBranches) {
    return (
      <main className="w-full pt-32 pb-24 px-4 max-w-3xl mx-auto text-center font-sans font-medium">
        <p className="text-zinc-300">Đang tải chi nhánh...</p>
      </main>
    );
  }

  const currentTitle = "Cơ sở hạ tầng";

  return (
    <main className="w-full pt-32 pb-24 px-4 min-h-screen bg-white font-sans tracking-tight">
      <div className="max-w-[750px] mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-[13px] font-bold uppercase tracking-widest text-zinc-900 opacity-90 truncate">
            {currentTitle}
          </div>
          <div className="scale-90 origin-left md:origin-right shrink-0">
            <BranchTOC branches={allBranches || []} />
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
              Hệ thống không gian trưng bày và trạm dịch vụ của ELC được mở rộng
              trên toàn quốc với triết lý kiến tạo giá trị đồng nhất. Chúng tôi
              mang đến quy chuẩn dịch vụ cao cấp, đảm bảo sự tinh tế và chính
              xác trong từng điểm chạm với khách hàng.
            </p>

            <h2>Định vị không gian</h2>
            <p>
              Mỗi văn phòng đại diện là một hệ sinh thái hoàn chỉnh—quy tụ đội
              ngũ kỹ sư chuyên môn sâu, hạ tầng vận hành hiện đại và danh mục
              linh kiện chính hãng. Vui lòng sử dụng hệ thống điều hướng bên
              trên để xác định bản đồ di chuyển đến không gian gần nhất.
            </p>

            <h2>Trải nghiệm đặc quyền</h2>

            {/* Premium UI Cards - Escaping prose formatting */}
            <div className="not-prose my-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {/* Dark Card */}
                <div className="aspect-square bg-zinc-900 text-white p-8 md:p-10 flex flex-col justify-end">
                  <div className="mb-auto">
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 tracking-tight">
                    Tư vấn chuyên sâu
                  </h3>
                  <p className="text-[13px] text-zinc-400 font-medium leading-[1.6]">
                    Nhận bản khái toán chi phí chuyên nghiệp và hoạch định những
                    giải pháp điều hòa không khí tối ưu nhất từ hệ thống chuyên
                    gia.
                  </p>
                </div>

                {/* Light Card */}
                <div className="aspect-square bg-[#f4f4f4] p-8 md:p-10 flex flex-col justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
                    Thời gian hoạt động
                  </div>
                  <div>
                    <div className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 mb-1">
                      08:00
                    </div>
                    <div className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-300 mb-6">
                      17:30
                    </div>
                    <div className="h-px w-full bg-zinc-200 mb-4"></div>
                    <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest">
                      Thứ Hai &mdash; Thứ Bảy
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p>
              Trân trọng kính mời quý đối tác và khách hàng ghé thăm trực tiếp
              các trung tâm dịch vụ. Tại đây, quý vị sẽ được vận hành thiết bị
              thực tế để có trải nghiệm trực quan nhất trước khi quyết định
              phương án đầu tư.
            </p>
          </div>
        </article>

        <Separator className="mt-40 mb-10 bg-zinc-100" />
        
        <footer className="flex items-center justify-between text-[12px] text-zinc-400 font-medium">
          <span>&copy; {new Date().getFullYear()} ELC Architecture</span>
          <a href="#" className="hover:text-zinc-900 transition-colors">
            Trở lên đầu trang
          </a>
        </footer>
      </div>
    </main>
  );
}
