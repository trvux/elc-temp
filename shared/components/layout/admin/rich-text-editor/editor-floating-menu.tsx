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
import {
  Image as ImageIcon,
  MoreHorizontal,
  Plus,
  Table as TableIcon,
} from "lucide-react";
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
        for (const file of files) {
          try {
            const webpFile = await convertToWebP(file);
            if (uploadImage) {
              const url = await uploadImage(webpFile);
              editor.chain().focus().setImage({ src: url }).run();
            } else {
              await new Promise<void>((resolve) => {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                  const url = readerEvent.target?.result as string;
                  editor.chain().focus().setImage({ src: url }).run();
                  resolve();
                };
                reader.readAsDataURL(webpFile);
              });
            }
          } catch (error) {
            console.error("Lỗi xử lý ảnh:", error);
          }
        }
      }
    };
    input.click();
  }, [editor, uploadImage]);

  return (
    <FloatingMenu
      editor={editor}
      // @ts-expect-error: tippyOptions is not fully typed in Tiptap React wrapper
      tippyOptions={{
        duration: 100,
        offset: [0, 24],
        placement: "left-start",
      }}
      className="transition-all duration-300 ease-out flex flex-row items-center gap-2 -translate-x-20"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border border-foreground hover:border-primary transition-colors bg-background shadow-sm"
          >
            <Plus />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="center"
          className="p-1 w-auto min-w-max bg-primary border-muted rounded-full shadow-lg ml-2 animate-in fade-in zoom-in-95 duration-200"
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
              <MoreHorizontal />
            </Button>
          </ButtonGroup>
        </PopoverContent>
      </Popover>
    </FloatingMenu>
  );
};
