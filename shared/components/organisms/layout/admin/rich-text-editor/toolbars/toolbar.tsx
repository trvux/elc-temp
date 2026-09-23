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
      <div className="flex flex-wrap items-center gap-0.5 overflow-x-auto rounded-t-2xl border-b border-border/50 bg-muted/40 p-1.5">
        {/* History */}
        <UndoToolbar />
        <RedoToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Block type + core inline marks — the demo's own first cluster,
            same order (heading, bold/italic/link/underline). */}
        <HeadingToolbar />
        <BoldToolbar />
        <ItalicToolbar />
        <LinkToolbar />
        <UnderlineToolbar />
        <StrikeThroughToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists + alignment — the demo's second cluster. */}
        <BulletListToolbar />
        <OrderedListToolbar />
        <AlignmentTooolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Insert: image/table/divider, then text color/highlight — mirrors
            the demo's image + "A" dropdown placement. */}
        <ImagePlaceholderToolbar />
        <TableToolbar />
        <HorizontalRuleToolbar />
        <ColorHighlightToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Less-frequent marks/blocks this project has beyond the demo —
            grouped together rather than interleaved with the core set
            above, so the common stuff stays scannable. */}
        <SubscriptToolbar />
        <SuperscriptToolbar />
        <CodeToolbar />
        <CodeBlockToolbar />
        <BlockquoteToolbar />
        <HardBreakToolbar />

        {/* Pushed flush right, same as the demo's Search & Replace. */}
        <SearchAndReplaceToolbar className="ml-auto" />
      </div>
    </ToolbarProvider>
  );
};
