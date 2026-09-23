"use client";

// From shadcn-tiptap (MIT) — icon swapped to @phosphor-icons/react.
import { TextSuperscript } from "@phosphor-icons/react";
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

const SuperscriptToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
              editor?.isActive("superscript") && "bg-accent",
              className,
            )}
            onClick={(e) => {
              editor?.chain().focus().toggleSuperscript().run();
              onClick?.(e);
            }}
            disabled={!editor?.can().chain().focus().toggleSuperscript().run()}
            ref={ref}
            {...props}
          >
            {children || <TextSuperscript className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Superscript</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

SuperscriptToolbar.displayName = "SuperscriptToolbar";

export { SuperscriptToolbar };
