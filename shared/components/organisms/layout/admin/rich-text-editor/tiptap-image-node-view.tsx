"use client";

// Admin-only NodeView for the Image node — adapted from shadcn-tiptap's own
// extensions/image.tsx (MIT), icons swapped to @phosphor-icons/react.
// Align matches the demo's left/center/right + resize-handle model
// (replacing this project's old center/wide/full breakout model — see
// createImageExtension's comment in tiptap-render.ts for why the two can't
// coexist). Alt-text stays in the fixed toolbar's Image Popover
// (shared/.../toolbars/image.tsx) since a dropdown crammed onto the image
// itself has no room for a real text input.
import type { Editor } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  ArrowsOut,
  Copy,
  DotsThreeVertical,
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
  const { node, editor, selected, deleteNode, updateAttributes } = props;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [resizing, setResizing] = useState(false);
  const [resizingPosition, setResizingPosition] = useState<"left" | "right">("left");
  const [resizeInitialWidth, setResizeInitialWidth] = useState(0);
  const [resizeInitialMouseX, setResizeInitialMouseX] = useState(0);
  const [openedMore, setOpenedMore] = useState(false);

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

            <div
              className={cn(
                "absolute right-3 top-3 flex items-center gap-1 rounded-md border bg-background p-1 opacity-0 shadow-xs transition-opacity",
                !resizing && "group-hover:opacity-100",
                (openedMore || selected) && "opacity-100",
              )}
            >
              <Button
                size="icon"
                variant="ghost"
                className={cn("size-7", align === "left" && "bg-accent")}
                onClick={() => updateAttributes({ align: "left" })}
                title="Align left"
              >
                <TextAlignLeft className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={cn("size-7", align === "center" && "bg-accent")}
                onClick={() => updateAttributes({ align: "center" })}
                title="Align center"
              >
                <TextAlignCenter className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={cn("size-7", align === "right" && "bg-accent")}
                onClick={() => updateAttributes({ align: "right" })}
                title="Align right"
              >
                <TextAlignRight className="size-4" />
              </Button>

              <Separator orientation="vertical" className="h-5" />

              <DropdownMenu open={openedMore} onOpenChange={setOpenedMore}>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-7">
                    <DotsThreeVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                {/* This project's DropdownMenuContent defaults to
                    w-(--radix-dropdown-menu-trigger-width) — same fix as
                    heading.tsx/alignment.tsx: override width here, not on
                    an inner element, or "Full Screen"/"Delete Image" wrap
                    to two lines instead of fitting on one. */}
                <DropdownMenuContent align="end" className="w-44 text-sm">
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
