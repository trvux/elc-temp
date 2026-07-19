"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { PRODUCT_STATUS, PRODUCT_STATUS_MAP, ProductStatus } from "@/modules/catalog/domain";
import {
  submitProductForReviewAction,
  approveProductAction,
  rejectProductAction,
  archiveProductAction,
  unarchiveProductAction,
} from "../../actions";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductStatusCardProps {
  form: UseFormReturn<ProductFormValues>;
  // null while creating a brand-new, not-yet-saved product — the workflow
  // buttons only make sense once the product actually exists server-side
  // (it starts as draft automatically, see domain.NewProduct).
  productId: string | null;
  status: ProductStatus;
  rejectionReason?: string | null;
  // Mirrors elc-go's authdomain.CanPublishContent — only an owner/admin can
  // approve/reject/archive/unarchive; an employee (RoleUser) can only submit
  // a draft for review.
  canPublish: boolean;
  onStatusChange: (next: { status: ProductStatus; rejectionReason: string | null }) => void;
}

export function ProductStatusCard({
  form,
  productId,
  status,
  rejectionReason,
  canPublish,
  onStatusChange,
}: ProductStatusCardProps) {
  const queryClient = useQueryClient();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  function handleResult(res: { data: { status: ProductStatus; rejectionReason?: string | null } | null; error: string | null }, successMessage: string) {
    if (res.error || !res.data) {
      toast.error(res.error || "Đã có lỗi xảy ra");
      return;
    }
    toast.success(successMessage);
    onStatusChange({ status: res.data.status, rejectionReason: res.data.rejectionReason ?? null });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  const submitMutation = useMutation({
    mutationFn: () => submitProductForReviewAction(productId!),
    onSuccess: (res) => handleResult(res, "Đã gửi duyệt"),
  });
  const approveMutation = useMutation({
    mutationFn: () => approveProductAction(productId!),
    onSuccess: (res) => handleResult(res, "Đã duyệt sản phẩm"),
  });
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectProductAction(productId!, reason),
    onSuccess: (res) => {
      handleResult(res, "Đã từ chối sản phẩm");
      setShowRejectInput(false);
      setRejectReason("");
    },
  });
  const archiveMutation = useMutation({
    mutationFn: () => archiveProductAction(productId!),
    onSuccess: (res) => handleResult(res, "Đã ngừng bán sản phẩm"),
  });
  const unarchiveMutation = useMutation({
    mutationFn: () => unarchiveProductAction(productId!),
    onSuccess: (res) => handleResult(res, "Đã mở bán lại sản phẩm"),
  });

  const anyPending =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    archiveMutation.isPending ||
    unarchiveMutation.isPending;

  return (
    <FieldGroup className="gap-5">
      {productId ? (
        <Field className="border p-3 rounded-lg gap-3">
          <div className="flex items-center justify-between">
            <FieldLabel className="font-normal mb-0">Trạng thái</FieldLabel>
            <Badge variant="outline">{PRODUCT_STATUS_MAP[status]}</Badge>
          </div>

          {status === PRODUCT_STATUS.DRAFT && rejectionReason && (
            <FieldDescription className="text-destructive">
              Bị từ chối: {rejectionReason}
            </FieldDescription>
          )}

          <div className="flex flex-wrap gap-2">
            {status === PRODUCT_STATUS.DRAFT && (
              <Button
                type="button"
                size="sm"
                disabled={anyPending}
                onClick={() => submitMutation.mutate()}
              >
                Gửi duyệt
              </Button>
            )}

            {status === PRODUCT_STATUS.PROPOSED && canPublish && !showRejectInput && (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={anyPending}
                  onClick={() => approveMutation.mutate()}
                >
                  Duyệt
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={anyPending}
                  onClick={() => setShowRejectInput(true)}
                >
                  Từ chối
                </Button>
              </>
            )}

            {status === PRODUCT_STATUS.PROPOSED && !canPublish && (
              <FieldDescription>Đang chờ chủ/quản lý duyệt.</FieldDescription>
            )}

            {status === PRODUCT_STATUS.PUBLISHED && canPublish && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={anyPending}
                onClick={() => archiveMutation.mutate()}
              >
                Ngừng bán
              </Button>
            )}

            {status === PRODUCT_STATUS.ARCHIVED && canPublish && (
              <Button
                type="button"
                size="sm"
                disabled={anyPending}
                onClick={() => unarchiveMutation.mutate()}
              >
                Mở bán lại
              </Button>
            )}
          </div>

          {showRejectInput && (
            <div className="flex flex-col gap-2">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Lý do từ chối, để nhân viên biết cần sửa gì..."
                className="min-h-15"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={anyPending || !rejectReason.trim()}
                  onClick={() => rejectMutation.mutate(rejectReason.trim())}
                >
                  Xác nhận từ chối
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectReason("");
                  }}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </Field>
      ) : (
        <FieldDescription>Sản phẩm mới luôn bắt đầu ở trạng thái Nháp — gửi duyệt sau khi tạo.</FieldDescription>
      )}

      <Controller
        control={form.control}
        name="isFeatured"
        render={({ field }) => (
          <Field orientation="horizontal" className="justify-between border p-3 rounded-lg">
            <FieldLabel className="font-normal mb-0">Sản phẩm nổi bật</FieldLabel>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="orderIndex"
        render={({ field }) => (
          <Field>
            <FieldLabel>Thứ tự hiển thị</FieldLabel>
            <Input type="number" {...field} onFocus={(e) => e.target.select()} />
            <FieldDescription>Thứ tự sắp xếp hiển thị của sản phẩm</FieldDescription>
          </Field>
        )}
      />
    </FieldGroup>
  );
}
