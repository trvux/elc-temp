"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, File as FileIcon, FileImage, FilePdf, Paperclip, Ruler, X } from "@phosphor-icons/react";

import { convertToWebP } from "@/shared/lib/image";

import {
  ACCEPT_ATTRIBUTE,
  checkNewFile,
  fileKind,
  formatFileSize,
  IMAGE_SHRINK_ABOVE_BYTES,
  MAX_FILES,
  type FileKind,
  type UploadedFile,
} from "../../../domain/attachments";
import { uploadInquiryFile, type UploadHandle } from "../../upload-file";

interface Item {
  localId: string;
  name: string;
  size: number;
  kind: FileKind;
  status: "uploading" | "done";
  progress: number;
  previewUrl?: string;
  uploaded?: UploadedFile;
}

interface AttachmentStepProps {
  question: string;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  /** True while any file is still going up: the form must not move on and lose it. */
  onBusyChange: (busy: boolean) => void;
  /** Where a file too big for this step can go instead. */
  zaloHref?: string;
}

const KIND_ICON: Record<FileKind, typeof FileIcon> = { image: FileImage, pdf: FilePdf, cad: Ruler, other: FileIcon };

// Drawings and photos go up the moment they are chosen, before the lead exists, straight
// into a private bucket (nothing here is a public URL). A visitor who abandons the form
// leaves the file there; the bucket drops customer files after 12 months like any other.
export function AttachmentStep({ question, files, onChange, onBusyChange, zaloHref }: AttachmentStepProps) {
  const [items, setItems] = useState<Item[]>(() =>
    files.map((f) => ({ localId: f.key, name: f.name, size: f.size, kind: fileKind(f), status: "done" as const, progress: 100, uploaded: f })),
  );
  const [notice, setNotice] = useState<{ messages: string[]; suggestZalo: boolean } | null>(null);
  const handles = useRef(new Map<string, UploadHandle>());
  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Reported to the parent from an effect (after commit), never from inside a state updater.
  useEffect(() => {
    onChange(items.flatMap((i) => (i.status === "done" && i.uploaded ? [i.uploaded] : [])));
    onBusyChange(items.some((i) => i.status === "uploading"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Leaving the step abandons uploads still in flight and frees the preview blobs. Read at
  // cleanup time on purpose: it must see the handles and items as they are then.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });
  useEffect(() => {
    const live = handles.current;
    return () => {
      live.forEach((h) => h.abort());
      itemsRef.current.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    };
  }, []);

  function patch(localId: string, change: Partial<Item>) {
    setItems((current) => current.map((i) => (i.localId === localId ? { ...i, ...change } : i)));
  }

  function remove(localId: string) {
    handles.current.get(localId)?.abort();
    handles.current.delete(localId);
    setItems((current) => {
      const gone = current.find((i) => i.localId === localId);
      if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
      return current.filter((i) => i.localId !== localId);
    });
  }

  async function add(picked: FileList | null) {
    if (!picked || picked.length === 0) return;
    const messages: string[] = [];
    let suggestZalo = false;
    // What is already chosen, plus what this batch has already been accepted for.
    const planned: { size: number }[] = items.map((i) => ({ size: i.size }));

    for (const file of Array.from(picked)) {
      const check = checkNewFile(file, planned);
      if (!check.ok) {
        messages.push(check.message);
        suggestZalo ||= check.suggestZalo;
        continue;
      }
      planned.push({ size: file.size });
      void start(file);
    }
    setNotice(messages.length > 0 ? { messages, suggestZalo } : null);
  }

  async function start(original: File) {
    const kind = fileKind(original);
    const localId = `${original.name}-${original.size}-${Date.now()}-${Math.random()}`;
    setItems((current) => [
      ...current,
      {
        localId,
        name: original.name,
        size: original.size,
        kind,
        status: "uploading",
        progress: 0,
        previewUrl: kind === "image" ? URL.createObjectURL(original) : undefined,
      },
    ]);

    // Only an unusually large photo is shrunk (a 200-megapixel phone shot); everything else,
    // drawings above all, goes up exactly as it is.
    let toSend = original;
    if (kind === "image" && original.size > IMAGE_SHRINK_ABOVE_BYTES) {
      try {
        toSend = await convertToWebP(original, 0.85, 2560);
      } catch {
        // Still worth trying the original.
      }
    }

    const handle = uploadInquiryFile(toSend, (progress) => patch(localId, { progress }));
    handles.current.set(localId, handle);
    const result = await handle.promise;
    handles.current.delete(localId);

    if (result.ok) {
      patch(localId, { status: "done", progress: 100, uploaded: result.file, size: result.file.size });
      return;
    }
    // Removed by the visitor mid-upload: nothing to say.
    if (result.message) setNotice({ messages: [`${original.name}: ${result.message}`], suggestZalo: result.suggestZalo });
    setItems((current) => {
      const gone = current.find((i) => i.localId === localId);
      if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
      return current.filter((i) => i.localId !== localId);
    });
  }

  const canAddMore = items.length < MAX_FILES;

  return (
    <div>
      <h1 id="step-question" className="type-headline text-white drop-shadow-sm">
        {question}
      </h1>
      <p id="step-description" className="type-body mt-3 text-white/80 drop-shadow-sm">
        Không bắt buộc. PDF, DWG, DXF hoặc ảnh, tối đa {MAX_FILES} tệp, mỗi tệp 15 MB.
      </p>

      <ul aria-labelledby="step-question" aria-describedby="step-description" className="mt-8 flex max-w-md flex-col gap-2">
        {items.map((item) => {
          const Icon = KIND_ICON[item.kind];
          return (
            <li key={item.localId} className="flex items-center gap-3 rounded-lg border border-white/40 px-3 py-2">
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: preview of a file still being uploaded
                <img src={item.previewUrl} alt="" className="size-10 shrink-0 rounded object-cover" />
              ) : (
                <Icon aria-hidden="true" size={28} className="shrink-0 text-white/90" />
              )}
              <div className="min-w-0 flex-1">
                <p className="type-body-sm truncate text-white drop-shadow-sm">{item.name}</p>
                {item.status === "uploading" ? (
                  <div role="progressbar" aria-label={`Đang tải ${item.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress} className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full bg-white transition-[width]" style={{ width: `${item.progress}%` }} />
                  </div>
                ) : (
                  <p className="type-legal text-white/80">{formatFileSize(item.size)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(item.localId)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15"
                aria-label={`Xóa ${item.name}`}
              >
                <X aria-hidden="true" size={14} />
              </button>
            </li>
          );
        })}
      </ul>

      {canAddMore && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-white/40 px-4 py-2.5 type-caption text-white/90 drop-shadow-sm hover:border-white sm:type-body"
          >
            <Paperclip aria-hidden="true" size={18} />
            Thêm tệp
          </button>
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-white/40 px-4 py-2.5 type-caption text-white/90 drop-shadow-sm hover:border-white sm:type-body"
          >
            <Camera aria-hidden="true" size={18} />
            Chụp ảnh
          </button>
        </div>
      )}

      {notice && (
        <div role="alert" className="mt-5 max-w-md space-y-1">
          {notice.messages.map((m) => (
            <p key={m} className="type-body-sm text-white drop-shadow-sm">
              {m}
            </p>
          ))}
          {notice.suggestZalo && zaloHref && (
            <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="type-body-sm inline-block text-white underline underline-offset-4">
              Mở Zalo để gửi tệp
            </a>
          )}
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        multiple
        className="hidden"
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }}
      />
      {/* Opens the camera directly on a phone; kept apart because `capture` would stop the
          other input from offering the file picker. */}
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
