import { Node, mergeAttributes } from "@tiptap/core";

/**
 * contentVariable is an inline atom node standing in for a number an SEO
 * author would otherwise type by hand (product count, price range for a
 * category/brand/group) — see content-variables.ts for why that drifts.
 * Stored in Tiptap JSON with only the *scope* (metric + slugs);
 * `resolvedText` is never authored or persisted — it's set on a throwaway
 * copy of the doc right before generateHTML() runs (see
 * resolveContentVariablesInDoc), so the actual number always reflects the
 * live catalog at render time.
 *
 * Declared here (not in tiptap-shared.ts) because — unlike SearchAndReplace
 * or ImagePlaceholder — a real stored document DOES contain this node, so
 * both the admin editor and the public render path need the same schema.
 * The admin editor additionally attaches a NodeView (chip UI) via
 * `.extend()` in tiptap-shared.ts, same pattern as AdminImage overriding
 * the plain Image extension.
 */
export type ContentVariableMetric = "count" | "priceMin" | "priceMax";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    contentVariable: {
      insertContentVariable: () => ReturnType;
    };
  }
}

export const ContentVariable = Node.create({
  name: "contentVariable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      metric: { default: "count" as ContentVariableMetric },
      groupSlug: { default: null },
      categorySlug: { default: null },
      brandSlug: { default: null },
      // Whatever the value was the moment this node was last inserted/
      // edited — shown if resolution fails (API down, slug no longer
      // exists) instead of rendering blank.
      fallbackText: { default: "" },
      // Set only at render time, on a throwaway doc copy — see this
      // node's doc comment above. `rendered: false` keeps it out of
      // Tiptap's own attrs-to-HTML auto-serialization (harmless here since
      // renderHTML below is custom anyway, but documents the intent).
      resolvedText: { default: null, rendered: false },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-content-variable]" }];
  },

  addCommands() {
    return {
      insertContentVariable:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: {} }),
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const text = (node.attrs.resolvedText as string | null) || node.attrs.fallbackText || "";
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-content-variable": node.attrs.metric,
        "data-group-slug": node.attrs.groupSlug || undefined,
        "data-category-slug": node.attrs.categorySlug || undefined,
        "data-brand-slug": node.attrs.brandSlug || undefined,
      }),
      text,
    ];
  },
});
