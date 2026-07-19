"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { DataTable } from "@/shared/components/ui/data-table";
import { StarRating } from "@/shared/components/ui/star-rating";
import { TypographySmall } from "@/shared/components/ui/typography";

import { AdminReview } from "../../domain";
import { getAdminReviewsAction } from "../actions";
import { getReviewColumns } from "./ReviewColumns";

export function ReviewManagement() {
  const [activeReview, setActiveReview] = useState<AdminReview | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await getAdminReviewsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const columns = useMemo(() => getReviewColumns({ onView: setActiveReview }), []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Đánh giá sản phẩm
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách đánh giá khách hàng gửi từ website, kèm số điện thoại để liên hệ khi cần.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        isLoading={isLoading}
        searchKey="reviewerName"
        searchPlaceholder="Tìm theo tên khách hàng..."
      />

      <AdminDialog
        open={!!activeReview}
        onOpenChange={(open) => !open && setActiveReview(null)}
        size="lg"
        title="Chi tiết đánh giá"
        description={
          activeReview
            ? `${activeReview.reviewerName}${activeReview.reviewerPhone ? ` — ${activeReview.reviewerPhone}` : ""}`
            : undefined
        }
        showCloseButton
      >
        {activeReview && (
          <div className="space-y-6">
            {activeReview.productName && (
              <div>
                <TypographySmall className="text-muted-foreground">
                  Sản phẩm được đánh giá
                </TypographySmall>
                {activeReview.productId ? (
                  <Link
                    href={`/admin/products/${activeReview.productId}`}
                    className="mt-1 block text-sm text-primary hover:underline"
                  >
                    {activeReview.productName}
                  </Link>
                ) : (
                  <p className="mt-1 text-sm">{activeReview.productName}</p>
                )}
              </div>
            )}

            <div>
              <TypographySmall className="text-muted-foreground">Đánh giá</TypographySmall>
              <StarRating value={activeReview.rating} size="lg" className="mt-1" />
            </div>

            <div>
              <TypographySmall className="text-muted-foreground">Nội dung</TypographySmall>
              <p className="text-sm whitespace-pre-wrap">{activeReview.comment}</p>
            </div>

            <div>
              <TypographySmall className="text-muted-foreground">Trạng thái</TypographySmall>
              <div className="mt-1">
                <Badge variant={activeReview.isPublished ? "default" : "secondary"}>
                  {activeReview.isPublished ? "Hiển thị công khai" : "Đã ẩn"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
