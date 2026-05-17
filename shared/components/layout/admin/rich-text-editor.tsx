"use client";

import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import FloatingMenuExtension from "@tiptap/extension-floating-menu";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getTiptapExtensions, normalizeTiptapJson } from "@/shared/lib/tiptap-shared";
import { cn } from "@/shared/lib/utils";

import { EditorFloatingMenu } from "./rich-text-editor/editor-floating-menu";
import { ImageBubbleMenu } from "./rich-text-editor/image-bubble-menu";
import { TableBubbleMenu } from "./rich-text-editor/table-bubble-menu";
import { TextBubbleMenu } from "./rich-text-editor/text-bubble-menu";

interface RichTextEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  className?: string;
  uploadImage?: (file: File) => Promise<string>;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  className,
  uploadImage,
}: RichTextEditorProps) => {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((tick) => tick + 1), []);

  const extensions = useMemo(() => [
    ...getTiptapExtensions(),
    BubbleMenuExtension,
    FloatingMenuExtension,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading" && node.attrs.level === 1) {
          return "Nhập tiêu đề bài viết...";
        }
        return placeholder || "Bắt đầu viết nội dung...";
      },
    }),
  ], [placeholder]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: normalizeTiptapJson(value) as import("@tiptap/react").Content,
    onCreate: ({ editor }) => {
      // Nếu editor trống hoàn toàn, ép dòng đầu là H1
      if (editor.isEmpty) {
        editor.commands.toggleHeading({ level: 1 });
      }
    },
    onUpdate: ({ editor }) => {
      onChange(normalizeTiptapJson(editor.getJSON()));
      forceUpdate();
    },
    onSelectionUpdate: forceUpdate,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-125 py-12",
          "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
          "prose-img:rounded-sm",
          "tiptap",
          className,
        ),
      },
      transformPastedHTML(html) {
        // Strip all attributes except href and src
        return html.replace(/<([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
          if (tag.toLowerCase() === "a") {
            const hrefMatch = attrs.match(/href="([^"]*)"/i);
            return hrefMatch ? `<a href="${hrefMatch[1]}">` : "<a>";
          }
          if (tag.toLowerCase() === "img") {
            const srcMatch = attrs.match(/src="([^"]*)"/i);
            const altMatch = attrs.match(/alt="([^"]*)"/i);
            return `<img ${srcMatch ? `src="${srcMatch[1]}"` : ""} ${altMatch ? `alt="${altMatch[1]}"` : ""}>`;
          }
          return `<${tag}>`;
        });
      },
    },
  });

  // Sync external value changes into the editor (e.g. when dialog opens with a different article).
  // TipTap ignores prop changes after mount, so we must do this manually.
  useEffect(() => {
    if (!editor) return;
    
    const normalizedIncoming = normalizeTiptapJson(value);
    const normalizedCurrent = normalizeTiptapJson(editor.getJSON());
    const currentJson = JSON.stringify(normalizedCurrent);
    const incomingJson = JSON.stringify(normalizedIncoming);
    
    if (currentJson !== incomingJson) {
      // Nếu editor chưa focus, HOẶC editor đang trống/chỉ có dòng tiêu đề trống
      // thì ta luôn cho phép nạp dữ liệu từ bên ngoài vào.
      const isCurrentEmpty = editor.isEmpty || (
        editor.getJSON().content?.length === 1 &&
        editor.getJSON().content?.[0].type === "heading" &&
        !editor.getText().trim()
      );

      if (!editor.isFocused || isCurrentEmpty) {
        editor.commands.setContent(
          normalizedIncoming as import("@tiptap/react").Content,
          false as unknown as Parameters<typeof editor.commands.setContent>[1]
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Sub-component Menus (SOLID Architecture) */}
      <TextBubbleMenu editor={editor} />
      <ImageBubbleMenu editor={editor} />
      <TableBubbleMenu editor={editor} />
      <EditorFloatingMenu editor={editor} uploadImage={uploadImage} />

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
