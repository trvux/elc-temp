import { normalize } from "@/shared/lib/search-utils";

interface HighlightedTextProps {
  text: string;
  queryTokens: string[];
  className?: string;
}

export function HighlightedText({
  text,
  queryTokens = [],
  className,
}: HighlightedTextProps) {
  if (!queryTokens || !queryTokens.length || !text) {
    return <span className={className}>{text}</span>;
  }
  const normalizedText = normalize(text);
  const ranges: { start: number; end: number }[] = [];

  // 1. Find all matching ranges for each token
  queryTokens.forEach((token) => {
    const normalizedToken = normalize(token);
    if (normalizedToken.length === 0) return;

    let startPos = 0;
    while ((startPos = normalizedText.indexOf(normalizedToken, startPos)) !== -1) {
      ranges.push({ start: startPos, end: startPos + normalizedToken.length });
      startPos += normalizedToken.length;
    }
  });

  if (ranges.length === 0) return <>{text}</>;

  // 2. Sort and merge overlapping or whitespace-separated ranges
  ranges.sort((a, b) => a.start - b.start);
  const mergedRanges: { start: number; end: number }[] = [];
  if (ranges.length > 0) {
    let current = ranges[0];
    for (let i = 1; i < ranges.length; i++) {
      const gapText = text.substring(current.end, ranges[i].start);
      const isOnlyWhitespace = gapText.length > 0 && !gapText.trim();

      if (ranges[i].start <= current.end || isOnlyWhitespace) {
        current.end = Math.max(current.end, ranges[i].end);
      } else {
        mergedRanges.push(current);
        current = ranges[i];
      }
    }
    mergedRanges.push(current);
  }

  // 3. Render segments
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  mergedRanges.forEach((range, i) => {
    // Add non-highlighted text before the match
    if (range.start > lastIndex) {
      result.push(text.substring(lastIndex, range.start));
    }
    // Add highlighted text
    result.push(
      <mark
        key={i}
        className="bg-blue-50 text-blue-700 not-italic px-0.5 rounded-sm"
      >
        {text.substring(range.start, range.end)}
      </mark>
    );
    lastIndex = range.end;
  });

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return <span className={className}>{result}</span>;
}
