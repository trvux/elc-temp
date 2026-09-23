"use client";

// From shadcn-tiptap (MIT) — icons swapped to @phosphor-icons/react,
// PopoverClose adapted to this project's `radix-ui` unified package.
import { Trash, X } from "@phosphor-icons/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import React, { type FormEvent } from "react";

import { Button } from "@/shared/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import { cn, getUrlFromString } from "@/shared/lib/utils";
import { useToolbar } from "./toolbar-provider";

const LinkToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { editor } = useToolbar();
    const [link, setLink] = React.useState("");
    const [open, setOpen] = React.useState(false);
    // Captured when the popover opens, not read fresh in handleSubmit —
    // typing in the Input doesn't touch the editor, but this stays
    // explicit rather than trusting "whatever the current selection
    // happens to be" by the time Confirm is clicked.
    const selectionRef = React.useRef<{ from: number; to: number } | null>(null);

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      const url = getUrlFromString(link);
      if (url && editor && selectionRef.current) {
        const { from, to } = selectionRef.current;
        // setLink on a COLLAPSED range (from === to — cursor placed on an
        // empty line, or just clicked inside an existing link without
        // dragging to select its text) is invalid: you can't mark zero
        // characters. That made the whole chain fail silently, including
        // .focus() never actually moving DOM focus to the editor — so
        // when the popover then closed and unmounted the still-focused
        // Input, the browser fell back to focusing the page's first
        // focusable element instead. Handle the collapsed case explicitly
        // instead of feeding setLink a range it can't do anything with:
        if (from === to) {
          if (editor.isActive("link")) {
            // Cursor sits inside an existing link's text — expand to that
            // link's full range first (the standard Tiptap idiom for
            // "update the mark under a collapsed cursor"), then reapply.
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          } else {
            // Nothing there at all — insert the URL itself as new,
            // visible link text rather than trying to mark empty space.
            editor
              .chain()
              .focus()
              .insertContentAt(from, {
                type: "text",
                text: url,
                marks: [{ type: "link", attrs: { href: url } }],
              })
              .run();
          }
        } else {
          editor.chain().focus().setTextSelection({ from, to }).setLink({ href: url }).run();
        }
      }
      setOpen(false);
    };

    React.useEffect(() => {
      setLink(editor?.getAttributes("link").href || "");
    }, [editor]);

    return (
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next && editor) {
            const { from, to } = editor.state.selection;
            selectionRef.current = { from, to };
          }
          setOpen(next);
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger
              disabled={!editor?.can().chain().setLink({ href: "" }).run()}
              asChild
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-max px-3 font-normal",
                  editor?.isActive("link") && "bg-accent",
                  className,
                )}
                ref={ref}
                {...props}
              >
                <p className="mr-2 text-base">↗</p>
                <p className="underline decoration-muted-foreground underline-offset-4">
                  Link
                </p>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <span>Link</span>
          </TooltipContent>
        </Tooltip>

        <PopoverContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
          asChild
          className="relative px-3 py-2.5"
        >
          <div className="relative">
            <PopoverPrimitive.Close className="absolute right-3 top-3">
              <X className="h-4 w-4" />
            </PopoverPrimitive.Close>
            <form onSubmit={handleSubmit}>
              <Label>Link</Label>
              <p className="text-sm text-muted-foreground">
                Attach a link to the selected text
              </p>
              <div className="mt-3 flex flex-col items-end justify-end gap-3">
                <Input
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                  }}
                  className="w-full"
                  placeholder="https://example.com"
                />
                <div className="flex items-center gap-3">
                  {editor?.getAttributes("link").href && (
                    <Button
                      type="reset"
                      size="sm"
                      className="h-8 text-muted-foreground"
                      variant="ghost"
                      onClick={() => {
                        // Same collapsed-cursor idiom as handleSubmit's
                        // update path — without extendMarkRange, a bare
                        // cursor inside the link (not a drag-selection
                        // over its text) wouldn't reliably clear the mark
                        // across the whole link.
                        editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                        setLink("");
                        setOpen(false);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                  <Button type="submit" size="sm" className="h-8">
                    {editor?.getAttributes("link").href ? "Update" : "Confirm"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

LinkToolbar.displayName = "LinkToolbar";

export { LinkToolbar };
