"use client";

import { useRecentlyViewed } from "@/shared/hooks/use-recently-viewed";
import { useEffect } from "react";

interface TrackProductViewProps {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  salePrice: number;
  originalPrice: number;
  stockStatus: string | null;
}

export function TrackProductView(props: TrackProductViewProps) {
  const { addProduct } = useRecentlyViewed();

  useEffect(() => {
    addProduct(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);

  return null;
}
