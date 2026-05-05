import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Home, ShoppingBag } from "lucide-react";

export default function GonePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-cream px-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl font-bold text-primary/10 tracking-tighter">410</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Sản phẩm không còn kinh doanh</h2>
          <p className="text-muted-foreground">
            Xin lỗi, sản phẩm hoặc nội dung này đã được ELC ngưng cung cấp vĩnh viễn. 
            Mời bạn tham khảo những sản phẩm mới nhất của chúng tôi bên dưới.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/">
            <Button className="w-full sm:w-auto gap-2">
              <Home size={18} />
              Về trang chủ
            </Button>
          </Link>
          <Link href="/san-pham">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <ShoppingBag size={18} />
              Xem sản phẩm mới
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
