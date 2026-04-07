"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink as UnlinkIcon,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  uploadImage?: (file: File) => Promise<string>;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết...",
  className,
  uploadImage,
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      ImageExtension.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[160px] px-4 py-3",
      },
    },
  });

  // Sync external value
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
  }, [editor, linkUrl]);

  async function handleImageFile(file: File) {
    if (!editor || !uploadImage) return;
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      /* ignore */
    }
  }

  if (!editor) return null;

  const tb = (active: boolean) =>
    cn(
      "p-1.5 rounded transition-colors disabled:opacity-30",
      active
        ? "bg-gray-200 text-gray-900"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
    );

  const bb = (active: boolean) =>
    cn(
      "px-1.5 py-1 rounded transition-colors flex items-center justify-center disabled:opacity-30",
      active
        ? "bg-white/20 text-white"
        : "text-gray-300 hover:bg-white/10 hover:text-white",
    );

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Fixed toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap border-b bg-gray-50 px-2 py-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={tb(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={tb(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={tb(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={tb(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={tb(editor.isActive("bulletList"))}
          title="Bullet list"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={tb(editor.isActive("orderedList"))}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={tb(editor.isActive("link"))}
              title="Insert link"
              onClick={() =>
                setLinkUrl(editor.getAttributes("link").href || "")
              }
            >
              <LinkIcon size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" side="bottom" align="start">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Chèn liên kết</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSetLink();
                  }}
                />
                <Button size="sm" className="h-8 px-2" onClick={handleSetLink}>
                  <Check size={14} />
                </Button>
              </div>
              {editor.isActive("link") && (
                <Button
                  variant="ghost"
                  className="w-full h-8 text-red-500 hover:text-red-600 hover:bg-red-50 text-xs justify-start px-2"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                >
                  <UnlinkIcon size={12} className="mr-2" />
                  Xóa liên kết
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {uploadImage && (
          <>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={tb(false)}
              title="Insert image"
            >
              <ImageIcon size={14} />
            </button>
          </>
        )}

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={tb(false)}
          title="Undo"
        >
          <Undo size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={tb(false)}
          title="Redo"
        >
          <Redo size={14} />
        </button>
      </div>

      {/* Bubble menu on text selection */}
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 8 }}
        className="flex items-center gap-0.5 bg-zinc-900 rounded-lg px-2 py-1.5 shadow-xl z-50 animate-in fade-in zoom-in duration-200"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={bb(editor.isActive("bold"))}
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={bb(editor.isActive("italic"))}
        >
          <Italic size={13} />
        </button>

        <div className="w-px h-3.5 bg-zinc-700 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={bb(editor.isActive("link"))}
              onClick={() =>
                setLinkUrl(editor.getAttributes("link").href || "")
              }
            >
              <LinkIcon size={13} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-2 bg-white dark:bg-zinc-950 border shadow-xl rounded-md"
            side="top"
            sideOffset={12}
          >
            <div className="flex gap-2">
              <Input
                placeholder="Dán link hoặc gõ..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSetLink();
                }}
                autoFocus
              />
              <Button
                size="icon"
                variant="default"
                className="h-8 w-8 shrink-0"
                onClick={handleSetLink}
              >
                <Check size={14} />
              </Button>
              {editor.isActive("link") && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 shrink-0"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                >
                  <UnlinkIcon size={14} />
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-3.5 bg-zinc-700 mx-1" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={bb(editor.isActive("heading", { level: 2 }))}
        >
          <span className="text-[10px] font-bold">H2</span>
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={bb(editor.isActive("heading", { level: 3 }))}
        >
          <span className="text-[10px] font-bold">H3</span>
        </button>

        <div className="w-px h-3.5 bg-zinc-700 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={bb(editor.isActive("bulletList"))}
        >
          <List size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={bb(editor.isActive("orderedList"))}
        >
          <ListOrdered size={13} />
        </button>
      </BubbleMenu>

      {uploadImage && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImageFile(f);
            e.target.value = "";
          }}
        />
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
