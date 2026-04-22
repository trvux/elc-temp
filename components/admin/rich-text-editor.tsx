// FORCE REBUILD - CLEANING UP HOOKS
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import FloatingMenuExtension from "@tiptap/extension-floating-menu";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Maximize,
  MoreHorizontal,
  Plus,
  Quote,
  RectangleHorizontal,
  Square,
  TableCellsMerge,
  TableCellsSplit,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { convertToWebP } from "@/lib/image";
import { useCallback, useState } from "react";

const COLORS = {
  active: "text-[#b5e5a4] hover:text-[#b5e5a4]",
  default: "text-white hover:text-white",
  danger: "text-[#f87171] hover:text-[#f87171]",
};

const COMMON_CLASSES = {
  bubbleButton:
    "h-8 w-8 p-0 transition-colors disabled:opacity-20 hover:bg-white/10",
  tableButton: "h-8 w-8 p-0 hover:bg-white/10",
  popoverContent: "bg-[#262626] border-none shadow-xl",
};

const getToggleClasses = (isActive: boolean) =>
  isActive ? COLORS.active : COLORS.default;

interface RichTextEditorProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  uploadImage?: (file: File) => Promise<string>;
}

import { getTiptapExtensions } from "@/lib/tiptap-shared";

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  className,
  uploadImage,
}: RichTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((tick) => tick + 1), []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
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
    ],
    content: value,
    onCreate: ({ editor }) => {
      // Nếu editor trống hoàn toàn, ép dòng đầu là H1
      if (editor.isEmpty) {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
    },
    onUpdate: ({ editor }) => {
      // Logic: Nếu dòng đầu tiên bị chuyển về Paragraph, ép nó quay lại H1
      const { state } = editor;
      const { doc } = state;
      const firstNode = doc.firstChild;

      if (firstNode && firstNode.type.name !== "heading") {
        editor.chain().setNodeSelection(0).toggleHeading({ level: 1 }).run();
      }

      onChange(editor.getJSON());
      forceUpdate();
    },
    onSelectionUpdate: forceUpdate,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-[500px] py-12",
          className,
        ),
      },
    },
  });

  const updateImageAlt = useCallback(
    (alt: string) => {
      if (!editor) return;
      // @ts-ignore
      editor.chain().focus().updateAttributes("image", { alt }).run();
    },
    [editor],
  );

  const setImageAlign = useCallback(
    (align: string) => {
      if (!editor) return;
      // @ts-ignore
      editor.chain().focus().updateAttributes("image", { align }).run();
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinkUrl("");
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const webpFile = await convertToWebP(file);
          if (uploadImage) {
            const url = await uploadImage(webpFile);
            editor.chain().focus().setImage({ src: url }).run();
          } else {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const url = readerEvent.target?.result as string;
              editor.chain().focus().setImage({ src: url }).run();
            };
            reader.readAsDataURL(webpFile);
          }
        } catch (error) {
          console.error("Lỗi xử lý ảnh:", error);
        }
      }
    };
    input.click();
  }, [editor, uploadImage]);

  const toggleH1 = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("heading", { level: 1 })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setParagraph().toggleHeading({ level: 1 }).run();
    }
  }, [editor]);

  const toggleH2 = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("heading", { level: 2 })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setParagraph().toggleHeading({ level: 2 }).run();
    }
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("blockquote")) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setParagraph().toggleBlockquote().run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* Selection Toolbar (Bubble Menu) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          // @ts-ignore
          tippyOptions={{
            duration: 200,
            animation: "fade",
          }}
          shouldShow={({ state, editor }) => {
            const { selection } = state;
            return (
              !selection.empty &&
              !editor.isActive("image") &&
              !editor.isActive("table")
            );
          }}
          className="flex items-center gap-1 p-1 bg-[#262626] border-none rounded-md shadow-xl transition-all duration-200 ease-out"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={editor.isActive("heading")}
            className={cn(
              COMMON_CLASSES.bubbleButton,
              getToggleClasses(editor.isActive("bold")),
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={editor.isActive("heading")}
            className={cn(
              COMMON_CLASSES.bubbleButton,
              getToggleClasses(editor.isActive("italic")),
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={editor.isActive("heading", { level: 1 })}
                className={cn(
                  COMMON_CLASSES.bubbleButton,
                  getToggleClasses(editor.isActive("link")),
                )}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={cn(
                "w-80 p-2 flex gap-2",
                COMMON_CLASSES.popoverContent,
              )}
            >
              <Input
                placeholder="Paste or type a link..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setLink()}
                className="h-8 bg-transparent border-white/20 text-white placeholder:text-white/40 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-white/30"
              />
              <Button
                size="sm"
                onClick={setLink}
                className="h-8 bg-white text-black hover:bg-white/90 font-medium"
              >
                Apply
              </Button>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-4 bg-white/20" />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleH1}
            className={cn(
              COMMON_CLASSES.bubbleButton,
              "text-lg font-bold",
              getToggleClasses(editor.isActive("heading", { level: 1 })),
            )}
          >
            T
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleH2}
            className={cn(
              COMMON_CLASSES.bubbleButton,
              "font-bold",
              getToggleClasses(editor.isActive("heading", { level: 2 })),
            )}
          >
            T
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBlockquote}
            disabled={editor.isActive("heading")}
            className={cn(
              COMMON_CLASSES.bubbleButton,
              getToggleClasses(editor.isActive("blockquote")),
            )}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={editor.isActive("heading")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              COMMON_CLASSES.bubbleButton,
              getToggleClasses(editor.isActive("bulletList")),
            )}
          >
            <List className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      {/* Image Toolbar (Bubble Menu for Image) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          // @ts-ignore
          tippyOptions={{ duration: 100, offset: [0, 15] }}
          shouldShow={({ editor }) => editor.isActive("image")}
          className="flex items-center gap-2 px-3 py-1 bg-[#262626] border-none rounded-sm shadow-2xl"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setImageAlign("center")}
            className={cn(
              COMMON_CLASSES.tableButton,
              getToggleClasses(
                editor.getAttributes("image").align === "center",
              ),
            )}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setImageAlign("wide")}
            className={cn(
              COMMON_CLASSES.tableButton,
              getToggleClasses(editor.getAttributes("image").align === "wide"),
            )}
          >
            <RectangleHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setImageAlign("full")}
            className={cn(
              COMMON_CLASSES.tableButton,
              getToggleClasses(editor.getAttributes("image").align === "full"),
            )}
          >
            <Maximize className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-4 bg-white/20" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 hover:bg-white/10", COLORS.default)}
              >
                Alt text
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={cn(
                "w-80 p-3 rounded-sm",
                COMMON_CLASSES.popoverContent,
              )}
            >
              <div className="flex flex-col gap-2">
                <span className="text-[12px] text-white/60 font-medium">
                  Alternative text
                </span>
                <Input
                  placeholder="What's in this image? (for screen readers)"
                  defaultValue={editor.getAttributes("image").alt || ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateImageAlt((e.target as HTMLInputElement).value);
                    }
                  }}
                  className="h-9 bg-transparent border-white/20 text-white placeholder:text-white/40 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-white/30 text-sm"
                />
              </div>
            </PopoverContent>
          </Popover>
        </BubbleMenu>
      )}

      {/* Inline Action Menu (Floating Menu) */}
      {editor && (
        <FloatingMenu
          editor={editor}
          // @ts-ignore
          tippyOptions={{
            duration: 100,
            offset: [0, 24],
            placement: "left-start",
          }}
          className="flex flex-row items-center gap-2 -translate-x-20"
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9 border-muted-foreground/30 hover:border-primary transition-colors bg-background shadow-sm"
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="center"
              className="flex flex-row items-center gap-1 p-1 w-auto min-w-max bg-background border-border rounded-full shadow-lg ml-2 animate-in fade-in zoom-in-95 duration-200"
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={addImage}
                title="Add Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={addTable}
                title="Add Table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Add Part Separator"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverContent>
          </Popover>
        </FloatingMenu>
      )}

      {/* Table Toolbar (Bubble Menu for Table) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor }) => editor.isActive("table")}
          // @ts-ignore
          tippyOptions={{ duration: 100, offset: [0, 15], maxWidth: "none" }}
          className="flex items-center gap-1 p-1 bg-[#262626] border-none rounded-md shadow-xl overflow-hidden"
        >
          <div className="flex items-center gap-0.5 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className={cn(COMMON_CLASSES.tableButton, COLORS.default)}
              title="Add Column Before"
            >
              <ArrowLeftToLine className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className={cn(COMMON_CLASSES.tableButton, COLORS.default)}
              title="Add Column After"
            >
              <ArrowRightToLine className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className={cn("h-8 w-8 p-0 hover:bg-red-400/10", COLORS.danger)}
              title="Delete Column"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator
            orientation="vertical"
            className="h-4 bg-white/20 mx-0.5"
          />

          <div className="flex items-center gap-0.5 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className={cn(COMMON_CLASSES.tableButton, COLORS.default)}
              title="Add Row Before"
            >
              <ArrowUpToLine className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className={cn(COMMON_CLASSES.tableButton, COLORS.default)}
              title="Add Row After"
            >
              <ArrowDownToLine className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className={cn("h-8 w-8 p-0 hover:bg-red-400/10", COLORS.danger)}
              title="Delete Row"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator
            orientation="vertical"
            className="h-4 bg-white/20 mx-0.5"
          />

          <div className="flex items-center gap-0.5 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().mergeCells().run()}
              className={cn(COMMON_CLASSES.tableButton, COLORS.default)}
              title="Merge Cells"
            >
              <TableCellsMerge className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().splitCell().run()}
              className={cn(COMMON_CLASSES.tableButton, COLORS.default)}
              title="Split Cell"
            >
              <TableCellsSplit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeaderCell().run()}
              className={cn(
                "h-8 px-2 hover:bg-white/10",
                getToggleClasses(editor.isActive("tableHeader")),
              )}
              title="Toggle Header"
            >
              Header
            </Button>
          </div>

          <Separator
            orientation="vertical"
            className="h-4 bg-white/20 mx-0.5"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={cn(
              "h-8 px-2 flex items-center gap-1.5 hover:bg-red-400/10",
              COLORS.danger,
            )}
            title="Delete Table"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Table
          </Button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
