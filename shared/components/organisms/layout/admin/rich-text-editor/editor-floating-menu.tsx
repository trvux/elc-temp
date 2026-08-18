"use client";

import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { convertToWebP } from "@/shared/lib/image";
import { type Editor } from "@tiptap/react";
import { FloatingMenu } from "@tiptap/react/menus";
import { Selection } from "@tiptap/pm/state";
import { Image as ImageIcon, DotsThree, Plus, Table as TableIcon } from "@phosphor-icons/react";
import { useCallback } from "react";

interface EditorFloatingMenuProps {
  editor: Editor;
  uploadImage?: (file: File) => Promise<string>;
}

export const EditorFloatingMenu = ({
  editor,
  uploadImage,
}: EditorFloatingMenuProps) => {
  const addTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        const urls: string[] = [];
        for (const file of files) {
          try {
            const webpFile = await convertToWebP(file);
            if (uploadImage) {
              const url = await uploadImage(webpFile);
              urls.push(url);
            } else {
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                  resolve(readerEvent.target?.result as string);
                };
                reader.readAsDataURL(webpFile);
              });
              urls.push(dataUrl);
            }
          } catch (error) {
            console.error("Lỗi xử lý ảnh:", error);
          }
        }
        if (urls.length > 0) {
          const { view } = editor;
          const { state } = view;
          const position = state.selection.from;
          
          let transaction = state.tr;
          let currentPos = position;
          for (const url of urls) {
            const node = state.schema.nodes.image.create({ src: url });
            transaction = transaction.insert(currentPos, node);
            currentPos += node.nodeSize;
          }
          
          const newSelection = Selection.near(transaction.doc.resolve(currentPos));
          transaction = transaction.setSelection(newSelection);
          
          view.dispatch(transaction);
          editor.commands.focus();
        }
      }
    };
    input.click();
  }, [editor, uploadImage]);

  return (
    <FloatingMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { selection } = state;
        const { $anchor, empty } = selection;
        const isRootDepth = $anchor.depth === 1;
        const isEmptyText = $anchor.parent.textContent.trim().length === 0;
        return empty && isRootDepth && isEmptyText;
      }}
      // @ts-expect-error - Tippy options type mismatch
      tippyOptions={{
        duration: 100,
        offset: [-4, 0],
        placement: "top-start",
        appendTo: () => document.body,
        zIndex: 9999,
      }}
      className="-ml-12 transition-all duration-300 ease-out flex flex-row items-center gap-2 z-20"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border border-border hover:border-primary/60 hover:bg-accent transition-all bg-background shadow-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="center"
          className="tiptap-menu-wrapper p-1 w-auto min-w-max rounded-full shadow-lg ml-2 animate-in fade-in zoom-in-95 duration-200"
        >
          <ButtonGroup>
            <Button
              type="button"
              variant="default"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={addImage}
              title="Add Image"
            >
              <ImageIcon />
            </Button>

            <Button
              type="button"
              variant="default"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={addTable}
              title="Add Table"
            >
              <TableIcon />
            </Button>

            <Button
              type="button"
              variant="default"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Add Part Separator"
            >
              <DotsThree />
            </Button>
          </ButtonGroup>
        </PopoverContent>
      </Popover>
    </FloatingMenu>
  );
};
