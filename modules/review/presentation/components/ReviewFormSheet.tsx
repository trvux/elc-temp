"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { Star } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createReviewSchema, ReviewEntityType } from "@/modules/review/domain";
import { createReviewAction } from "@/modules/review/presentation/actions";
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
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { StarRating, StarRatingInput } from "@/shared/components/ui/star-rating";
import { Textarea } from "@/shared/components/ui/textarea";
import { useIsMobile } from "@/shared/hooks/use-mobile";

type ReviewFormValues = {
  rating: number;
  reviewerName: string;
  reviewerPhone: string;
  comment: string;
  website: string;
};

interface ReviewFormSheetProps {
  entityType: ReviewEntityType;
  entityId: string;
  entityName: string;
  entityImage?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
  triggerLabel?: string;
  className?: string;
}

// Trigger + responsive Drawer(mobile)/Dialog(desktop) submission sheet —
// same useIsMobile() split as shared/components/layout/user/wishlist-dialog.tsx,
// same react-hook-form + zod + honeypot + mutation shape as
// modules/inquiry/presentation/components/LeadForm.tsx. Submit button lives
// in DrawerFooter/DialogFooter so it stays pinned at the bottom of the sheet.
export function ReviewFormSheet({
  entityType,
  entityId,
  entityName,
  entityImage,
  ratingAverage = 0,
  ratingCount = 0,
  triggerLabel = "Đánh giá sản phẩm",
  className,
}: ReviewFormSheetProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

  const form = useForm<ReviewFormValues>({
    resolver: standardSchemaResolver(createReviewSchema) as unknown as Resolver<ReviewFormValues>,
    defaultValues: {
      rating: 0,
      reviewerName: "",
      reviewerPhone: "",
      comment: "",
      website: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      createReviewAction({ ...values, entityType, entityId }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Cảm ơn bạn đã đánh giá!", {
        description: "Đánh giá của bạn đã được đăng công khai.",
      });
      form.reset();
      setOpen(false);
      router.refresh();
    },
    onError: () => {
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    },
  });

  // Fields only — no submit button here. It lives in DrawerFooter/
  // DialogFooter instead (a sibling, not a descendant of this scrollable
  // area) so it stays visually pinned at the bottom of the sheet; both are
  // still wrapped in one <form> below so the footer button submits it.
  const fields = (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white">
          {entityImage ? (
            <Image src={entityImage} alt={entityName} fill className="object-contain p-1.5" />
          ) : null}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold line-clamp-2">{entityName}</span>
          {ratingCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <StarRating value={ratingAverage} size="sm" />
              <span className="text-xs font-medium text-foreground">{ratingAverage.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({ratingCount} đánh giá)</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Chưa có đánh giá nào</span>
          )}
        </div>
      </div>

      <FieldGroup className="gap-4 md:gap-7">
        <Field>
          <FieldLabel className="text-center justify-center">Sản phẩm này có tốt không?</FieldLabel>
          <FieldContent>
            <Controller
              control={form.control}
              name="rating"
              render={({ field }) => (
                <StarRatingInput value={field.value} onChange={field.onChange} className="mx-auto" />
              )}
            />
            <FieldError errors={[form.formState.errors.rating]} />
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
          <FieldLabel htmlFor="review-form-phone">Số điện thoại</FieldLabel>
          <FieldContent>
            <Controller
              control={form.control}
              name="reviewerPhone"
              render={({ field }) => (
                <Input {...field} id="review-form-phone" placeholder="09xx xxx xxx" autoComplete="tel" />
              )}
            />
            <FieldError errors={[form.formState.errors.reviewerPhone]} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="review-form-comment">Nội dung đánh giá</FieldLabel>
          <FieldContent>
            <Controller
              control={form.control}
              name="comment"
              render={({ field }) => (
                <Textarea {...field} id="review-form-comment" rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." />
              )}
            />
            <FieldError errors={[form.formState.errors.comment]} />
          </FieldContent>
        </Field>

        {/* Honeypot: hidden from real visitors, positioned off-screen rather
            than display:none (some bots skip display:none fields but still
            fill absolutely-positioned ones). */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="review-form-website">Website</label>
          <Controller
            control={form.control}
            name="website"
            render={({ field }) => (
              <input {...field} id="review-form-website" tabIndex={-1} autoComplete="off" />
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );

  const submitButton = (
    <Button type="submit" className="w-full" disabled={submitMutation.isLoading}>
      {submitMutation.isLoading ? "Đang gửi..." : "Gửi đánh giá"}
    </Button>
  );

  const trigger = (
    <Button type="button" variant="outline" className={className} onClick={() => setOpen(true)}>
      <Star weight="fill" className="text-amber-400" />
      {triggerLabel}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        {/* repositionInputs=false: vaul's own keyboard-avoidance JS assumes
            window.innerHeight stays fixed while the keyboard opens, but
            app/layout.tsx sets viewport interactiveWidget="resizes-content"
            so innerHeight shrinks too — the two fight and the drawer
            jumps/covers the input while typing on mobile. */}
        <Drawer open={open} onOpenChange={setOpen} repositionInputs={false}>
          <DrawerContent className="z-120 max-h-[90vh]">
            <form
              onSubmit={form.handleSubmit((v) => submitMutation.mutate(v))}
              className="flex flex-col overflow-hidden"
            >
              <DrawerHeader>
                <DrawerTitle>Đánh giá sản phẩm</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-4">{fields}</div>
              <DrawerFooter>{submitButton}</DrawerFooter>
            </form>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={form.handleSubmit((v) => submitMutation.mutate(v))}>
            <DialogHeader>
              <DialogTitle>Đánh giá sản phẩm</DialogTitle>
            </DialogHeader>
            <div className="py-4">{fields}</div>
            <DialogFooter>{submitButton}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
