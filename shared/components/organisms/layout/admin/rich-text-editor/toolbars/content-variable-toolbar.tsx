"use client";

import { ChartBar } from "@phosphor-icons/react";
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

const ContentVariableToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
              editor?.isActive("contentVariable") && "bg-accent",
              className,
            )}
            onClick={(e) => {
              editor?.chain().focus().insertContentVariable().run();
              onClick?.(e);
            }}
            ref={ref}
            {...props}
          >
            {children || <ChartBar className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Biến động (số SP / giá theo danh mục)</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

ContentVariableToolbar.displayName = "ContentVariableToolbar";

export { ContentVariableToolbar };
