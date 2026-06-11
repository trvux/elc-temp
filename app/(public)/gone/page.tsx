import { Button } from "@/shared/components/ui/button";
import { House, ShoppingBag } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function GonePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-background px-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl font-bold text-primary/10 tracking-tighter">
          410
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            Sản phẩm không còn kinh doanh
          </h2>
          <p className="text-muted-foreground">
            Xin lỗi, sản phẩm hoặc nội dung này đã được ELC ngưng cung cấp vĩnh
            viễn. Mời bạn tham khảo những sản phẩm mới nhất của chúng tôi bên
            dưới.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button asChild className="w-full sm:w-auto gap-2">
            <Link href="/">
              <House size={18} />
              Về trang chủ
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
            <Link href="/san-pham">
              <ShoppingBag size={18} />
              Xem sản phẩm mới
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
