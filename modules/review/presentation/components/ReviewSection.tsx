import { Review, ReviewAggregate, ReviewEntityType } from "@/modules/review/domain";
import { ReviewFormSheet } from "@/modules/review/presentation/components/ReviewFormSheet";
import { StarRating } from "@/shared/components/ui/star-rating";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import { Star } from "@phosphor-icons/react/dist/ssr";

interface ReviewSectionProps {
  entityType: ReviewEntityType;
  entityId: string;
  entityName: string;
  entityImage?: string | null;
  reviews: Review[];
  aggregate: ReviewAggregate;
}

// Standalone section (not a tab) — reusable later for project/service/news
// detail pages, product page wires it first. Rating summary + submission
// trigger up top, published reviews listed below.
export function ReviewSection({ entityType, entityId, entityName, entityImage, reviews, aggregate }: ReviewSectionProps) {
  return (
    <section aria-labelledby="reviews-heading" className="w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="reviews-heading" className="type-title">
            Đánh giá {entityName}
          </h2>
          {aggregate.count > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={aggregate.average} size="lg" />
              <span className="type-body-strong">{aggregate.average.toFixed(1)}</span>
              <span className="type-caption text-muted-foreground">
                ({aggregate.count} đánh giá)
              </span>
            </div>
          )}
        </div>
        <ReviewFormSheet
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          entityImage={entityImage}
          ratingAverage={aggregate.average}
          ratingCount={aggregate.count}
        />
      </div>

      {reviews.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Star aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Chưa có đánh giá nào</EmptyTitle>
            <EmptyDescription>
              Hãy là người đầu tiên đánh giá {entityName}.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/50 bg-white/50">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="type-caption">{r.reviewerName}</span>
                <time dateTime={r.createdAt} className="type-caption text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </time>
              </div>
              <StarRating value={r.rating} size="sm" />
              <p className="type-body-sm text-muted-foreground whitespace-pre-line">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
