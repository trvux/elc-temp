"use client";

import { Heart, ImageBroken, TrashSimple } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatPrice } from "@/modules/catalog/domain";
import { WishlistButton } from "@/shared/components/organisms/layout/user/wishlist-button";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useWishlist } from "@/shared/providers/wishlist-provider";

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    display_price: number | null;
  } | null;
}

// Single global instance (mounted once in the public layout, next to
// CompareTray) driven entirely by WishlistProvider's isDialogOpen state —
// both the header's WishlistDialogButton trigger and the "Xem danh sách"
// toast action after a wishlist add just flip that same state, so there's
// one dialog/drawer to keep in sync instead of duplicating this content per
// trigger. Dialog on desktop, Drawer on mobile — a bottom sheet reads much
// more natural than a centered modal on a small screen.
export function WishlistDialog() {
  const { isDialogOpen, setDialogOpen, clearAll } = useWishlist();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isDialogOpen) return;

    setIsLoading(true);
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data: { items?: WishlistItem[] }) => setItems(data.items ?? []))
      .finally(() => setIsLoading(false));
  }, [isDialogOpen]);

  const validItems = items.filter((item) => item.product !== null);

  const handleClearAll = () => {
    setItems([]);
    clearAll();
  };

  const body = (
    <>
      {!isLoading && validItems.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Heart />
            </EmptyMedia>
            <EmptyTitle>Chưa có sản phẩm yêu thích</EmptyTitle>
            <EmptyDescription>
              Bấm biểu tượng trái tim trên sản phẩm bất kỳ để lưu vào đây.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {validItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {validItems.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              onNavigate={() => setDialogOpen(false)}
            />
          ))}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DrawerContent className="!z-[300] max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Sản phẩm yêu thích</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">{body}</div>
          {validItems.length > 0 && (
            <DrawerFooter>
              <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={handleClearAll}
              >
                <TrashSimple />
                Xoá tất cả
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="!z-[300] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sản phẩm yêu thích</DialogTitle>
        </DialogHeader>
        {body}
        {validItems.length > 0 && (
          <DialogFooter>
            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={handleClearAll}
            >
              <TrashSimple />
              Xoá tất cả
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

const MAX_IMAGE_RETRIES = 2;

// Wishlist images intermittently fail to load (transient — reopening or
// retrying often succeeds), not a permanently dead URL — so onError
// retries a couple times (remounting via `key` to force a fresh fetch,
// with a short backoff since an instant retry tends to hit the same
// blip) before finally falling back to a neutral ImageBroken placeholder.
function WishlistItemCard({
  item,
  onNavigate,
}: {
  item: WishlistItem;
  onNavigate: () => void;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [imgError, setImgError] = useState(false);
  const product = item.product!;
  const showImage = product.image_url && !imgError;

  const handleError = () => {
    if (retryCount < MAX_IMAGE_RETRIES) {
      setTimeout(() => setRetryCount((n) => n + 1), 400 * (retryCount + 1));
    } else {
      setImgError(true);
    }
  };

  return (
    <div className="relative flex flex-col gap-2 rounded-lg border border-border/40 p-3">
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton productId={item.product_id} />
      </div>
      <Link
        href={`/san-pham/${product.slug}`}
        className="flex flex-col gap-2"
        onClick={onNavigate}
      >
        <div className="flex aspect-video w-full items-center justify-center rounded-md bg-white overflow-hidden">
          {showImage ? (
            <Image
              key={retryCount}
              src={product.image_url}
              alt={product.name}
              width={200}
              height={112}
              className="w-full h-full object-contain"
              onError={handleError}
            />
          ) : (
            <ImageBroken className="size-8 text-muted-foreground/40" />
          )}
        </div>
        <span className="text-sm font-medium line-clamp-2">{product.name}</span>
        <span className="text-sm font-bold text-destructive">
          {product.display_price
            ? formatPrice(product.display_price)
            : "Liên hệ"}
        </span>
      </Link>
    </div>
  );
}
