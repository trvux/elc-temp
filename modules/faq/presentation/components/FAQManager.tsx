"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { TypographySmall } from "@/shared/components/ui/typography";
import { Plus, Trash, PencilSimple, X } from "@phosphor-icons/react";

import { FAQ, FAQOwnerType } from "../../domain/types";
import {
  createFAQAction,
  deleteFAQAction,
  getAdminFAQsAction,
  updateFAQAction,
} from "../actions";

interface FAQManagerProps {
  ownerType: FAQOwnerType;
  ownerId: string;
}

// Embedded FAQ CRUD, used inside an owner entity's own admin edit screen
// (e.g. ServiceManagement's edit dialog) — see mã 8823. Self-contained:
// fetches/mutates its own data, independent of the surrounding entity
// form's own react-hook-form state, since FAQ rows persist to their own
// endpoint regardless of whether the surrounding form is saved.
export function FAQManager({ ownerType, ownerId }: FAQManagerProps) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-faqs", ownerType, ownerId];

  const { data: faqs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await getAdminFAQsAction(ownerType, ownerId);
      if (error) throw new Error(error);
      return data;
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: () =>
      createFAQAction({
        ownerType,
        ownerId,
        question: newQuestion,
        answer: newAnswer,
        orderIndex: faqs.length,
        isPublished: true,
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã thêm câu hỏi");
      setNewQuestion("");
      setNewAnswer("");
      setIsAdding(false);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; question?: string; answer?: string; isPublished?: boolean }) =>
      updateFAQAction(input, ownerType),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFAQAction(id, ownerType),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xoá câu hỏi");
      invalidate();
    },
  });

  function startEdit(faq: FAQ) {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  }

  function saveEdit() {
    if (!editingId) return;
    updateMutation.mutate(
      { id: editingId, question: editQuestion, answer: editAnswer },
      { onSuccess: (res) => !res.error && setEditingId(null) },
    );
  }

  return (
    <div className="space-y-3">
      {isLoading && (
        <TypographySmall className="text-muted-foreground">Đang tải...</TypographySmall>
      )}

      {!isLoading && faqs.length === 0 && !isAdding && (
        <TypographySmall className="text-muted-foreground italic">
          Chưa có câu hỏi nào — thêm ít nhất vài câu hỏi cụ thể (mã lỗi, cách xử lý...) để tăng khả năng
          được AI trích dẫn.
        </TypographySmall>
      )}

      {faqs.map((faq) => (
        <div key={faq.id} className="border rounded-xl p-4 bg-muted/5 space-y-2">
          {editingId === faq.id ? (
            <div className="space-y-2">
              <Input
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="Câu hỏi..."
              />
              <Textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                placeholder="Câu trả lời..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                  Hủy
                </Button>
                <Button type="button" size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                  Lưu
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="font-medium text-sm">{faq.question}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={faq.isPublished}
                  onCheckedChange={(checked) => updateMutation.mutate({ id: faq.id, isPublished: checked })}
                  aria-label="Hiển thị công khai"
                />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => startEdit(faq)}>
                  <PencilSimple className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteMutation.mutate(faq.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {isAdding ? (
        <div className="border rounded-xl p-4 bg-muted/5 space-y-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Câu hỏi... VD: Máy lạnh Daikin báo lỗi U4 là gì?"
          />
          <Textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Câu trả lời..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewQuestion("");
                setNewAnswer("");
              }}
            >
              <X className="h-4 w-4 mr-1" /> Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!newQuestion.trim() || !newAnswer.trim() || createMutation.isPending}
            >
              Thêm câu hỏi
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Thêm câu hỏi
        </Button>
      )}
    </div>
  );
}
