"use client";

// Authored for this project — assembles every toolbar button into the
// fixed toolbar that replaces the old 5 bubble/floating menus.
import type { Editor } from "@tiptap/react";
import React from "react";

import { Separator } from "@/shared/components/ui/separator";

import { AlignmentTooolbar } from "./alignment";
import { BlockquoteToolbar } from "./blockquote";
import { BoldToolbar } from "./bold";
import { BulletListToolbar } from "./bullet-list";
import { CodeToolbar } from "./code";
import { CodeBlockToolbar } from "./code-block";
import { ColorHighlightToolbar } from "./color-and-highlight";
import { HardBreakToolbar } from "./hard-break";
import { HeadingToolbar } from "./heading";
import { HorizontalRuleToolbar } from "./horizontal-rule";
import { ImagePlaceholderToolbar } from "./image-placeholder-toolbar";
import { ItalicToolbar } from "./italic";
import { LinkToolbar } from "./link";
import { OrderedListToolbar } from "./ordered-list";
import { RedoToolbar } from "./redo";
import { SearchAndReplaceToolbar } from "./search-and-replace-toolbar";
import { StrikeThroughToolbar } from "./strikethrough";
import { SubscriptToolbar } from "./subscript";
import { SuperscriptToolbar } from "./superscript";
import { TableToolbar } from "./table";
import { ToolbarProvider } from "./toolbar-provider";
import { UnderlineToolbar } from "./underline";
import { UndoToolbar } from "./undo";

interface RichTextToolbarProps {
  editor: Editor;
}

export const RichTextToolbar = ({ editor }: RichTextToolbarProps) => {
  return (
    <ToolbarProvider editor={editor}>
      {/* Two deliberate rows (not one auto-wrapping container) so the
          grouping is stable regardless of container width, instead of
          wherever flex-wrap happens to break the line. Search & Replace
          sits in its own right-hand column, top-aligned with row 1, no
          divider. */}
      <div className="flex items-start gap-2 overflow-x-auto rounded-t-2xl border-b border-border/50 bg-muted/40 p-1.5">
        <div className="flex flex-1 flex-col gap-1">
          {/* Row 1: history, heading, and core inline marks/lists — the
              widened Heading dropdown (150px, enough to not truncate
              "Normal text"/"Heading 2/3") no longer fits on the same row
              as Alignment too, so Alignment moved to row 2 to keep both
              rows roughly balanced instead of overflowing into a
              horizontal scrollbar. */}
          <div className="flex items-center gap-0.5">
            <UndoToolbar />
            <RedoToolbar />

            <Separator orientation="vertical" className="mx-1 h-6" />

            <HeadingToolbar />
            <BoldToolbar />
            <ItalicToolbar />
            <UnderlineToolbar />
            <StrikeThroughToolbar />
            <LinkToolbar />

            <Separator orientation="vertical" className="mx-1 h-6" />

            <BulletListToolbar />
            <OrderedListToolbar />
          </div>

          {/* Row 2: alignment/color, insert, and this project's extras
              beyond the demo. */}
          <div className="flex items-center gap-0.5">
            <AlignmentTooolbar />
            <ColorHighlightToolbar />

            <Separator orientation="vertical" className="mx-1 h-6" />

            <ImagePlaceholderToolbar />
            <TableToolbar />
            <HorizontalRuleToolbar />

            <Separator orientation="vertical" className="mx-1 h-6" />

            <SubscriptToolbar />
            <SuperscriptToolbar />
            <CodeToolbar />
            <CodeBlockToolbar />
            <BlockquoteToolbar />
            <HardBreakToolbar />
          </div>
        </div>

        <SearchAndReplaceToolbar className="shrink-0" />
      </div>
    </ToolbarProvider>
  );
};
