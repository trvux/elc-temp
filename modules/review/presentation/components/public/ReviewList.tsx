import { getPublicReviewsAction, getReviewSummaryAction } from "../../actions";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { TypographyH2, TypographySmall } from "@/shared/components/ui/typography";
import { Card, CardContent } from "@/shared/components/ui/card";

interface ReviewListProps {
  productId?: string;
  serviceId?: string;
  entityName: string;
}

// Server component — fetches published reviews + the aggregate summary in
// parallel, renders both the star-rating header and the review feed. Mount
// on product/service detail pages (see app/(public)/san-pham/[slug]/page.tsx
// and app/(public)/dich-vu/[slug]/page.tsx).
export async function ReviewList({ productId, serviceId, entityName }: ReviewListProps) {
  const filter = { productId, serviceId };
  const [{ data: reviews }, { data: summary }] = await Promise.all([
    getPublicReviewsAction(filter),
    getReviewSummaryAction(filter),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
            Đánh giá từ khách hàng
          </TypographyH2>
          {summary.count > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={summary.average} size={20} />
              <span className="text-sm text-muted-foreground">
                {summary.average.toFixed(1)}/5 ({summary.count} đánh giá)
              </span>
            </div>
          ) : (
            <TypographySmall className="text-muted-foreground mt-2 block">
              Chưa có đánh giá nào — hãy là người đầu tiên!
            </TypographySmall>
          )}
        </div>
        <ReviewForm productId={productId} serviceId={serviceId} entityName={entityName} />
      </div>

      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-sm">{review.reviewerName}</span>
                  <StarRating value={review.rating} size={14} />
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {review.comment}
                </p>
                <TypographySmall className="text-muted-foreground/70 text-xs">
                  {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                </TypographySmall>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
