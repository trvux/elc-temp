"use client";

// Split into two separate buttons (Text Color / Highlight) instead of
// shadcn-tiptap's single combined "A" dropdown — the combined version put
// both 10-item lists in one ScrollArea capped at max-h-80, and the Radix
// ScrollArea's own overflow:hidden fought with the extra overflow-y-auto
// utility class, so the list silently cut off after the Color section's
// "Pink" — no scrollbar rendered, no way to reach "Red" or the whole
// Background/Highlight section at all. Splitting avoids the scroll
// requirement entirely: each list is short enough to fit a plain popover
// on its own, and each gets its own recognizable icon instead of both
// hiding behind one ambiguous "A".
import { Check, Palette, Highlighter as HighlighterIcon } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
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

interface ColorSwatchButtonProps {
  name: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
  isHighlight?: boolean;
}

const ColorSwatchButton = ({
  name,
  color,
  isActive,
  onClick,
  isHighlight,
}: ColorSwatchButtonProps) => (
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

export const TextColorToolbar = () => {
  const { editor } = useToolbar();
  const currentColor = editor?.getAttributes("textStyle").color;

  const handleSetColor = (color: string) => {
    editor
      ?.chain()
      .focus()
      .setColor(color === currentColor ? "" : color)
      .run();
  };

  const isDisabled = !editor?.can().chain().setColor("").run();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger disabled={isDisabled} asChild>
            <Button
              variant="ghost"
              size="icon"
              style={{ color: currentColor }}
              className="h-8 w-8"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Text Color</TooltipContent>
      </Tooltip>

      <PopoverContent align="start" className="w-44 p-1">
        {TEXT_COLORS.map(({ name, color }) => (
          <ColorSwatchButton
            key={name}
            name={name}
            color={color}
            isActive={currentColor === color}
            onClick={() => handleSetColor(color)}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};

export const HighlightToolbar = () => {
  const { editor } = useToolbar();
  const currentHighlight = editor?.getAttributes("highlight").color;

  const handleSetHighlight = (color: string) => {
    editor
      ?.chain()
      .focus()
      .setHighlight(color === currentHighlight ? { color: "" } : { color })
      .run();
  };

  const isDisabled = !editor?.can().chain().setHighlight().run();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger disabled={isDisabled} asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", currentHighlight && "bg-accent")}
            >
              <HighlighterIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Highlight</TooltipContent>
      </Tooltip>

      <PopoverContent align="start" className="w-44 p-1">
        {HIGHLIGHT_COLORS.map(({ name, color }) => (
          <ColorSwatchButton
            key={name}
            name={name}
            color={color}
            isActive={currentHighlight === color}
            onClick={() => handleSetHighlight(color)}
            isHighlight
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};
