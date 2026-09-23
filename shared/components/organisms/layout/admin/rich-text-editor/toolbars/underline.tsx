"use client";

// From shadcn-tiptap (MIT) — icon swapped to @phosphor-icons/react.
import { TextUnderline } from "@phosphor-icons/react";
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

const UnderlineToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
              editor?.isActive("underline") && "bg-accent",
              className,
            )}
            onClick={(e) => {
              editor?.chain().focus().toggleUnderline().run();
              onClick?.(e);
            }}
            disabled={!editor?.can().chain().focus().toggleUnderline().run()}
            ref={ref}
            {...props}
          >
            {children || <TextUnderline className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Underline</span>
          <span className="ml-1 text-xs text-muted-foreground">(cmd + u)</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

UnderlineToolbar.displayName = "UnderlineToolbar";

export { UnderlineToolbar };
