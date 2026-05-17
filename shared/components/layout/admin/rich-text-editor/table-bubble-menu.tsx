"use client";

import { Button } from "@/shared/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/shared/components/ui/button-group";
import { cn } from "@/shared/lib/utils";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
} from "lucide-react";

interface TableBubbleMenuProps {
  editor: Editor;
}

export const TableBubbleMenu = ({ editor }: TableBubbleMenuProps) => {
  return (
    <BubbleMenu
      editor={editor}
      className="transition-all duration-300 ease-out"
      shouldShow={({ editor: currentEditor }) => currentEditor.isActive("table")}
      // @ts-ignore
      tippyOptions={{ duration: 100, offset: [0, 15], maxWidth: "none" }}
    >
      <div className="text-primary-foreground bg-primary rounded-lg p-1 shadow-md">
        <ButtonGroup>
          {/* Columns Group */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="Add Column Before"
          >
            <ArrowLeftToLine />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add Column After"
          >
            <ArrowRightToLine />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="text-red-400 hover:text-red-300"
            title="Delete Column"
          >
            <Trash2 />
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
            <ArrowUpToLine />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add Row After"
          >
            <ArrowDownToLine />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="text-red-400 hover:text-red-300"
            title="Delete Row"
          >
            <Trash2 />
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
            <TableCellsMerge />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().splitCell().run()}
            title="Split Cell"
          >
            <TableCellsSplit />
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

          {/* Delete Table */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 flex items-center gap-1.5 text-red-400 hover:text-red-300"
            title="Delete Table"
          >
            <Trash2 className="h-4 w-4" />
            Table
          </Button>
        </ButtonGroup>
      </div>
    </BubbleMenu>
  );
};
