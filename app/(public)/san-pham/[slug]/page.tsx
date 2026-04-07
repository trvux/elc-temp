import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch product data with category
  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("slug", slug)
    .single();

  if (!product) {
    notFound();
  }

  const finalPrice = product.sale_price || product.original_price;

  return (
    <main className="w-full bg-white pt-24 pb-40 font-sans">
      <div className="mx-auto w-full px-container max-w-[1400px]">
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 xl:gap-32">
          
          {/* LEFT: Product Images Area - Slimmer & Centered Look */}
          <div className="lg:w-[55%] space-y-8">
            <div className="relative aspect-[3/4] w-full bg-[#f6f6f6] overflow-hidden">
              {product.images?.[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}
            </div>
            
            {/* Grid for other images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {product.images.slice(1).map((img: string, i: number) => (
                  <div key={i} className="relative aspect-[3/4] bg-[#f6f6f6]">
                    <Image 
                      src={img} 
                      alt={`${product.name} ${i}`} 
                      fill 
                      className="object-cover" 
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information (Sticky & Slim) */}
          <div className="lg:w-[320px] xl:w-[380px] shrink-0 h-fit lg:sticky lg:top-36">
            <div className="space-y-6">
              
              {/* Name & Price with Fluid Typography */}
              <div className="space-y-1">
                <h1 className="text-subtitle font-bold text-zinc-900 leading-tight tracking-tight">
                  {product.name}
                </h1>
                <p className="text-base-fluid font-bold text-zinc-900 tracking-tight">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}
                </p>
              </div>

              <div className="h-px w-full bg-zinc-100 mt-2" />

              {/* SKU & Category */}
              <div className="space-y-6">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] leading-none">
                   {product.categories?.name} | SKU: {product.sku || "0000/000"}
                </div>

                <button className="w-full py-4 border border-zinc-900 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-900 hover:text-white transition-all duration-300">
                  Thêm vào giỏ hàng
                </button>
              </div>

              {/* Technical Specifications */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="pt-8 space-y-5">
                  <h4 className="text-[10px] font-bold text-zinc-900 uppercase tracking-[0.1em]">Thông số kỹ thuật</h4>
                  <div className="space-y-3">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-zinc-50 pb-2">
                        <span className="text-[10px] text-zinc-400 font-medium tracking-[0.05em]">{key}</span>
                        <span className="text-[10px] font-bold text-zinc-900">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description (Product Overview) */}
              <div className="pt-8 space-y-5 border-t border-zinc-50 mt-10">
                <h4 className="text-[10px] font-bold text-zinc-900 uppercase tracking-[0.1em]">Tổng quan sản phẩm</h4>
                <div 
                  className="prose prose-zinc max-w-none 
                    text-base-fluid leading-[1.65] text-zinc-500 font-medium tracking-wide
                    prose-p:mb-4"
                  dangerouslySetInnerHTML={{ __html: product.description || "" }}
                />
              </div>

              {/* Service Links */}
              <div className="pt-12 space-y-3">
                 {['Kiểm tra tình trạng hàng', 'Chính sách vận chuyển & Lắp đặt'].map((item) => (
                   <button key={item} className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-900 hover:opacity-50 underline underline-offset-4">
                     {item}
                   </button>
                 ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
