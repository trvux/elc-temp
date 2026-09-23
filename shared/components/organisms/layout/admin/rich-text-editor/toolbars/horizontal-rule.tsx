"use client";

// From shadcn-tiptap (MIT) — icon swapped to @phosphor-icons/react.
import { Minus } from "@phosphor-icons/react";
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

const HorizontalRuleToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", className)}
            onClick={(e) => {
              editor?.chain().focus().setHorizontalRule().run();
              onClick?.(e);
            }}
            ref={ref}
            {...props}
          >
            {children || <Minus className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Horizontal Rule</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

HorizontalRuleToolbar.displayName = "HorizontalRuleToolbar";

export { HorizontalRuleToolbar };
