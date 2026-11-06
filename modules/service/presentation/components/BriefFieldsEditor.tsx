"use client";

import { ArrowDown, ArrowUp, Plus, Trash } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

import { BRIEF_FIELD_KINDS, BRIEF_KIND_LABEL, type BriefField, type BriefFieldKind } from "../../domain/brief-fields";

interface BriefFieldsEditorProps {
  value: BriefField[];
  onChange: (fields: BriefField[]) => void;
}

// Edits the typed fields a customer fills in before staff can quote. One row per
// field: the question, how it is answered, and the extras that kind needs. The key
// (what a lead stores the answer under) is generated and never edited here, so
// rewording a question later does not orphan the answers already collected.
export function BriefFieldsEditor({ value, onChange }: BriefFieldsEditorProps) {
  const update = (index: number, patch: Partial<BriefField>) =>
    onChange(value.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const changeKind = (index: number, kind: BriefFieldKind) =>
    onChange(
      value.map((f, i) => {
        if (i !== index) return f;
        // The extras of the old kind are dropped; a choice starts with two empty slots to fill.
        return { key: f.key, label: f.label, kind, ...(kind === "choice" ? { options: ["", ""] } : {}) };
      }),
    );

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="type-legal text-muted-foreground">
          Chưa có mục nào. Thêm những thông tin nhân viên cần biết để báo giá.
        </p>
      )}

      {value.map((field, index) => (
        <div key={index} className="rounded-lg border p-3 space-y-3">
          <div className="flex gap-2">
            <Input
              value={field.label}
              onChange={(e) => update(index, { label: e.target.value })}
              placeholder="Câu hỏi, ví dụ: Số phòng cần làm lạnh"
              maxLength={120}
              aria-label={`Mục ${index + 1}: câu hỏi`}
            />
            <Select value={field.kind} onValueChange={(v) => changeKind(index, v as BriefFieldKind)}>
              <SelectTrigger className="w-44 shrink-0" aria-label={`Mục ${index + 1}: kiểu trả lời`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRIEF_FIELD_KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {BRIEF_KIND_LABEL[kind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field.kind === "number" && (
            <Input
              value={field.unit ?? ""}
              onChange={(e) => update(index, { unit: e.target.value })}
              placeholder="Đơn vị sau số (không bắt buộc), ví dụ: phòng"
              maxLength={20}
              aria-label={`Mục ${index + 1}: đơn vị`}
            />
          )}

          {field.kind === "choice" && (
            <Textarea
              value={(field.options ?? []).join("\n")}
              onChange={(e) => update(index, { options: e.target.value.split("\n") })}
              placeholder={"Mỗi dòng một lựa chọn (ít nhất 2)\nNhà phố\nBiệt thự"}
              rows={4}
              aria-label={`Mục ${index + 1}: các lựa chọn`}
            />
          )}

          {field.kind === "area" && (
            <p className="type-legal text-muted-foreground">
              Khách chọn một khoảng diện tích có sẵn (dưới 50 m² đến trên 1.000 m²) hoặc &ldquo;Chưa biết&rdquo;.
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="type-legal text-muted-foreground">
              {field.key ? `Mã lưu: ${field.key}` : "Mã lưu sẽ được tạo khi lưu"}
            </span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Đưa lên">
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
                aria-label="Đưa xuống"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label="Xóa mục này"
              >
                <Trash />
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...value, { key: "", label: "", kind: "text" }])}
        disabled={value.length >= 12}
      >
        <Plus /> Thêm mục
      </Button>
    </div>
  );
}
