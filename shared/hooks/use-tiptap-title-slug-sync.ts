import { useCallback } from "react";
import { UseFormSetValue, UseFormGetValues, FieldValues, Path, PathValue } from "react-hook-form";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/helpers";

interface UseTiptapTitleSlugSyncProps<TFieldValues extends FieldValues> {
  setValue: UseFormSetValue<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  contentField: Path<TFieldValues>;
  titleField: Path<TFieldValues>;
  slugField: Path<TFieldValues>;
  isEditMode?: boolean;
  sanitizeTitle?: (title: string) => string;
}

export function useTiptapTitleSlugSync<TFieldValues extends FieldValues>({
  setValue,
  getValues,
  contentField,
  titleField,
  slugField,
  isEditMode = false,
  sanitizeTitle,
}: UseTiptapTitleSlugSyncProps<TFieldValues>) {
  const handleContentChange = useCallback(
    (value: unknown) => {
      // 1. Sync Tiptap editor JSON to Hook Form field
      setValue(contentField, value as PathValue<TFieldValues, Path<TFieldValues>>, {
        shouldDirty: true,
        shouldValidate: true,
      });

      // 2. Extract first H1 heading from document
      const extractedTitle = extractTitleFromHtml(value);
      if (extractedTitle) {
        // 3. Sync extracted heading to title field
        setValue(titleField, extractedTitle as PathValue<TFieldValues, Path<TFieldValues>>, {
          shouldDirty: true,
          shouldValidate: true,
        });

        // 4. Optionally sanitize title for clean slugs (e.g. stripping category prefixes)
        const sanitized = sanitizeTitle ? sanitizeTitle(extractedTitle) : extractedTitle;

        // 5. Generate and sync SEO-friendly slug
        const currentSlug = getValues(slugField);
        if (!isEditMode || !currentSlug) {
          const generatedSlug = generateSlug(sanitized);
          setValue(slugField, generatedSlug as PathValue<TFieldValues, Path<TFieldValues>>, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      }
    },
    [setValue, getValues, contentField, titleField, slugField, isEditMode, sanitizeTitle]
  );

  return { handleContentChange };
}
