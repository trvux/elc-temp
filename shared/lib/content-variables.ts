import { formatCurrency } from "@/shared/lib/format";

/**
 * Content variables stand in for a number that would otherwise get
 * hardcoded into SEO copy (product count, price range for a
 * category/brand/group) and drift the moment the catalog changes — e.g.
 * "130 sản phẩm" going stale the day a product is added or removed. A
 * Tiptap "contentVariable" node (see tiptap-content-variable.ts) carries
 * only the *scope* (metric + group/category/brand slug); this file walks a
 * stored Tiptap JSON doc, resolves those scopes against the live catalog,
 * and rewrites a throwaway copy of the doc with the resolved text — the
 * stored doc in the DB never carries a resolved value, only the scope.
 */

export type ContentVariableMetric = "count" | "priceMin" | "priceMax";

export interface ContentVariableFilter {
  groupSlug?: string;
  categorySlug?: string;
  brandSlug?: string;
}

export interface ContentVariableRequest {
  id: string;
  metric: ContentVariableMetric;
  filter: ContentVariableFilter;
}

interface TiptapNodeLike {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNodeLike[];
  [key: string]: unknown;
}

function isTiptapNode(value: unknown): value is TiptapNodeLike {
  return !!value && typeof value === "object";
}

/**
 * Walks the doc collecting every contentVariable node, assigning each
 * occurrence a stable positional id ("cv-0", "cv-1", ...) — used only to
 * match the resolve response back to the right node within this one call,
 * never persisted or sent anywhere else.
 */
export function collectContentVariables(doc: unknown): ContentVariableRequest[] {
  const out: ContentVariableRequest[] = [];
  let index = 0;

  function walk(node: TiptapNodeLike) {
    if (node.type === "contentVariable") {
      const attrs = node.attrs ?? {};
      out.push({
        id: `cv-${index++}`,
        metric: (attrs.metric as ContentVariableMetric) || "count",
        filter: {
          groupSlug: (attrs.groupSlug as string | null) || undefined,
          categorySlug: (attrs.categorySlug as string | null) || undefined,
          brandSlug: (attrs.brandSlug as string | null) || undefined,
        },
      });
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        if (isTiptapNode(child)) walk(child);
      }
    }
  }

  if (isTiptapNode(doc)) walk(doc);
  return out;
}

/**
 * Returns a new doc with every contentVariable node's `resolvedText` attr
 * set from `formattedValues` (keyed by the same positional id
 * collectContentVariables assigned) — a node with no matching entry keeps
 * whatever resolvedText it already had (i.e. none, so it falls back to
 * `fallbackText` at render time — see tiptap-content-variable.ts).
 */
export function applyContentVariableValues(
  doc: unknown,
  formattedValues: Record<string, string>,
): unknown {
  let index = 0;

  function walk(node: TiptapNodeLike): TiptapNodeLike {
    const content = Array.isArray(node.content)
      ? node.content.map((child) => (isTiptapNode(child) ? walk(child) : child))
      : undefined;
    const withContent = content !== undefined ? { ...node, content } : node;

    if (node.type === "contentVariable") {
      const id = `cv-${index++}`;
      const resolvedText = formattedValues[id];
      if (resolvedText === undefined) return withContent;
      return { ...withContent, attrs: { ...node.attrs, resolvedText } };
    }

    return withContent;
  }

  if (!isTiptapNode(doc)) return doc;
  return walk(doc);
}

export function formatContentVariableValue(metric: ContentVariableMetric, value: number | undefined): string {
  if (value === undefined) return "";
  return metric === "count" ? value.toLocaleString("vi-VN") : formatCurrency(value);
}

/**
 * Orchestrates collect -> resolve -> format -> rewrite for one doc. `fetchValues`
 * is injected (rather than imported directly) so this stays a plain module
 * with no "use server" directive of its own — see
 * content-variables-actions.ts for the actual Go API call passed in here.
 * Returns the original doc unchanged (same reference) when it has no
 * contentVariable nodes, so callers can pass the result straight to
 * PreviewContent either way.
 */
export async function resolveContentVariablesInDoc(
  doc: unknown,
  fetchValues: (requests: ContentVariableRequest[]) => Promise<Record<string, number>>,
): Promise<unknown> {
  const requests = collectContentVariables(doc);
  if (requests.length === 0) return doc;

  const rawValues = await fetchValues(requests);
  const formatted: Record<string, string> = {};
  for (const req of requests) {
    formatted[req.id] = formatContentVariableValue(req.metric, rawValues[req.id]);
  }
  return applyContentVariableValues(doc, formatted);
}
