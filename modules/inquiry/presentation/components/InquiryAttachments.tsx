"use client";

import { useEffect, useState } from "react";
import { File as FileIcon, FilePdf, Ruler } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";

import { fileKind, formatFileSize, type InquiryAttachment } from "../../domain";
import { getInquiryAttachmentLinkAction } from "../actions";

interface InquiryAttachmentsProps {
  inquiryId: string;
  attachments: InquiryAttachment[];
}

type Link = { status: "loading" } | { status: "ready"; url: string } | { status: "expired" } | { status: "error" };

// A lead's files. A private file has no address of its own: staff get a link that works for
// five minutes. Every file is checked on open (is it still there?), and a photo keeps the link
// for its thumbnail; a PDF or a drawing asks again when the button is pressed, so the link is
// never stale by the time it is used.
export function InquiryAttachments({ inquiryId, attachments }: InquiryAttachmentsProps) {
  const [links, setLinks] = useState<Record<number, Link>>({});

  useEffect(() => {
    let cancelled = false;
    attachments.forEach((a, index) => {
      // Every private file is checked on open, so one past its 12 months says "đã hết hạn"
      // straight away instead of after a click; only a photo uses the link it gets back.
      if (!a.private) return;
      setLinks((current) => ({ ...current, [index]: { status: "loading" } }));
      void getInquiryAttachmentLinkAction(inquiryId, index).then((res) => {
        if (cancelled) return;
        setLinks((current) => ({
          ...current,
          [index]: res.data ? { status: "ready", url: res.data.url } : res.expired ? { status: "expired" } : { status: "error" },
        }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [inquiryId, attachments]);

  async function open(index: number) {
    const res = await getInquiryAttachmentLinkAction(inquiryId, index);
    if (res.data) {
      window.open(res.data.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (res.expired) {
      setLinks((current) => ({ ...current, [index]: { status: "expired" } }));
      return;
    }
    toast.error(res.error ?? "Không mở được tệp.");
  }

  return (
    <ul className="mt-2 flex flex-wrap gap-3">
      {attachments.map((a, index) => {
        const kind = fileKind(a);
        const link = links[index];

        // Legacy public photo: the address is the file, as before.
        if (!a.private && a.url) {
          return (
            <li key={index}>
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- ad-hoc public photo URLs from visitor uploads, not worth wiring into next/image's remote patterns for an admin-only thumbnail */}
                <img src={a.url} alt="" className="size-20 rounded-lg border border-border object-cover" />
              </a>
            </li>
          );
        }

        if (link?.status === "expired") {
          return (
            <li key={index} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
              <FileIcon aria-hidden="true" size={20} className="text-muted-foreground" />
              <div>
                <p className="type-body-sm text-muted-foreground">{a.name}</p>
                <p className="type-legal text-muted-foreground">Tệp đã hết hạn (lưu 12 tháng)</p>
              </div>
            </li>
          );
        }

        if (kind === "image") {
          return (
            <li key={index}>
              {link?.status === "ready" ? (
                <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Mở ảnh ${a.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL of a private file, not a next/image source */}
                  <img src={link.url} alt={a.name} className="size-20 rounded-lg border border-border object-cover" />
                </a>
              ) : (
                <div className="flex size-20 items-center justify-center rounded-lg border border-border type-legal text-muted-foreground">
                  {link?.status === "error" ? "Lỗi" : "Đang tải"}
                </div>
              )}
            </li>
          );
        }

        const Icon = kind === "pdf" ? FilePdf : kind === "cad" ? Ruler : FileIcon;
        return (
          <li key={index} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
            <Icon aria-hidden="true" size={28} className="shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="type-body-sm max-w-48 truncate">{a.name}</p>
              {a.size ? <p className="type-legal text-muted-foreground">{formatFileSize(a.size)}</p> : null}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void open(index)}>
              {kind === "cad" ? "Tải xuống" : "Mở"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
