"use client";

// From shadcn-tiptap (MIT) — icon swapped to @phosphor-icons/react.
import { TextItalic } from "@phosphor-icons/react";
import React from "react";

import { Button } from "@/shared/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useToolbar } from "./toolbar-provider";

const ItalicToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              editor?.isActive("italic") && "bg-accent",
              className,
            )}
            onClick={(e) => {
              editor?.chain().focus().toggleItalic().run();
              onClick?.(e);
            }}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
            ref={ref}
            {...props}
          >
            {children || <TextItalic className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Italic</span>
          <span className="ml-1 text-xs text-muted-foreground">(cmd + i)</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

ItalicToolbar.displayName = "ItalicToolbar";

export { ItalicToolbar };
