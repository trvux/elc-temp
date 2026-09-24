"use client";

// Authored for this project — shadcn-tiptap has no Heading dropdown at all.
// Follows the identical useToolbar()+Button+DropdownMenu pattern used by
// alignment.tsx, replicating the H2/H3 mark-stripping business logic that
// previously lived in text-bubble-menu.tsx.
import { CaretDown, Check, TextAa, TextHTwo, TextHThree } from "@phosphor-icons/react";
import { useRef } from "react";

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

export const HeadingToolbar = () => {
  const { editor } = useToolbar();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const isH2 = editor?.isActive("heading", { level: 2 }) ?? false;
  const isH3 = editor?.isActive("heading", { level: 3 }) ?? false;

  const setParagraph = () => {
    editor?.chain().focus().setParagraph().run();
  };

  const setH2 = () => {
    editor
      ?.chain()
      .focus()
      .unsetMark("bold")
      .unsetMark("italic")
      .unsetMark("link")
      .toggleHeading({ level: 2 })
      .run();
  };

  const setH3 = () => {
    editor
      ?.chain()
      .focus()
      .unsetMark("bold")
      .unsetMark("italic")
      .toggleHeading({ level: 3 })
      .run();
  };

  const options = [
    {
      name: "Normal text",
      icon: <TextAa className="h-4 w-4" />,
      isActive: !isH2 && !isH3,
      onSelect: setParagraph,
    },
    {
      name: "Heading 2",
      icon: <TextHTwo className="h-4 w-4" />,
      isActive: isH2,
      onSelect: setH2,
    },
    {
      name: "Heading 3",
      icon: <TextHThree className="h-4 w-4" />,
      isActive: isH3,
      onSelect: setH3,
    },
  ];

  const current = options.find((option) => option.isActive) ?? options[0];

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger disabled={!editor} asChild>
            {/* Fixed width, not w-max — same reflow issue as
                alignment.tsx: "Normal text"/"Heading 2"/"Heading 3" differ
                enough to shift every button after this one when switched.
                150px, not 120px — 120 was still narrow enough to truncate
                "Normal text" and "Left Align" to "Norm…"/"Left Ali…". */}
            <Button ref={triggerRef} variant="ghost" size="sm" className="h-8 w-[150px] justify-start font-normal">
              <span className="mr-2 shrink-0">{current.icon}</span>
              <span className="truncate">{current.name}</span>
              <CaretDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Heading</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        loop
        // This project's DropdownMenuContent defaults to
        // w-(--radix-dropdown-menu-trigger-width), which is narrower than
        // the content this dropdown needs — override it here (not on the
        // inner group) so the checkmark has room instead of getting
        // clipped by the content's own overflow-x-hidden.
        className="w-40"
        // Explicitly restores focus to this trigger — see link.tsx's
        // identical fix for why a bare preventDefault() caused this
        // Dialog-nested dropdown's close to jump focus elsewhere on the
        // page instead.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuItem key={option.name} onSelect={option.onSelect}>
              <span className="mr-2">{option.icon}</span>
              {option.name}
              {option.isActive && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
