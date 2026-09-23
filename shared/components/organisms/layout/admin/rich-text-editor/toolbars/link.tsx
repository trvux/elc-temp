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

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      const url = getUrlFromString(link);
      if (url) {
        editor?.chain().focus().setLink({ href: url }).run();
      }
    };

    React.useEffect(() => {
      setLink(editor?.getAttributes("link").href || "");
    }, [editor]);

    return (
      <Popover>
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
                        editor?.chain().focus().unsetLink().run();
                        setLink("");
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                  <Button size="sm" className="h-8">
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
