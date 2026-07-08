"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { Review } from "../../domain";
import {
  deleteReviewAction,
  getReviewsAction,
  updateReviewPublishedAction,
} from "../actions";
import { getReviewColumns } from "./ReviewColumns";

export function ReviewManagement() {
  const queryClient = useQueryClient();
  const [filterPublished, setFilterPublished] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", "admin", filterPublished],
    queryFn: async () => {
      const { data, error } = await getReviewsAction(
        filterPublished === "all" ? undefined : { isPublished: filterPublished === "published" },
      );
      if (error) throw new Error(error);
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (review: Review) => updateReviewPublishedAction(review.id, !review.isPublished),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã cập nhật trạng thái đánh giá");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReviewAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa đánh giá");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const columns = useMemo(
    () =>
      getReviewColumns({
        onTogglePublished: (review) => toggleMutation.mutate(review),
        onDelete: setDeletingId,
      }),
    [toggleMutation],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đánh giá</h1>
          <p className="text-sm text-muted-foreground">
            Kiểm duyệt đánh giá sản phẩm/dịch vụ do khách hàng gửi từ website.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={filterPublished} onValueChange={setFilterPublished}>
          <SelectTrigger className="w-full md:w-55">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="published">Đang hiển thị</SelectItem>
            <SelectItem value="hidden">Đã ẩn (chờ kiểm duyệt)</SelectItem>
          </SelectContent>
        </Select>

        {filterPublished !== "all" && (
          <Button
            variant="ghost"
            onClick={() => setFilterPublished("all")}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        isLoading={isLoading}
        searchKey="reviewerName"
        searchPlaceholder="Tìm theo tên người gửi..."
      />

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
