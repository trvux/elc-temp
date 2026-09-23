"use client";

// Authored for this project — shadcn-tiptap's own `image`/`image-placeholder`
// extensions don't support this project's align/ratio/alt-text model or its
// upload backend, so this keeps the existing business logic (previously in
// image-bubble-menu.tsx + editor-floating-menu.tsx's addImage) behind a
// fixed toolbar button + Popover instead of a BubbleMenu/FloatingMenu.
import {
  CornersOut,
  Image as ImageIcon,
  Rectangle,
  Square,
} from "@phosphor-icons/react";
import { Selection } from "@tiptap/pm/state";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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
import { convertToWebP } from "@/shared/lib/image";
import { cn } from "@/shared/lib/utils";
import { useToolbar } from "./toolbar-provider";

const RATIOS = [
  { label: "Auto", value: "auto" },
  { label: "1:1", value: "1/1" },
  { label: "16:9", value: "16/9" },
  { label: "9:16", value: "9/16" },
  { label: "4:3", value: "4/3" },
];

interface ImageToolbarProps {
  uploadImage?: (file: File) => Promise<string>;
}

export const ImageToolbar = ({ uploadImage }: ImageToolbarProps) => {
  const { editor } = useToolbar();
  const isImageActive = editor?.isActive("image") ?? false;

  const insertImage = () => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      const urls: string[] = [];
      for (const file of files) {
        try {
          const webpFile = await convertToWebP(file);
          if (uploadImage) {
            urls.push(await uploadImage(webpFile));
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
    };
    input.click();
  };

  const setImageAlign = (align: string) => {
    editor?.chain().focus().updateAttributes("image", { align }).run();
  };

  const setImageRatio = (ratio: string) => {
    editor?.chain().focus().updateAttributes("image", { ratio }).run();
  };

  const updateImageAlt = (alt: string) => {
    editor?.chain().focus().updateAttributes("image", { alt }).run();
  };

  const currentAlign = editor?.getAttributes("image").align || "center";
  const currentRatio = editor?.getAttributes("image").ratio || "auto";
  const currentAlt = editor?.getAttributes("image").alt || "";

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger disabled={!editor} asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isImageActive && "bg-accent")}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Image</span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        className="w-auto p-2"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!isImageActive ? (
          <Button variant="ghost" size="sm" onClick={insertImage} className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Insert image
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", currentAlign === "center" && "bg-accent")}
                onClick={() => setImageAlign("center")}
                title="Align center"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", currentAlign === "wide" && "bg-accent")}
                onClick={() => setImageAlign("wide")}
                title="Align wide"
              >
                <Rectangle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", currentAlign === "full" && "bg-accent")}
                onClick={() => setImageAlign("full")}
                title="Align full width"
              >
                <CornersOut className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="flex items-center gap-1">
              {RATIOS.map((r) => (
                <Button
                  key={r.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "px-2 text-xs font-medium",
                    currentRatio === r.value && "bg-accent",
                  )}
                  onClick={() => setImageRatio(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5 px-1">
              <span className="text-xs font-medium text-muted-foreground">
                Alt text
              </span>
              <Input
                placeholder="What's in this image? (for screen readers)"
                defaultValue={currentAlt}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateImageAlt((e.target as HTMLInputElement).value);
                  }
                }}
                className="h-8 text-sm"
              />
            </div>

            <Separator />

            <Button variant="ghost" size="sm" onClick={insertImage} className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Insert another image
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
