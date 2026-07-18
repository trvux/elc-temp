"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

import { askProductQuestionAction } from "../actions";

interface AskQuestionFormProps {
  productId: string;
}

// Public guest submission — no auth, honeypot + server-side rate limit are
// the real defense (see internal/product-qa's Ask handler). Not
// optimistically shown in the published list since staff moderation
// (status=pending until answered) means it isn't public yet — so there's no
// list to refresh after a successful submit, just a toast confirmation.
export function AskQuestionForm({ productId }: AskQuestionFormProps) {
  const [askerName, setAskerName] = useState("");
  const [askerEmail, setAskerEmail] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<{ askerName?: string; questionText?: string }>({});

  const submitMutation = useMutation({
    mutationFn: () => askProductQuestionAction(productId, { askerName, askerEmail, questionText }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Câu hỏi của bạn đã được gửi, chúng tôi sẽ trả lời sớm nhất.");
      setAskerName("");
      setAskerEmail("");
      setQuestionText("");
    },
    onError: () => toast.error("Đã có lỗi xảy ra, vui lòng thử lại."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot filled — pretend success without ever calling the server, so
    // the bot doesn't learn to look for a different signal.
    if (website) {
      toast.success("Câu hỏi của bạn đã được gửi, chúng tôi sẽ trả lời sớm nhất.");
      return;
    }

    const nextErrors: typeof errors = {};
    if (!askerName.trim()) nextErrors.askerName = "Vui lòng nhập tên";
    if (!questionText.trim()) nextErrors.questionText = "Vui lòng nhập câu hỏi";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    submitMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="ask-question-name">Họ tên</FieldLabel>
          <FieldContent>
            <Input
              id="ask-question-name"
              value={askerName}
              onChange={(e) => setAskerName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
            <FieldError errors={[errors.askerName ? { message: errors.askerName } : undefined]} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="ask-question-email">Email (không bắt buộc)</FieldLabel>
          <FieldContent>
            <Input
              id="ask-question-email"
              type="email"
              value={askerEmail}
              onChange={(e) => setAskerEmail(e.target.value)}
              placeholder="ban@email.com"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="ask-question-text">Câu hỏi của bạn</FieldLabel>
          <FieldContent>
            <Textarea
              id="ask-question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              placeholder="Sản phẩm này có bảo hành bao lâu?"
            />
            <FieldError errors={[errors.questionText ? { message: errors.questionText } : undefined]} />
          </FieldContent>
        </Field>

        {/* Honeypot — off-screen, not display:none (some bots skip that). */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="ask-question-website">Website</label>
          <input
            id="ask-question-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </FieldGroup>

      <Button type="submit" disabled={submitMutation.isLoading} className="self-start">
        {submitMutation.isLoading ? "Đang gửi..." : "Gửi câu hỏi"}
      </Button>
    </form>
  );
}
