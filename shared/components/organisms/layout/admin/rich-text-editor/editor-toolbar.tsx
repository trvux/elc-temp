"use client";

import { useCallback, useState } from "react";
import { type Editor } from "@tiptap/react";
import { Selection } from "@tiptap/pm/state";
import {
  TextB,
  TextItalic,
  Link as LinkIcon,
  List,
  ListNumbers,
  Quotes,
  Image as ImageIcon,
  Table as TableIcon,
  DotsThree,
  Eraser,
  ArrowCounterClockwise,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/shared/components/ui/button-group";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { cn } from "@/shared/lib/utils";

interface EditorToolbarProps {
  editor: Editor;
  uploadImage?: (file: File) => Promise<string>;
  className?: string;
}

export const EditorToolbar = ({ editor, uploadImage, className }: EditorToolbarProps) => {
  const [linkUrl, setLinkUrl] = useState("");

  const setLink = useCallback(() => {
    if (linkUrl.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl.trim() })
      .run();
    setLinkUrl("");
  }, [editor, linkUrl]);

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
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      if (files.length === 0) return;

      const urls: string[] = [];
      for (const file of files) {
        try {
          const webpFile = await convertToWebP(file);
          if (uploadImage) {
            const url = await uploadImage(webpFile);
            urls.push(url);
          } else {
            const url = await uploadImageFile(webpFile, "editor");
            urls.push(url);
          }
        } catch (error: unknown) {
          console.error("Lỗi tải ảnh:", error);
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
    };
    input.click();
  }, [editor, uploadImage]);

  const stripFormatting = useCallback(() => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  const isH2 = editor.isActive("heading", { level: 2 });
  const isH3 = editor.isActive("heading", { level: 3 });

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-1.5 p-2 bg-card border-b border-border rounded-t-lg select-none sticky top-0 z-10",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        <ButtonGroup>
          {/* Bold */}
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isH2 || isH3}
            title="Bold"
            className={cn(editor.isActive("bold") && "bg-accent text-accent-foreground")}
          >
            <TextB size={16} />
          </Button>

          {/* Italic */}
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isH2 || isH3}
            title="Italic"
            className={cn(editor.isActive("italic") && "bg-accent text-accent-foreground")}
          >
            <TextItalic size={16} />
          </Button>
        </ButtonGroup>

        <ButtonGroupSeparator className="h-5" />

        <ButtonGroup>
          {/* Heading 2 */}
          <Button
            type="button"
            variant={isH2 ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .unsetMark("bold")
                .unsetMark("italic")
                .unsetMark("link")
                .toggleHeading({ level: 2 })
                .run()
            }
            title="Heading 2 (H2)"
            className={cn("font-bold text-xs", isH2 && "bg-accent text-accent-foreground")}
          >
            H2
          </Button>

          {/* Heading 3 */}
          <Button
            type="button"
            variant={isH3 ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .unsetMark("bold")
                .unsetMark("italic")
                .toggleHeading({ level: 3 })
                .run()
            }
            title="Heading 3 (H3)"
            className={cn("font-bold text-xs", isH3 && "bg-accent text-accent-foreground")}
          >
            H3
          </Button>
        </ButtonGroup>

        <ButtonGroupSeparator className="h-5" />

        <ButtonGroup>
          {/* Bullet List */}
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
            className={cn(editor.isActive("bulletList") && "bg-accent text-accent-foreground")}
          >
            <List size={16} />
          </Button>

          {/* Ordered List */}
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
            className={cn(editor.isActive("orderedList") && "bg-accent text-accent-foreground")}
          >
            <ListNumbers size={16} />
          </Button>

          {/* Blockquote */}
          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
            className={cn(editor.isActive("blockquote") && "bg-accent text-accent-foreground")}
          >
            <Quotes size={16} />
          </Button>
        </ButtonGroup>

        <ButtonGroupSeparator className="h-5" />

        <ButtonGroup>
          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive("link") ? "secondary" : "ghost"}
                size="icon-sm"
                disabled={isH2}
                title="Insert Link"
                className={cn(editor.isActive("link") && "bg-accent text-accent-foreground")}
              >
                <LinkIcon size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2 flex gap-2" align="start">
              <Input
                placeholder="https://..."
                value={linkUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && setLink()}
                className="h-8 text-xs focus-visible:ring-offset-0 focus-visible:ring-1"
              />
              <Button type="button" size="sm" onClick={setLink}>
                Apply
              </Button>
            </PopoverContent>
          </Popover>

          {/* Upload Image */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={addImage}
            title="Thêm hình ảnh"
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <ImageIcon size={16} />
          </Button>

          {/* Insert Table */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={addTable}
            title="Thêm bảng"
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <TableIcon size={16} />
          </Button>

          {/* Horizontal Rule */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Thêm đường phân cách"
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <DotsThree size={16} />
          </Button>
        </ButtonGroup>

        <ButtonGroupSeparator className="h-5" />

        {/* Clear formatting */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={stripFormatting}
          title="Xóa định dạng"
        >
          <Eraser size={16} />
        </Button>
      </div>

      {/* History Undo / Redo */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <ArrowCounterClockwise size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <ArrowClockwise size={16} />
        </Button>
      </div>
    </div>
  );
};
