import StarterKit from "@tiptap/starter-kit";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { HEADING_LEVELS, createImageExtension, sharedMarkExtensions, sharedNodeExtensions } from "@/shared/lib/tiptap-render";
import { SearchAndReplace } from "@/shared/components/organisms/layout/admin/rich-text-editor/toolbars/search-and-replace";
import { TiptapImageNodeView } from "@/shared/components/organisms/layout/admin/rich-text-editor/tiptap-image-node-view";

// Same align/ratio/width attrs as the public Image (createImageExtension),
// plus an interactive NodeView (resize handles + on-image overlay) that
// only ever runs in the admin editor. Placed AFTER ...sharedNodeExtensions()
// below so it overrides the plain "image" extension — see
// createImageExtension's own comment in tiptap-render.ts for why that's
// safe (Tiptap collapses same-named extensions to "last one wins").
const AdminImage = createImageExtension()
  .extend({
    addNodeView() {
      return ReactNodeViewRenderer(TiptapImageNodeView);
    },
  })
  .configure({
    HTMLAttributes: {
      class: "h-auto transition-all duration-500 ease-in-out rounded-sm",
    },
  });

// Re-exported so rich-text-editor.tsx (the only importer of this file) has
// one import line for both — this file is intentionally the ONLY place
// "@tiptap/starter-kit" gets imported, so admin-only editing code
// (undo/redo, drop/gap cursor) never reaches a public bundle. See the
// module-boundary note at the top of tiptap-render.ts for why this has to
// be a real file split, not just two functions in one file.
export { normalizeTiptapJson } from "@/shared/lib/tiptap-render";

// Full set for the interactive admin editor (rich-text-editor.tsx) — needs
// StarterKit's editing-only plugins (undo/redo, drop/gap cursor) for real
// authoring UX. The public read-only render path uses
// getTiptapExtensionsForRender() from tiptap-render.ts instead — see that
// file for why the two can't just be exports of this same module.
export const getTiptapExtensions = () => [
  StarterKit.configure({
    horizontalRule: false,
    link: false,
    heading: {
      levels: [...HEADING_LEVELS],
    },
  }),
  // Editor-only: operates on live decorations, never touches stored
  // content shape, so it has no counterpart in getTiptapExtensionsForRender.
  SearchAndReplace,
  ...sharedNodeExtensions(),
  ...sharedMarkExtensions(),
  AdminImage,
];
