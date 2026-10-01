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
export type ContentVariableMetric = "count" | "priceMin" | "priceMax" | "brandCount" | "categoryCount";

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
    // `rendered: false` on every attr: the custom renderHTML below builds
    // its own data-* attributes straight from node.attrs, so none of
    // these should ALSO go through Tiptap's default attrs-to-HTML
    // auto-serialization (which otherwise dumps every attr as its own
    // lowercase HTML attribute — metric="count" groupslug="..." etc. —
    // duplicating/cluttering the data-* ones renderHTML already emits).
    return {
      metric: { default: "count" as ContentVariableMetric, rendered: false },
      groupSlug: { default: null, rendered: false },
      categorySlug: { default: null, rendered: false },
      brandSlug: { default: null, rendered: false },
      // Only meaningful with metric "count" — narrows to products whose
      // select/multiselect/boolean attribute (e.g. "xuat_xu") equals this
      // value (e.g. "Thái Lan"). Both set together or both left empty.
      attributeCode: { default: null, rendered: false },
      attributeValue: { default: null, rendered: false },
      // Whatever the value was the moment this node was last inserted/
      // edited — shown if resolution fails (API down, slug no longer
      // exists) instead of rendering blank.
      fallbackText: { default: "", rendered: false },
      // Set only at render time, on a throwaway doc copy — see this
      // node's doc comment above.
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
        "data-attribute-code": node.attrs.attributeCode || undefined,
        "data-attribute-value": node.attrs.attributeValue || undefined,
      }),
      text,
    ];
  },
});
