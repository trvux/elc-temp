"use client";

import { Button } from "@/shared/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/shared/components/ui/button-group";
import { cn } from "@/shared/lib/utils";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { ArrowLineLeft, ArrowLineRight, ArrowLineUp, ArrowLineDown, Intersect, SquareSplitHorizontal, Trash, CornersOut } from "@phosphor-icons/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useCallback } from "react";

interface TableBubbleMenuProps {
  editor: Editor;
}

export const TableBubbleMenu = ({ editor }: TableBubbleMenuProps) => {
  const selectTable = useCallback(() => {
    const { state, dispatch } = editor.view;
    const { selection } = state;
    let $pos = selection.$from;
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
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      className="transition-all duration-300 ease-out"
      shouldShow={({ editor: currentEditor }: { editor: Editor }) =>
        currentEditor.isActive("table")
      }
      // @ts-expect-error - Tippy options type mismatch
      tippyOptions={{ duration: 100, offset: [0, 15], maxWidth: "none" }}
    >
      <div className="tiptap-menu-wrapper">
        <ButtonGroup>
          {/* Columns Group */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="Add Column Before"
          >
            <ArrowLineLeft />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add Column After"
          >
            <ArrowLineRight />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="text-red-400 hover:text-red-300"
            title="Delete Column"
          >
            <Trash />
          </Button>

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* Rows Group */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="Add Row Before"
          >
            <ArrowLineUp />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add Row After"
          >
            <ArrowLineDown />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="text-red-400 hover:text-red-300"
            title="Delete Row"
          >
            <Trash />
          </Button>

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* Cells Group */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().mergeCells().run()}
            title="Merge Cells"
          >
            <Intersect />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().splitCell().run()}
            title="Split Cell"
          >
            <SquareSplitHorizontal />
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeaderCell().run()}
            className={cn(
              "px-2 font-medium",
              editor.isActive("tableHeader") ? "text-green-300" : ""
            )}
            title="Toggle Header"
          >
            Header
          </Button>

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* Select Table */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={selectTable}
            className="px-2 flex items-center gap-1.5 text-blue-300 hover:text-blue-200"
            title="Select Table"
          >
            <CornersOut className="h-4 w-4" />
            Chọn
          </Button>

          {/* Delete Table */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 flex items-center gap-1.5 text-red-400 hover:text-red-300"
            title="Delete Table"
          >
            <Trash className="h-4 w-4" />
            Table
          </Button>
        </ButtonGroup>
      </div>
    </BubbleMenu>
  );
};
