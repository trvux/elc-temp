"use client";

import { useRef, useState } from "react";
import { CircleNotch, Plus, X } from "@phosphor-icons/react";
import { toast } from "sonner";

import { uploadInquiryAttachmentAction } from "../../actions";

const MAX_ATTACHMENTS = 6;

interface AttachmentItem {
  localId: string;
  previewUrl: string;
  status: "uploading" | "done";
  url?: string;
}

interface AttachmentStepProps {
  question: string;
  urls: string[];
  onChange: (urls: string[]) => void;
}

// Photos upload immediately on selection (before the inquiry itself
// exists) — a visitor who abandons the flow leaves an orphaned file in R2,
// accepted trade-off at this traffic volume (see plan doc for the future
// cleanup-job shape if it's ever worth building).
export function AttachmentStep({ question, urls, onChange }: AttachmentStepProps) {
  const [items, setItems] = useState<AttachmentItem[]>(() =>
    urls.map((url) => ({ localId: url, previewUrl: url, status: "done" as const, url })),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(next: AttachmentItem[]) {
    setItems(next);
    onChange(next.filter((i) => i.status === "done" && i.url).map((i) => i.url!));
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_ATTACHMENTS - items.length;
    const toUpload = Array.from(files).slice(0, remaining);

    const pending: AttachmentItem[] = toUpload.map((file) => ({
      localId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));
    const next = [...items, ...pending];
    commit(next);

    pending.forEach((item, idx) => {
      const formData = new FormData();
      formData.append("file", toUpload[idx]);
      void uploadInquiryAttachmentAction(formData).then((res) => {
        setItems((current) => {
          const updated = res.error
            ? current.filter((i) => i.localId !== item.localId)
            : current.map((i) => (i.localId === item.localId ? { ...i, status: "done" as const, url: res.url! } : i));
          commit(updated);
          return updated;
        });
        if (res.error) toast.error(res.error);
      });
    });
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance">
        {question}
      </h1>
      <p className="mt-3 text-muted-foreground">Không bắt buộc — tối đa {MAX_ATTACHMENTS} ảnh.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.localId} className="relative size-24 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploading previews are blob: object URLs, incompatible with next/image's optimizer */}
            <img src={item.previewUrl} alt="" className="size-full object-cover" />
            {item.status === "uploading" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <CircleNotch size={20} className="animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => commit(items.filter((i) => i.localId !== item.localId))}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/80 text-foreground"
                aria-label="Xóa ảnh"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {items.length < MAX_ATTACHMENTS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50"
          >
            <Plus size={20} />
            <span className="text-xs">Thêm ảnh</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
