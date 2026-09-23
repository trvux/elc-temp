"use client";

// Authored for this project — editing an already-inserted image's alt text
// needs a real text input, which has no room in the on-image overlay's "..."
// dropdown (see tiptap-image-node-view.tsx) or in the insert-flow Image
// button (see image-placeholder-toolbar.tsx). Only enabled while an image
// is actually selected.
import { TextAa } from "@phosphor-icons/react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useToolbar } from "./toolbar-provider";

export const ImageAltTextToolbar = () => {
  const { editor } = useToolbar();
  const isImageActive = editor?.isActive("image") ?? false;
  const currentAlt = editor?.getAttributes("image").alt || "";

  const updateImageAlt = (alt: string) => {
    editor?.chain().focus().updateAttributes("image", { alt }).run();
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger disabled={!isImageActive} asChild>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8")}>
              <TextAa className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Alt text</span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        className="w-72 p-3"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Alt text</span>
          <Input
            key={currentAlt}
            placeholder="What's in this image? (for screen readers)"
            defaultValue={currentAlt}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateImageAlt((e.target as HTMLInputElement).value);
              }
            }}
            onBlur={(e) => updateImageAlt(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
