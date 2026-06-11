"use client";

import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Trash } from "@phosphor-icons/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useCallback } from "react";

interface DividerBubbleMenuProps {
  editor: Editor;
}

export const DividerBubbleMenu = ({ editor }: DividerBubbleMenuProps) => {
  const deleteDivider = useCallback(() => {
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      className="transition-all duration-300 ease-out"
      shouldShow={({ state }: { state: import("@tiptap/pm/state").EditorState }) => {
        const { selection } = state;
        return (
          selection instanceof NodeSelection &&
          selection.node.type.name === "horizontalRule"
        );
      }}
      // @ts-expect-error - Tippy options type mismatch
      tippyOptions={{ duration: 100, offset: [0, 15] }}
    >
      <div className="tiptap-menu-wrapper">
        <ButtonGroup>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={deleteDivider}
            className="px-2 flex items-center gap-1.5 text-red-400 hover:text-red-300"
            title="Xóa đường phân cách"
          >
            <Trash className="h-4 w-4" />
            Xóa
          </Button>
        </ButtonGroup>
      </div>
    </BubbleMenu>
  );
};
