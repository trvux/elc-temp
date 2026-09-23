"use client";

// From shadcn-tiptap (MIT) — icon swapped to @phosphor-icons/react.
import { List } from "@phosphor-icons/react";
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

const BulletListToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
              editor?.isActive("bulletList") && "bg-accent",
              className,
            )}
            onClick={(e) => {
              editor?.chain().focus().toggleBulletList().run();
              onClick?.(e);
            }}
            disabled={!editor?.can().chain().focus().toggleBulletList().run()}
            ref={ref}
            {...props}
          >
            {children || <List className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Bullet list</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

BulletListToolbar.displayName = "BulletListToolbar";

export { BulletListToolbar };
