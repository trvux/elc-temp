"use client";

import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

import { createReviewSchema } from "../../../domain";
import { createReviewAction } from "../../actions";
import { StarRating } from "./StarRating";

type ReviewFormValues = {
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerPhone: string;
  website: string;
};

interface ReviewFormProps {
  productId?: string;
  serviceId?: string;
  entityName: string;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}

// Exactly one of productId/serviceId should be passed; enforced again
// server-side (see elc-go internal/review/domain's chk_review_single_entity).
export function ReviewForm({
  productId,
  serviceId,
  entityName,
  triggerLabel = "Viết đánh giá",
  triggerVariant = "outline",
  className,
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormValues>({
    resolver: standardSchemaResolver(createReviewSchema) as unknown as Resolver<ReviewFormValues>,
    defaultValues: {
      rating: 0,
      comment: "",
      reviewerName: "",
      reviewerPhone: "",
      website: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      createReviewAction({
        ...values,
        productId,
        serviceId,
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Cảm ơn bạn đã đánh giá!", {
        description: "Đánh giá của bạn đã được ghi nhận.",
      });
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", "public", productId ?? serviceId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "summary", productId ?? serviceId] });
    },
    onError: () => {
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={className}>
          <Star size={18} className="mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đánh giá: {entityName}</DialogTitle>
          <DialogDescription>
            Chia sẻ trải nghiệm của bạn để giúp những khách hàng khác.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((v) => submitMutation.mutate(v))}
          className="space-y-6"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Số sao đánh giá</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <StarRating value={field.value} onChange={field.onChange} size={28} />
                  )}
                />
                <FieldError errors={[form.formState.errors.rating]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="review-form-comment">Nội dung đánh giá</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="review-form-comment"
                      rows={4}
                      placeholder="Sản phẩm/dịch vụ này thế nào?"
                    />
                  )}
                />
                <FieldError errors={[form.formState.errors.comment]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="review-form-name">Họ tên</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="reviewerName"
                  render={({ field }) => (
                    <Input {...field} id="review-form-name" placeholder="Nguyễn Văn A" autoComplete="name" />
                  )}
                />
                <FieldError errors={[form.formState.errors.reviewerName]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="review-form-phone">Số điện thoại (không bắt buộc)</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="reviewerPhone"
                  render={({ field }) => (
                    <Input {...field} id="review-form-phone" placeholder="09xx xxx xxx" autoComplete="tel" />
                  )}
                />
              </FieldContent>
            </Field>

            {/* Honeypot: hidden from real visitors, positioned off-screen
                rather than display:none (some bots skip display:none fields
                but still fill absolutely-positioned ones). */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="review-form-website">Website</label>
              <Controller
                control={form.control}
                name="website"
                render={({ field }) => (
                  <input
                    {...field}
                    id="review-form-website"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                )}
              />
            </div>
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={submitMutation.isLoading}>
            {submitMutation.isLoading ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
