"use client";

// From shadcn-tiptap (MIT) — icon swapped to @phosphor-icons/react.
import {
  CaretDown,
  Check,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
} from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useToolbar } from "./toolbar-provider";

export const AlignmentTooolbar = () => {
  const { editor } = useToolbar();
  const handleAlign = (value: string) => {
    editor?.chain().focus().setTextAlign(value).run();
  };

  const isDisabled = (editor?.isActive("image") || !editor) ?? false;

  const currentTextAlign = () => {
    if (editor?.isActive({ textAlign: "left" })) {
      return "left";
    }
    if (editor?.isActive({ textAlign: "center" })) {
      return "center";
    }
    if (editor?.isActive({ textAlign: "right" })) {
      return "right";
    }
    if (editor?.isActive({ textAlign: "justify" })) {
      return "justify";
    }

    return "left";
  };

  const alignmentOptions = [
    {
      name: "Left Align",
      value: "left",
      icon: <TextAlignLeft className="h-4 w-4" />,
    },
    {
      name: "Center Align",
      value: "center",
      icon: <TextAlignCenter className="h-4 w-4" />,
    },
    {
      name: "Right Align",
      value: "right",
      icon: <TextAlignRight className="h-4 w-4" />,
    },
    {
      name: "Justify Align",
      value: "justify",
      icon: <TextAlignJustify className="h-4 w-4" />,
    },
  ];

  const findIndex = (value: string) => {
    return alignmentOptions.findIndex((option) => option.value === value);
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger disabled={isDisabled} asChild>
            {/* Fixed width, not w-max — "Left Align" vs "Justify Align"
                differ enough in text length that letting the button
                auto-size shifted every button after it in the toolbar
                row each time the selected option changed. */}
            <Button variant="ghost" size="sm" className="h-8 w-[132px] justify-start font-normal">
              <span className="mr-2 shrink-0">
                {alignmentOptions[findIndex(currentTextAlign())].icon}
              </span>
              <span className="truncate">
                {alignmentOptions[findIndex(currentTextAlign())].name}
              </span>
              <CaretDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Text Alignment</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        loop
        // See heading.tsx's identical comment — this project's
        // DropdownMenuContent defaults to trigger-width, so the width
        // override has to live here, not on the inner group.
        className="w-40"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DropdownMenuGroup>
          {alignmentOptions.map((option, index) => (
            <DropdownMenuItem
              onSelect={() => {
                handleAlign(option.value);
              }}
              key={index}
            >
              <span className="mr-2">{option.icon}</span>
              {option.name}

              {option.value === currentTextAlign() && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
