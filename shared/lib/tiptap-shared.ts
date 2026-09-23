import StarterKit from "@tiptap/starter-kit";
import { HEADING_LEVELS, sharedNodeExtensions } from "@/shared/lib/tiptap-render";

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
  ...sharedNodeExtensions(),
];
