"use client";

// Admin-only — adapted from shadcn-tiptap's own extensions/image-placeholder.tsx
// (MIT): the toolbar Image button inserts this node, which shows an "Add an
// image" bar; clicking it opens Upload/Embed link tabs, matching
// https://tiptap.niazmorshed.dev/ exactly. Upload swapped from the demo's
// plain FileReader-to-dataURL fallback for this project's real backend
// (convertToWebP + the uploadImage prop threaded in from rich-text-editor.tsx),
// keeping the dataURL fallback only for when no uploadImage prop is given.
import {
  type CommandProps,
  type Editor,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import {
  Image as ImageIcon,
  LinkSimple,
  UploadSimple,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { convertToWebP } from "@/shared/lib/image";
import { cn, isValidUrl } from "@/shared/lib/utils";

export interface ImagePlaceholderOptions {
  HTMLAttributes: Record<string, unknown>;
  uploadImage?: (file: File) => Promise<string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
  name: "image-placeholder",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagePlaceholderComponent);
  },

  addCommands() {
    return {
      insertImagePlaceholder:
        () =>
        (props: CommandProps) =>
          props.commands.insertContent({ type: "image-placeholder" }),
    };
  },
});

async function resolveUploadedUrl(
  file: File,
  uploadImage: ((file: File) => Promise<string>) | undefined,
): Promise<string> {
  const webpFile = await convertToWebP(file);
  if (uploadImage) {
    return uploadImage(webpFile);
  }
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.readAsDataURL(webpFile);
  });
}

function ImagePlaceholderComponent(props: NodeViewProps) {
  const { editor, extension, getPos, node } = props;
  const uploadImage = (extension.options as ImagePlaceholderOptions).uploadImage;

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Replaces this exact placeholder node with one or more real image
  // nodes — a plain insertContent/setImage call only inserts at the
  // current selection, which doesn't reliably still point at this node.
  const replacePlaceholderWithImages = (srcs: string[]) => {
    const editorInstance: Editor = editor;
    const pos = getPos();
    if (typeof pos !== "number") return;

    const { schema } = editorInstance.state;
    const imageNodes = srcs.map((src) => schema.nodes.image.create({ src }));
    const tr = editorInstance.state.tr.replaceWith(
      pos,
      pos + node.nodeSize,
      imageNodes,
    );
    editorInstance.view.dispatch(tr);
    editorInstance.commands.focus();
  };

  const handleAcceptedFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const srcs: string[] = [];
      for (const file of files) {
        try {
          srcs.push(await resolveUploadedUrl(file, uploadImage));
        } catch (error) {
          // A stale tab open across a deploy calls a Server Action ID the
          // new server build no longer recognizes — silently swallowing
          // this (the old behavior) just reverted the button back to
          // "Drag & drop" with zero indication anything went wrong. Telling
          // the admin to reload is the actual fix for THIS error specifically,
          // not a generic "try again" (retrying without reloading fails the
          // same way every time).
          const message =
            error instanceof Error && error.message.includes("Failed to find Server Action")
              ? "Trang đã cũ do có bản cập nhật mới — vui lòng tải lại trang rồi upload lại."
              : `Tải ảnh lên thất bại${files.length > 1 ? ` (${file.name})` : ""}.`;
          toast.error(message);
        }
      }
      if (srcs.length > 0) {
        replacePlaceholderWithImages(srcs);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    handleAcceptedFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleAcceptedFiles(files);
  };

  const handleInsertEmbed = () => {
    if (!isValidUrl(url)) {
      setUrlError(true);
      return;
    }
    replacePlaceholderWithImages([url]);
  };

  return (
    <NodeViewWrapper className="w-full">
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className="w-full">
          <div className="flex cursor-pointer items-center gap-3 rounded-md bg-accent p-2 py-3 text-sm text-accent-foreground transition-colors hover:bg-secondary">
            <ImageIcon className="h-5 w-5" />
            Add an image
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[420px] px-0 py-2"
          onPointerDownOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <Tabs defaultValue="upload" className="px-3">
            <TabsList>
              <TabsTrigger value="upload">
                <UploadSimple className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkSimple className="mr-2 h-4 w-4" />
                Embed link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "my-2 rounded-md border border-dashed text-sm transition-colors hover:bg-secondary",
                  isDragActive && "border-primary bg-secondary",
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="image-placeholder-file-input"
                  disabled={uploading}
                />
                <label
                  htmlFor="image-placeholder-file-input"
                  className="flex h-28 w-full cursor-pointer flex-col items-center justify-center text-center"
                >
                  <UploadSimple className="mx-auto mb-2 h-6 w-6" />
                  {uploading ? "Đang tải lên…" : "Drag & drop or click to upload"}
                </label>
              </div>
            </TabsContent>

            <TabsContent value="url">
              {/* Not a <form> — same reasoning as tiptap-image-node-view.tsx's
                  alt-text/caption mini-forms: a real <form> here (even with
                  an already-type="button" Embed button) still lets Enter in
                  the Input trigger a submit event that a nested-form-in-
                  portal situation can hand off to the OUTER article-edit
                  form instead of just this one. Plain div + onKeyDown has no
                  form-submission semantics to inherit at all. */}
              <div
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInsertEmbed();
                  }
                }}
              >
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) setUrlError(false);
                  }}
                  placeholder="Paste the image link..."
                />
                {urlError && (
                  <p className="py-1.5 text-xs text-destructive">
                    Please enter a valid URL
                  </p>
                )}
                <Button
                  onClick={handleInsertEmbed}
                  type="button"
                  size="sm"
                  className="my-2 h-8 w-full p-2 text-xs"
                >
                  Embed Image
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Works with any image from the web
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}
