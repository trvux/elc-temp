"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch, Plus, X } from "@phosphor-icons/react";
import { toast } from "sonner";

import { convertToWebP } from "@/shared/lib/image";

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

  // Reports the uploaded-so-far URLs to the parent as an effect (runs
  // after commit), not from inside a setItems updater. The previous shape
  // here (setItems((current) => { const updated = ...; onChange(...);
  // return updated; })) called the parent's setState synchronously from
  // inside this component's own state updater — React flags that as
  // "Cannot update a component while rendering a different component"
  // (user-reported console error, 2026-09-06) because an updater function
  // must be a pure function of previous state, not a place to trigger
  // other side effects.
  useEffect(() => {
    onChange(items.filter((i) => i.status === "done" && i.url).map((i) => i.url!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_ATTACHMENTS - items.length;
    const toUpload = Array.from(files).slice(0, remaining);

    const pending: AttachmentItem[] = toUpload.map((file) => ({
      localId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));
    setItems((current) => [...current, ...pending]);

    pending.forEach((item, idx) => {
      void (async () => {
        // Same client-side WebP compression as admin's ImageUpload (see
        // shared/lib/image.ts) — a raw phone-camera photo (often 3-8MB)
        // uploaded as-is exceeded Next's default 1MB Server Action body
        // limit (user-reported runtime error, 2026-09-06). 1920px is a
        // generous cap for "does the technician get a clear look at the
        // site/machine," not the near-lossless quality admin's product
        // photos need — plus a lower quality (0.8 vs admin's 0.85), since
        // this only needs to be legible, not print-quality.
        let uploadFile: File = toUpload[idx];
        try {
          uploadFile = await convertToWebP(toUpload[idx], 0.8, 1920);
        } catch (err) {
          console.error("[AttachmentStep] compress error:", err);
          // Fall through with the original file — still worth trying the
          // upload rather than silently dropping the attachment.
        }

        const formData = new FormData();
        formData.append("file", uploadFile, uploadFile.name);
        const res = await uploadInquiryAttachmentAction(formData);
        setItems((current) =>
          res.error
            ? current.filter((i) => i.localId !== item.localId)
            : current.map((i) => (i.localId === item.localId ? { ...i, status: "done" as const, url: res.url! } : i)),
        );
        if (res.error) toast.error(res.error);
      })();
    });
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance text-white drop-shadow-sm">
        {question}
      </h1>
      <p className="mt-3 text-white/80 drop-shadow-sm">Không bắt buộc — tối đa {MAX_ATTACHMENTS} ảnh.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.localId} className="relative size-24 overflow-hidden rounded-lg border border-white/40">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploading previews are blob: object URLs, incompatible with next/image's optimizer */}
            <img src={item.previewUrl} alt="" className="size-full object-cover" />
            {item.status === "uploading" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <CircleNotch size={20} className="animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((i) => i.localId !== item.localId))}
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
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-white/40 text-white/80 drop-shadow-sm hover:border-white"
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
