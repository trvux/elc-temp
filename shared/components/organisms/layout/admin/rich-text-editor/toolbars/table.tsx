"use client";

// Authored for this project — shadcn-tiptap has no Table toolbar at all.
// Fixed toolbar button (not a BubbleMenu): inserts a table when none is
// active, opens a Popover of table operations (replicating the old
// table-bubble-menu.tsx) when the cursor is inside one.
import {
  ArrowLineDown,
  ArrowLineLeft,
  ArrowLineRight,
  ArrowLineUp,
  CornersOut,
  Intersect,
  SquareSplitHorizontal,
  Table as TableIcon,
  Trash,
} from "@phosphor-icons/react";
import { NodeSelection } from "@tiptap/pm/state";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Separator } from "@/shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useToolbar } from "./toolbar-provider";

export const TableToolbar = () => {
  const { editor } = useToolbar();
  const isInTable = editor?.isActive("table") ?? false;

  const selectTable = () => {
    if (!editor) return;
    const { state, dispatch } = editor.view;
    const { selection } = state;
    const $pos = selection.$from;
    let depth = $pos.depth;
    while (depth > 0) {
      if ($pos.node(depth).type.name === "table") {
        const tablePos = $pos.before(depth);
        const nodeSelection = NodeSelection.create(state.doc, tablePos);
        dispatch(state.tr.setSelection(nodeSelection));
        editor.view.focus();
        return;
      }
      depth--;
    }
  };

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger disabled={!editor} asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isInTable && "bg-accent")}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Table</span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        className="w-auto p-2"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!isInTable ? (
          <Button variant="ghost" size="sm" onClick={insertTable} className="gap-2">
            <TableIcon className="h-4 w-4" />
            Insert table
          </Button>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
                title="Add column before"
              >
                <ArrowLineLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                title="Add column after"
              >
                <ArrowLineRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => editor?.chain().focus().deleteColumn().run()}
                title="Delete column"
              >
                <Trash className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor?.chain().focus().addRowBefore().run()}
                title="Add row before"
              >
                <ArrowLineUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                title="Add row after"
              >
                <ArrowLineDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => editor?.chain().focus().deleteRow().run()}
                title="Delete row"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>

            <Separator className="my-1" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor?.chain().focus().mergeCells().run()}
                title="Merge cells"
              >
                <Intersect className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor?.chain().focus().splitCell().run()}
                title="Split cell"
              >
                <SquareSplitHorizontal className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-2 font-medium",
                  editor?.isActive("tableHeader") && "bg-accent",
                )}
                onClick={() => editor?.chain().focus().toggleHeaderCell().run()}
              >
                Header
              </Button>
            </div>

            <Separator className="my-1" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectTable}
                className="gap-1.5 px-2 text-blue-500 hover:text-blue-500"
              >
                <CornersOut className="h-4 w-4" />
                Select table
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().deleteTable().run()}
                className="gap-1.5 px-2 text-destructive hover:text-destructive"
              >
                <Trash className="h-4 w-4" />
                Delete table
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
