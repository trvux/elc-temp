"use client";

// Admin-only NodeView for the Image node — adapted from shadcn-tiptap's own
// extensions/image.tsx (MIT), icons swapped to @phosphor-icons/react.
// Align matches the demo's left/center/right + resize-handle model
// (replacing this project's old center/wide/full breakout model — see
// createImageExtension's comment in tiptap-render.ts for why the two can't
// coexist). Alt-text lives in this same "..." dropdown (its own small form,
// swapped in for the item list — see altFormOpen below) rather than a
// separate fixed-toolbar button.
import type { Editor } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  ArrowsOut,
  Copy,
  DotsThreeVertical,
  TextAa,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  Trash,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

function duplicateContent(editor: Editor) {
  const { view } = editor;
  const { state } = view;
  const { selection } = state;

  editor
    .chain()
    .insertContentAt(
      selection.to,
      selection.content().content.firstChild?.toJSON(),
      { updateSelection: true },
    )
    .focus(selection.to)
    .run();
}

const MIN_WIDTH = 150;

export function TiptapImageNodeView(props: NodeViewProps) {
  const { node, editor, selected, deleteNode, updateAttributes, getPos } = props;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [resizing, setResizing] = useState(false);
  const [resizingPosition, setResizingPosition] = useState<"left" | "right">("left");
  const [resizeInitialWidth, setResizeInitialWidth] = useState(0);
  const [resizeInitialMouseX, setResizeInitialMouseX] = useState(0);
  const [openedMore, setOpenedMore] = useState(false);
  const [altFormOpen, setAltFormOpen] = useState(false);
  const [altDraft, setAltDraft] = useState("");

  function startResize(e: React.MouseEvent<HTMLDivElement>, position: "left" | "right") {
    e.preventDefault();
    setResizing(true);
    setResizingPosition(position);
    setResizeInitialMouseX(e.clientX);
    if (imageRef.current) {
      setResizeInitialWidth(imageRef.current.offsetWidth);
    }
  }

  function resize(e: MouseEvent) {
    if (!resizing) return;
    let dx = e.clientX - resizeInitialMouseX;
    if (resizingPosition === "left") dx = resizeInitialMouseX - e.clientX;

    const newWidth = Math.max(resizeInitialWidth + dx, MIN_WIDTH);
    const parentWidth = nodeRef.current?.parentElement?.offsetWidth || 0;

    if (newWidth < parentWidth) {
      updateAttributes({ width: newWidth });
    }
  }

  function endResize() {
    setResizing(false);
    setResizeInitialMouseX(0);
    setResizeInitialWidth(0);
  }

  function handleTouchStart(e: React.TouchEvent, position: "left" | "right") {
    e.preventDefault();
    setResizing(true);
    setResizingPosition(position);
    setResizeInitialMouseX(e.touches[0].clientX);
    if (imageRef.current) {
      setResizeInitialWidth(imageRef.current.offsetWidth);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (!resizing) return;
    let dx = e.touches[0].clientX - resizeInitialMouseX;
    if (resizingPosition === "left") dx = resizeInitialMouseX - e.touches[0].clientX;

    const newWidth = Math.max(resizeInitialWidth + dx, MIN_WIDTH);
    const parentWidth = nodeRef.current?.parentElement?.offsetWidth || 0;

    if (newWidth < parentWidth) {
      updateAttributes({ width: newWidth });
    }
  }

  function handleTouchEnd() {
    setResizing(false);
    setResizeInitialMouseX(0);
    setResizeInitialWidth(0);
  }

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", endResize);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", endResize);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizing, resizeInitialMouseX, resizeInitialWidth]);

  // Legacy content may still carry the old "wide"/"full" values — treat
  // them as "center" here too so the toolbar highlights something sane
  // instead of none of the three buttons.
  const align = ["left", "center", "right"].includes(node.attrs.align)
    ? node.attrs.align
    : "center";
  const ratio = node.attrs.ratio && node.attrs.ratio !== "auto" ? node.attrs.ratio : undefined;

  return (
    <NodeViewWrapper
      ref={nodeRef}
      className={cn(
        "tiptap-image-node-view my-8 block",
        align === "left" && "mr-auto ml-0",
        align === "center" && "mx-auto",
        align === "right" && "ml-auto mr-0",
      )}
      style={node.attrs.width ? { width: node.attrs.width, maxWidth: "100%" } : undefined}
    >
      <div className="group relative flex flex-col rounded-sm">
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          title={node.attrs.title}
          style={ratio ? { aspectRatio: ratio, objectFit: "cover", width: "100%" } : { width: "100%" }}
          className="rounded-sm"
        />
        {node.attrs.title && (
          <figcaption className="text-center text-sm text-muted-foreground">
            {node.attrs.title}
          </figcaption>
        )}

        {editor?.isEditable && (
          <>
            <div
              className="absolute inset-y-0 left-0 z-20 flex w-[25px] cursor-col-resize items-center justify-start p-2"
              onMouseDown={(e) => startResize(e, "left")}
              onTouchStart={(e) => handleTouchStart(e, "left")}
            >
              <div className="z-20 h-[70px] w-1 rounded-xl border bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div
              className="absolute inset-y-0 right-0 z-20 flex w-[25px] cursor-col-resize items-center justify-end p-2"
              onMouseDown={(e) => startResize(e, "right")}
              onTouchStart={(e) => handleTouchStart(e, "right")}
            >
              <div className="z-20 h-[70px] w-1 rounded-xl border bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            {/* Computed as a plain boolean rather than relying on
                tailwind-merge to resolve "opacity-0" vs "opacity-100" vs
                "group-hover:opacity-100" all landing in the same cn()
                call — kept the bar effectively hover-only in practice
                (the overlay should also stay visible whenever the image
                is selected, not just hovered). */}
            <div
              className={cn(
                "absolute right-3 top-3 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-xs transition-opacity",
                openedMore || selected
                  ? "opacity-100"
                  : cn("opacity-0", !resizing && "group-hover:opacity-100"),
              )}
            >
              <Button
                size="icon"
                variant="ghost"
                className={cn("size-8", align === "left" && "bg-accent")}
                onClick={() => updateAttributes({ align: "left" })}
                title="Align left"
              >
                <TextAlignLeft className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={cn("size-8", align === "center" && "bg-accent")}
                onClick={() => updateAttributes({ align: "center" })}
                title="Align center"
              >
                <TextAlignCenter className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={cn("size-8", align === "right" && "bg-accent")}
                onClick={() => updateAttributes({ align: "right" })}
                title="Align right"
              >
                <TextAlignRight className="size-4" />
              </Button>

              <Separator orientation="vertical" className="h-5" />

              <DropdownMenu
                open={openedMore}
                onOpenChange={(next) => {
                  setOpenedMore(next);
                  if (!next) setAltFormOpen(false);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-8">
                    <DotsThreeVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                {/* This project's DropdownMenuContent defaults to
                    w-(--radix-dropdown-menu-trigger-width) — same fix as
                    heading.tsx/alignment.tsx: override width here, not on
                    an inner element, or the items wrap/look cramped
                    instead of matching the roomier reference design. A
                    bigger sideOffset gives it breathing room from the
                    pill above it instead of touching. */}
                <DropdownMenuContent
                  sideOffset={8}
                  align="end"
                  className="w-44"
                  // Always prevent, not just while altFormOpen — that
                  // state is already false by the time this fires (it's
                  // set in the very same handler that triggers the
                  // close), so the condition never actually held: Radix's
                  // default was returning focus to the "..." trigger on
                  // every close, including right after Confirm, which
                  // visibly jerked the whole page's scroll position.
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {altFormOpen ? (
                    <form
                      className="flex flex-col gap-2 p-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        // Plain updateAttributes() here let the
                        // NodeSelection get lost the moment the focused
                        // <Input> unmounts (dropdown closing) — ProseMirror
                        // fell back to a selection near the document
                        // start, and the browser then scrolled the page
                        // there once focus returned. Explicitly re-select
                        // this exact node by its own position first so the
                        // update can't land anywhere else.
                        const pos = getPos();
                        if (typeof pos === "number") {
                          editor.chain().setNodeSelection(pos).updateAttributes("image", { alt: altDraft }).run();
                        } else {
                          updateAttributes({ alt: altDraft });
                        }
                        setAltFormOpen(false);
                        setOpenedMore(false);
                      }}
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        Alt text
                      </span>
                      <Input
                        autoFocus
                        value={altDraft}
                        onChange={(e) => setAltDraft(e.target.value)}
                        placeholder="What's in this image?"
                        className="h-9 text-sm"
                      />
                      <Button type="submit" size="sm" className="mt-1">
                        Confirm
                      </Button>
                    </form>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setAltDraft(node.attrs.alt || "");
                          setAltFormOpen(true);
                        }}
                      >
                        <TextAa className="mr-2 size-4" /> Add alt
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateContent(editor)}>
                        <Copy className="mr-2 size-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateAttributes({ width: "fit-content" })}>
                        <ArrowsOut className="mr-2 size-4" /> Full Screen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => deleteNode()}
                      >
                        <Trash className="mr-2 size-4" /> Delete Image
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
