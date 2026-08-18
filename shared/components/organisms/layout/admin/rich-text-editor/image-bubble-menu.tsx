"use client";

import { Button } from "@/shared/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/shared/components/ui/button-group";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { CornersOut, Rectangle, Square } from "@phosphor-icons/react";
import { useCallback } from "react";

interface ImageBubbleMenuProps {
  editor: Editor;
}

export const ImageBubbleMenu = ({ editor }: ImageBubbleMenuProps) => {
  const updateImageAlt = useCallback(
    (alt: string) => {
      editor.chain().focus().updateAttributes("image", { alt }).run();
    },
    [editor],
  );

  const setImageAlign = useCallback(
    (align: string) => {
      editor.chain().focus().updateAttributes("image", { align }).run();
    },
    [editor],
  );

  const setImageRatio = useCallback(
    (ratio: string) => {
      editor.chain().focus().updateAttributes("image", { ratio }).run();
    },
    [editor],
  );

  const currentAlign = editor.getAttributes("image").align || "center";
  const currentRatio = editor.getAttributes("image").ratio || "auto";
  const currentAlt = editor.getAttributes("image").alt || "";

  return (
    <BubbleMenu
      editor={editor}
      className="transition-all duration-300 ease-out"
      shouldShow={({ editor: currentEditor }) =>
        currentEditor.isActive("image")
      }
      // @ts-expect-error - Tippy options type mismatch
      tippyOptions={{ duration: 100, offset: [0, 15], appendTo: () => document.body, zIndex: 9999 }}
    >
      <div className="tiptap-menu-wrapper">
        <ButtonGroup>
          {/* Alignment Options */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => setImageAlign("center")}
            className={cn(currentAlign === "center" ? "text-green-300" : "")}
            title="Align Center"
          >
            <Square />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => setImageAlign("wide")}
            className={cn(currentAlign === "wide" ? "text-green-300" : "")}
            title="Align Wide"
          >
            <Rectangle />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => setImageAlign("full")}
            className={cn(currentAlign === "full" ? "text-green-300" : "")}
            title="Align Full Width"
          >
            <CornersOut />
          </Button>

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* Ratio Options */}
          {[
            { label: "Auto", value: "auto" },
            { label: "1:1", value: "1/1" },
            { label: "16:9", value: "16/9" },
            { label: "9:16", value: "9/16" },
            { label: "4:3", value: "4/3" },
          ].map((r) => (
            <Button
              key={r.value}
              type="button"
              variant="default"
              size="sm"
              onClick={() => setImageRatio(r.value)}
              className={cn(
                "px-2 font-medium text-xs",
                currentRatio === r.value ? "text-green-300" : "",
              )}
            >
              {r.label}
            </Button>
          ))}

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* Alt Text Option */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="px-2.5 font-medium text-xs"
              >
                Alt text
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3 rounded-lg shadow-xl bg-primary border-muted">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Alternative text
                </span>
                <Input
                  placeholder="What's in this image? (for screen readers)"
                  defaultValue={currentAlt}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateImageAlt((e.target as HTMLInputElement).value);
                    }
                  }}
                  className="h-8 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-muted text-sm text-primary-foreground placeholder:text-muted-foreground"
                />
              </div>
            </PopoverContent>
          </Popover>
        </ButtonGroup>
      </div>
    </BubbleMenu>
  );
};
