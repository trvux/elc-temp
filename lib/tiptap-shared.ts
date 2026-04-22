import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";

export const getTiptapExtensions = () => [
  StarterKit.configure({
    heading: {
      levels: [1, 2],
    },
    horizontalRule: false,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-primary underline underline-offset-4 cursor-pointer",
    },
  }),
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        align: {
          default: "center",
          renderHTML: (attributes) => {
            const classes = cn(
              "my-12 transition-all duration-500 ease-in-out block",
              attributes.align === "center" && "mx-auto max-w-full rounded-sm",
              attributes.align === "wide" &&
                "w-full md:w-[calc(100%+160px)] md:-mx-20 max-w-none rounded-sm",
              attributes.align === "full" &&
                "w-screen max-w-none -ml-[calc((100vw-100%)/2)] -mr-[calc((100vw-100%)/2)] rounded-none",
            );
            return {
              "data-align": attributes.align,
              class: classes,
            };
          },
          parseHTML: (element) =>
            element.getAttribute("data-align") || "center",
        },
      };
    },
  }).configure({
    HTMLAttributes: {
      class: "h-auto transition-all duration-500 ease-in-out rounded-sm",
    },
  }),
  HorizontalRule.extend({
    parseHTML() {
      return [{ tag: 'div[class*="section-divider"]' }, { tag: "hr" }];
    },
    renderHTML() {
      return [
        "div",
        {
          class: "section-divider py-8 text-center text-xl tracking-widest opacity-40",
        },
        "...",
      ];
    },
  }),
  Table.configure({
    resizable: typeof window !== "undefined",
    HTMLAttributes: {
      class: "border-collapse table-fixed w-full my-8",
    },
  }),
  TableRow,
  TableHeader,
  TableCell,
];
