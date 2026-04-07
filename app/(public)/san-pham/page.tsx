import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function ProductsHub() {
  const supabase = await createClient();

  // Fetch all published products
  const { data: allProducts } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("is_published", true)
    .order("order_index");

  const products = allProducts || [];

  return (
    <main className="w-full bg-white pt-24 pb-48 font-sans">
      {/* Centered Container with Fluid Padding */}
      <div className="mx-auto w-full px-container max-w-[1400px]">
        
        {/* Clean Header - Centered */}
        <header className="py-20 flex flex-col items-center text-center space-y-4">
          <h1 className="text-[clamp(24px,3vw,40px)] font-bold tracking-tight text-zinc-900">
            Giải Pháp Thông Minh
          </h1>
          <p className="text-[clamp(12px,1.2vw,14px)] text-zinc-500 tracking-widest uppercase font-medium">
            {products.length} Giải pháp chuyên nghiệp
          </p>
        </header>

        {/* Zara Editorial Grid - Much more spacious */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 md:gap-x-12 xl:gap-x-16 gap-y-24 md:gap-y-32 lg:gap-y-40">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/san-pham/${product.slug}`}
              className="group flex flex-col"
            >
              {/* Image with Zara Aspect Ratio */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#f9f9f9]">
                {product.images?.[0] ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px] font-bold uppercase tracking-[0.3em]">
                    Ảnh SP
                  </div>
                )}
              </div>
              
              {/* Info with refined spacing */}
              <div className="mt-6 flex flex-col space-y-1.5 px-0.5">
                <div className="flex justify-between items-baseline gap-4">
                  <h3 className="text-[clamp(12px,1.2vw,16px)] font-bold text-zinc-900 leading-tight tracking-tight lowercase first-letter:uppercase">
                    {product.name}
                  </h3>
                </div>
                <div className="flex justify-between items-center">
                   <span className="font-bold text-zinc-900 tracking-tight text-[clamp(11px,1vw,14px)]">
                     {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sale_price || product.original_price)}
                   </span>
                   <span className="text-zinc-500 font-bold tracking-tight text-[clamp(11px,1vw,14px)] lowercase">
                     {product.sku || "0000/000"}
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
