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
import { ImageToolbar } from "./image";
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
  uploadImage?: (file: File) => Promise<string>;
}

export const RichTextToolbar = ({ editor, uploadImage }: RichTextToolbarProps) => {
  return (
    <ToolbarProvider editor={editor}>
      <div className="flex flex-wrap items-center gap-0.5 overflow-x-auto rounded-t-2xl border-b border-border/50 bg-muted/40 p-1.5">
        <UndoToolbar />
        <RedoToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <HeadingToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <BoldToolbar />
        <ItalicToolbar />
        <UnderlineToolbar />
        <StrikeThroughToolbar />
        <SubscriptToolbar />
        <SuperscriptToolbar />
        <CodeToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ColorHighlightToolbar />
        <AlignmentTooolbar />
        <LinkToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <BlockquoteToolbar />
        <BulletListToolbar />
        <OrderedListToolbar />
        <CodeBlockToolbar />
        <HardBreakToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ImageToolbar uploadImage={uploadImage} />
        <TableToolbar />
        <HorizontalRuleToolbar />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <SearchAndReplaceToolbar />
      </div>
    </ToolbarProvider>
  );
};
