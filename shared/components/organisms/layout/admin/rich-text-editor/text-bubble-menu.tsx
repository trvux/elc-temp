"use client";

import { Button } from "@/shared/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/shared/components/ui/button-group";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { TextB, Eraser, TextItalic, Link as LinkIcon, List, Quotes } from "@phosphor-icons/react";
import { useCallback, useState } from "react";

interface TextBubbleMenuProps {
  editor: Editor;
}

export const TextBubbleMenu = ({ editor }: TextBubbleMenuProps) => {
  const [linkUrl, setLinkUrl] = useState("");

  // The popover input must show the link's *current* href when reopened on
  // already-linked text — otherwise it looks empty even when a (possibly
  // broken/missing-href) link mark is already there, and there's no way to
  // tell from the UI that anything needs fixing.
  const syncLinkUrlFromSelection = useCallback(() => {
    setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
  }, [editor]);

  const setLink = useCallback(() => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinkUrl("");
  }, [editor, linkUrl]);

  const stripFormatting = useCallback(() => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  const isH1 = editor.isActive("heading", { level: 2 });
  const isH2 = editor.isActive("heading", { level: 3 });

  return (
    <BubbleMenu
      editor={editor}
      className="transition-all duration-300 ease-out"
      // @ts-expect-error - Tippy options type mismatch
      tippyOptions={{
        duration: 100,
        appendTo: () => document.body,
        zIndex: 9999,
      }}
      shouldShow={({
        state,
        editor: currentEditor,
      }: {
        state: import("@tiptap/pm/state").EditorState;
        editor: Editor;
      }) => {
        const { selection } = state;
        return (
          !selection.empty &&
          !currentEditor.isActive("image") &&
          !currentEditor.isActive("table") &&
          !currentEditor.isActive("horizontalRule")
        );
      }}
    >
      <div className="tiptap-menu-wrapper">
        <ButtonGroup>
          {/* Bold */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isH1 || isH2}
            className={cn(!(isH1 || isH2) && editor.isActive("bold") ? "text-green-300" : "")}
          >
            <TextB size={16} />
          </Button>

          {/* Italic */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isH1 || isH2}
            className={cn(!(isH1 || isH2) && editor.isActive("italic") ? "text-green-300" : "")}
          >
            <TextItalic size={16} />
          </Button>

          {/* Link */}
          <Popover onOpenChange={(open) => open && syncLinkUrlFromSelection()}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="icon"
                disabled={isH1}
                className={cn(!isH1 && editor.isActive("link") ? "text-green-300" : "")}
              >
                <LinkIcon size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3 rounded-lg shadow-xl bg-primary border-muted flex flex-col gap-2">
              <Input
                placeholder="Paste or type a link..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setLink()}
                className="h-8 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-muted text-sm text-primary-foreground placeholder:text-muted-foreground"
                disabled={isH1}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="self-end"
                onClick={setLink}
                disabled={isH1}
              >
                Apply
              </Button>
            </PopoverContent>
          </Popover>

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* H2 (topmost heading available in body content) */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() =>
              editor
                .chain()
                .focus()
                .unsetMark("bold")
                .unsetMark("italic")
                .unsetMark("link")
                .toggleHeading({ level: 2 })
                .run()
            }
            className={cn(
              "font-bold text-lg",
              isH1 ? "text-green-300" : "",
            )}
          >
            T
          </Button>

          {/* H3 */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() =>
              editor
                .chain()
                .focus()
                .unsetMark("bold")
                .unsetMark("italic")
                .toggleHeading({ level: 3 })
                .run()
            }
            className={cn(
              "font-bold text-md",
              isH2 ? "text-green-300" : "",
            )}
          >
            T
          </Button>

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* Blockquote */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              editor.isActive("blockquote") ? "text-green-300" : "",
            )}
          >
            <Quotes size={16} />
          </Button>

          {/* Bullet List */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              editor.isActive("bulletList") ? "text-green-300" : "",
            )}
          >
            <List size={16} />
          </Button>

          <ButtonGroupSeparator className="bg-muted-foreground" />

          {/* Strip Formatting */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={stripFormatting}
            title="Strip Formatting"
          >
            <Eraser size={16} />
          </Button>
        </ButtonGroup>
      </div>
    </BubbleMenu>
  );
};
