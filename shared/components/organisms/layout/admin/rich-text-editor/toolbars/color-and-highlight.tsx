"use client";

// From shadcn-tiptap (MIT) — icons swapped to @phosphor-icons/react;
// the undefined `var(--text-*)`/`var(--highlight-*)` palette swapped
// for literal hex values (this project's theme has no such tokens).
import { CaretDown, Check } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useToolbar } from "./toolbar-provider";

const TEXT_COLORS = [
  { name: "Default", color: "inherit" },
  { name: "Gray", color: "#6b7280" },
  { name: "Brown", color: "#92400e" },
  { name: "Orange", color: "#ea580c" },
  { name: "Yellow", color: "#ca8a04" },
  { name: "Green", color: "#16a34a" },
  { name: "Blue", color: "#2563eb" },
  { name: "Purple", color: "#9333ea" },
  { name: "Pink", color: "#db2777" },
  { name: "Red", color: "#dc2626" },
];

const HIGHLIGHT_COLORS = [
  { name: "Default", color: "transparent" },
  { name: "Gray", color: "#e5e7eb" },
  { name: "Brown", color: "#fde68a" },
  { name: "Orange", color: "#fed7aa" },
  { name: "Yellow", color: "#fef08a" },
  { name: "Green", color: "#bbf7d0" },
  { name: "Blue", color: "#bfdbfe" },
  { name: "Purple", color: "#e9d5ff" },
  { name: "Pink", color: "#fbcfe8" },
  { name: "Red", color: "#fecaca" },
];

interface ColorHighlightButtonProps {
  name: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
  isHighlight?: boolean;
}

const ColorHighlightButton = ({
  name,
  color,
  isActive,
  onClick,
  isHighlight,
}: ColorHighlightButtonProps) => (
  <button
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent"
    type="button"
  >
    <div className="flex items-center space-x-2">
      <div
        className="rounded-sm border px-1 py-px font-medium"
        style={isHighlight ? { backgroundColor: color } : { color }}
      >
        A
      </div>
      <span>{name}</span>
    </div>
    {isActive && <Check className="h-4 w-4" />}
  </button>
);

export const ColorHighlightToolbar = () => {
  const { editor } = useToolbar();

  const currentColor = editor?.getAttributes("textStyle").color;
  const currentHighlight = editor?.getAttributes("highlight").color;

  const handleSetColor = (color: string) => {
    editor
      ?.chain()
      .focus()
      .setColor(color === currentColor ? "" : color)
      .run();
  };

  const handleSetHighlight = (color: string) => {
    editor
      ?.chain()
      .focus()
      .setHighlight(color === currentHighlight ? { color: "" } : { color })
      .run();
  };

  const isDisabled =
    !editor?.can().chain().setHighlight().run() ||
    !editor?.can().chain().setColor("").run();

  return (
    <Popover>
      <div className="relative h-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger disabled={isDisabled} asChild>
              <Button
                variant="ghost"
                size="sm"
                style={{
                  color: currentColor,
                }}
                className={cn("h-8 w-14 p-0 font-normal")}
              >
                <span className="text-md">A</span>
                <CaretDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Text Color & Highlight</TooltipContent>
        </Tooltip>

        <PopoverContent align="start" className="w-56 p-1">
          <ScrollArea className="max-h-80 overflow-y-auto pr-2">
            <div className="mb-2.5 mt-2 px-2 text-xs text-muted-foreground">
              Color
            </div>
            {TEXT_COLORS.map(({ name, color }) => (
              <ColorHighlightButton
                key={name}
                name={name}
                color={color}
                isActive={currentColor === color}
                onClick={() => handleSetColor(color)}
              />
            ))}

            <Separator className="my-3" />

            <div className="mb-2.5 w-full px-2 pr-3 text-xs text-muted-foreground">
              Background
            </div>
            {HIGHLIGHT_COLORS.map(({ name, color }) => (
              <ColorHighlightButton
                key={name}
                name={name}
                color={color}
                isActive={currentHighlight === color}
                onClick={() => handleSetHighlight(color)}
                isHighlight
              />
            ))}
          </ScrollArea>
        </PopoverContent>
      </div>
    </Popover>
  );
};
