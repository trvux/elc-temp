"use client";

// From shadcn-tiptap (MIT) — icons swapped to @phosphor-icons/react.
import { ArrowLeft, ArrowRight, Repeat, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Separator } from "@/shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { SearchAndReplaceStorage } from "./search-and-replace";
import { useToolbar } from "./toolbar-provider";

interface SearchAndReplaceToolbarProps {
  className?: string;
}

export function SearchAndReplaceToolbar({ className }: SearchAndReplaceToolbarProps = {}) {
  const { editor } = useToolbar();

  const [open, setOpen] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [checked, setChecked] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const results = editor?.storage?.searchAndReplace
    .results as SearchAndReplaceStorage["results"];
  const selectedResult = editor?.storage?.searchAndReplace
    .selectedResult as SearchAndReplaceStorage["selectedResult"];

  const replace = () => editor?.chain().replace().run();
  const replaceAll = () => editor?.chain().replaceAll().run();
  const selectNext = () => editor?.chain().selectNextResult().run();
  const selectPrevious = () => editor?.chain().selectPreviousResult().run();

  useEffect(() => {
    editor?.chain().setSearchTerm(searchText).run();
  }, [searchText, editor]);

  useEffect(() => {
    editor?.chain().setReplaceTerm(replaceText).run();
  }, [replaceText, editor]);

  useEffect(() => {
    editor?.chain().setCaseSensitive(checked).run();
  }, [checked, editor]);

  const closeAndReset = () => {
    setOpen(false);
    setReplaceText("");
    setSearchText("");
    setReplacing(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
        } else {
          closeAndReset();
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger disabled={!editor} asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              size="sm"
              className={cn("h-8 w-max px-3 font-normal", className)}
            >
              <Repeat className="mr-2 h-4 w-4" />
              <p>Search & Replace</p>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Search & Replace</span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        // Explicitly restores focus to this trigger — see link.tsx's
        // identical fix and its comment for why a bare preventDefault()
        // here caused this Dialog-nested popover's close to jump focus to
        // an unrelated field elsewhere on the page.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus();
        }}
        onEscapeKeyDown={() => {
          closeAndReset();
        }}
        className="relative flex w-[400px] px-3 py-2.5"
      >
        {!replacing ? (
          <div className={cn("relative flex gap-1.5 items-center")}>
            <Input
              value={searchText}
              className="w-48"
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
              placeholder="Search..."
            />
            <span>
              {results?.length === 0 ? selectedResult : selectedResult + 1}/
              {results?.length}
            </span>
            <Button
              onClick={selectPrevious}
              size="icon"
              variant="ghost"
              className="size-7"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Button
              onClick={selectNext}
              size="icon"
              className="size-7"
              variant="ghost"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-7 mx-0.5" />
            <Button
              onClick={() => {
                setReplacing(true);
              }}
              size="icon"
              className="size-7"
              variant="ghost"
            >
              <Repeat className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                closeAndReset();
              }}
              size="icon"
              className="size-7"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className={cn("relative w-full")}>
            <X
              onClick={() => {
                closeAndReset();
              }}
              className="absolute right-3 top-3 h-4 w-4 cursor-pointer"
            />
            <div className="flex w-full items-center gap-3">
              <Button
                size="icon"
                className="size-7 rounded-full"
                variant="ghost"
                onClick={() => {
                  setReplacing(false);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-medium">Search and replace</h2>
            </div>

            <div className="my-2 w-full">
              <div className="mb-3">
                <Label className="mb-1 text-xs text-muted-foreground">
                  Search
                </Label>
                <Input
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                  }}
                  placeholder="Search..."
                />
                {results?.length === 0 ? selectedResult : selectedResult + 1}/
                {results?.length}
              </div>
              <div className="mb-2">
                <Label className="mb-1 text-xs text-muted-foreground">
                  Replace with
                </Label>
                <Input
                  className="w-full"
                  value={replaceText}
                  onChange={(e) => {
                    setReplaceText(e.target.value);
                  }}
                  placeholder="Replace..."
                />
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(checked: boolean) => {
                    setChecked(checked);
                  }}
                  id="match_case"
                />
                <Label
                  htmlFor="match_case"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Match case
                </Label>
              </div>
            </div>

            <div className="actions mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={selectPrevious}
                  size="icon"
                  className="h-7 w-7"
                  variant="secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={selectNext}
                  size="icon"
                  className="h-7 w-7"
                  variant="secondary"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="main-actions flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  variant="secondary"
                  onClick={replaceAll}
                >
                  Replace All
                </Button>
                <Button
                  onClick={replace}
                  size="sm"
                  className="h-7 px-3 text-xs"
                >
                  Replace
                </Button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
