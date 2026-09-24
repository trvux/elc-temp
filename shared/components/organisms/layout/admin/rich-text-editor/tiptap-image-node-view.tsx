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
import { useReassertFocus } from "@/shared/hooks/use-reassert-focus";
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
  const { node, editor, deleteNode, updateAttributes, getPos } = props;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [resizing, setResizing] = useState(false);
  const [resizingPosition, setResizingPosition] = useState<"left" | "right">("left");
  const [resizeInitialWidth, setResizeInitialWidth] = useState(0);
  const [resizeInitialMouseX, setResizeInitialMouseX] = useState(0);
  const [radiusResizing, setRadiusResizing] = useState(false);
  const [radiusInitialValue, setRadiusInitialValue] = useState(0);
  const [radiusInitialMouseX, setRadiusInitialMouseX] = useState(0);
  const [radiusInitialMouseY, setRadiusInitialMouseY] = useState(0);
  const [openedMore, setOpenedMore] = useState(false);
  const [altFormOpen, setAltFormOpen] = useState(false);
  const [altDraft, setAltDraft] = useState("");
  const { ref: moreButtonRef, reassertFocus: reassertFocusToMoreButton } =
    useReassertFocus<HTMLButtonElement>();

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

  // Corner-radius handle: no fixed rounding baked in for every image
  // regardless of subject (a blueprint/diagram reads wrong with the same
  // rounding that suits a product photo), so this hands the choice to
  // whoever placed the image instead. Delta-based, same idiom as the width
  // handles above (radiusInitialValue/radiusInitialMouseX/Y captured once
  // on mousedown, every subsequent move adds to that starting point) — NOT
  // computed as an absolute distance from the image's corner to the
  // pointer's current position, which was the first attempt here and had a
  // real bug: since the handle's own on-screen position doesn't move as
  // the radius changes, grabbing it mid-drag on a second attempt measured
  // distance from wherever the pointer happened to land near that fixed
  // handle, not from the radius already set — so every second drag
  // visibly snapped back toward 0 before tracking the mouse again, instead
  // of continuing from where the first drag left off.
  function startRadiusResize(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setRadiusResizing(true);
    setRadiusInitialValue(node.attrs.borderRadius ?? 0);
    setRadiusInitialMouseX(e.clientX);
    setRadiusInitialMouseY(e.clientY);
  }

  function computeNewRadius(clientX: number, clientY: number) {
    if (!imageRef.current) return null;
    // Moving toward the image's center (up-left, away from the bottom-
    // right corner the handle sits on) increases the radius; moving back
    // toward the corner decreases it. Averaging the two axes means a purely
    // horizontal or vertical drag still tracks intuitively instead of only
    // responding to an exact diagonal.
    const dx = radiusInitialMouseX - clientX;
    const dy = radiusInitialMouseY - clientY;
    const delta = (dx + dy) / 2;
    const rect = imageRef.current.getBoundingClientRect();
    const maxRadius = Math.min(rect.width, rect.height) / 2;
    return Math.max(0, Math.min(radiusInitialValue + delta, maxRadius));
  }

  function resizeRadius(e: MouseEvent) {
    if (!radiusResizing) return;
    const radius = computeNewRadius(e.clientX, e.clientY);
    if (radius !== null) updateAttributes({ borderRadius: Math.round(radius) });
  }

  function endRadiusResize() {
    setRadiusResizing(false);
  }

  function handleRadiusTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRadiusResizing(true);
    setRadiusInitialValue(node.attrs.borderRadius ?? 0);
    setRadiusInitialMouseX(e.touches[0].clientX);
    setRadiusInitialMouseY(e.touches[0].clientY);
  }

  function handleRadiusTouchMove(e: TouchEvent) {
    if (!radiusResizing) return;
    const touch = e.touches[0];
    const radius = computeNewRadius(touch.clientX, touch.clientY);
    if (radius !== null) updateAttributes({ borderRadius: Math.round(radius) });
  }

  function handleRadiusTouchEnd() {
    setRadiusResizing(false);
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

  useEffect(() => {
    window.addEventListener("mousemove", resizeRadius);
    window.addEventListener("mouseup", endRadiusResize);
    window.addEventListener("touchmove", handleRadiusTouchMove);
    window.addEventListener("touchend", handleRadiusTouchEnd);
    return () => {
      window.removeEventListener("mousemove", resizeRadius);
      window.removeEventListener("mouseup", endRadiusResize);
      window.removeEventListener("touchmove", handleRadiusTouchMove);
      window.removeEventListener("touchend", handleRadiusTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusResizing]);

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
          style={{
            ...(ratio ? { aspectRatio: ratio, objectFit: "cover" as const } : {}),
            width: "100%",
            // Explicit borderRadius (once the corner handle has been
            // dragged) overrides the className's default rounded-sm —
            // undefined here just lets that default keep applying.
            ...(node.attrs.borderRadius !== null && node.attrs.borderRadius !== undefined
              ? { borderRadius: `${node.attrs.borderRadius}px` }
              : {}),
          }}
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

            {/* Corner-radius handle — a free-drag control instead of a
                fixed rounding baked into every image, since a blueprint/
                diagram reads wrong with the same corners that suit a
                product photo. Bottom-right only (matches the single-handle
                convention most design tools use for uniform corner
                rounding); shows the live px value while dragging so the
                exact number is never a guess. */}
            <div
              className="absolute bottom-0 right-0 z-20 flex size-6 cursor-nwse-resize items-end justify-end p-1.5"
              onMouseDown={startRadiusResize}
              onTouchStart={handleRadiusTouchStart}
            >
              <div
                className={cn(
                  "z-20 size-2.5 rounded-full border bg-foreground/60 opacity-0 transition-opacity",
                  !resizing && "group-hover:opacity-100",
                  radiusResizing && "opacity-100",
                )}
              />
            </div>
            {radiusResizing && (
              <div className="pointer-events-none absolute bottom-8 right-3 z-20 rounded-md bg-background px-2 py-1 text-xs font-medium shadow-xs">
                {Math.round(node.attrs.borderRadius ?? 0)}px
              </div>
            )}

            {/* Hover-only, matching the actual reference behavior — a
                previous attempt also showed this on `selected` (assumed
                from static reference screenshots, which don't capture
                cursor position), but live testing against the real demo
                confirmed it's hover-only there too. Keeping `openedMore`
                so the bar doesn't vanish while the "..." dropdown itself
                is open (its content is portaled outside this element, so
                the mouse may no longer be over the image while using it). */}
            <div
              className={cn(
                "absolute right-3 top-3 flex items-center gap-1 rounded-lg border bg-background p-1 opacity-0 shadow-xs transition-opacity",
                !resizing && "group-hover:opacity-100",
                openedMore && "opacity-100",
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
                  <Button ref={moreButtonRef} size="icon" variant="ghost" className="size-8">
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
                  // Explicitly returning focus to the "..." trigger here
                  // (Radix's own default, which a bare preventDefault()
                  // discarded) matters more than it looks: this dropdown
                  // sits inside the admin edit Dialog, and leaving focus
                  // with nowhere safe to land after a close let the
                  // Dialog's own FocusScope fall back to jumping focus to
                  // its first tabbable field elsewhere on the page — the
                  // same root cause diagnosed (and fixed the same way) for
                  // the Link toolbar's Confirm button.
                  onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    reassertFocusToMoreButton();
                  }}
                >
                  {altFormOpen ? (
                    <form
                      className="flex flex-col gap-2 p-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        // Focus the "..." trigger BEFORE closing — same
                        // reasoning as link.tsx's identical fix: moving
                        // focus off the still-mounted Input first means
                        // this dropdown's content never holds active focus
                        // at the moment it unmounts, so the admin Dialog's
                        // focus-trap fallback (jump to its first field) has
                        // nothing to react to, instead of just cleaning up
                        // its result a moment later and leaving a visible
                        // double-jump.
                        reassertFocusToMoreButton();
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
