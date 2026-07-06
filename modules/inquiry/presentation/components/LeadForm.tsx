"use client";

import { useEffect, useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { ChatCircleText } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import * as gtag from "@/shared/lib/gtag";

import { createInquirySchema } from "../../domain";
import { createInquiryAction } from "../actions";

type LeadFormValues = {
  name: string;
  phone: string;
  email: string;
  message: string;
  website: string;
};

type EntityKind = "product" | "project" | "service";

// localStorage-remembered contact details, reused across future inquiries on
// any product/project/service page so a returning visitor never retypes
// name/phone/email — CRM/UX friction reducer, no server round-trip needed.
const REMEMBERED_CONTACT_KEY = "elc_lead_contact";

interface RememberedContact {
  name: string;
  phone: string;
  email: string;
}

function readRememberedContact(): RememberedContact | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMEMBERED_CONTACT_KEY);
    return raw ? (JSON.parse(raw) as RememberedContact) : null;
  } catch {
    return null;
  }
}

function saveRememberedContact(contact: RememberedContact) {
  try {
    window.localStorage.setItem(REMEMBERED_CONTACT_KEY, JSON.stringify(contact));
  } catch {
    // localStorage unavailable (private mode, quota) — not worth surfacing.
  }
}

// A blank message field forces every visitor to write out what they want in
// their own words ("tôi muốn mua sản phẩm X...") even though the page
// they're on already says exactly that — pre-composing it from context
// removes that busywork while staying fully editable.
function defaultMessage(entityKind?: EntityKind, entityName?: string): string {
  if (!entityKind || !entityName) return "";
  switch (entityKind) {
    case "product":
      return `Tôi quan tâm đến sản phẩm "${entityName}", vui lòng tư vấn và báo giá giúp tôi.`;
    case "service":
      return `Tôi quan tâm đến dịch vụ "${entityName}", vui lòng tư vấn giúp tôi.`;
    case "project":
      return `Tôi xem dự án "${entityName}" và muốn được tư vấn một dự án/giải pháp tương tự.`;
  }
}

interface LeadFormProps {
  productId?: string;
  projectId?: string;
  serviceId?: string;
  // Name of the product/project/service being viewed — drives the dialog
  // title and a pre-composed (still editable) message. Omit for a
  // general/no-context inquiry.
  entityName?: string;
  entityKind?: EntityKind;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}

// The first public-facing client-island form in the codebase — every other
// react-hook-form usage lives under app/(admin). At most one of
// productId/projectId/serviceId should be passed; enforced again server-side
// (see elc-go internal/inquiry/domain's chk_inquiry_single_entity).
export function LeadForm({
  productId,
  projectId,
  serviceId,
  entityName,
  entityKind,
  triggerLabel = "Yêu cầu tư vấn / báo giá",
  triggerVariant = "outline",
  triggerSize = "lg",
  className,
}: LeadFormProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: standardSchemaResolver(createInquirySchema) as unknown as Resolver<LeadFormValues>,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      message: defaultMessage(entityKind, entityName),
      website: "",
    },
  });

  // Runs once per mount (each dialog trigger unmounts/remounts its content),
  // after hydration — safe to touch localStorage here, unsafe in
  // defaultValues (would mismatch server-rendered markup).
  useEffect(() => {
    const remembered = readRememberedContact();
    if (!remembered) return;
    form.setValue("name", remembered.name);
    form.setValue("phone", remembered.phone);
    form.setValue("email", remembered.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitMutation = useMutation({
    mutationFn: (values: LeadFormValues) =>
      createInquiryAction({
        ...values,
        productId,
        projectId,
        serviceId,
      }),
    onSuccess: (res, values) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      saveRememberedContact({ name: values.name, phone: values.phone, email: values.email });
      // GA4's own recommended event, fired in parallel with the internal
      // generate_lead event already logged server-side inside
      // createInquiryAction — gtag only works client-side, so this half has
      // to live here rather than being fired once in one shared place.
      gtag.event("generate_lead", {
        lead_source: entityKind ?? "general",
        items: entityName ? [{ item_id: productId ?? projectId ?? serviceId, item_name: entityName }] : undefined,
      });
      toast.success("Đã gửi yêu cầu tư vấn!", {
        description: "Điện máy ELC sẽ liên hệ với bạn trong thời gian sớm nhất.",
      });
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={className}>
          <ChatCircleText size={18} className="mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {entityName ? `Yêu cầu tư vấn: ${entityName}` : "Yêu cầu tư vấn / báo giá"}
          </DialogTitle>
          <DialogDescription>
            Để lại thông tin, đội ngũ Điện máy ELC sẽ liên hệ tư vấn cho bạn sớm nhất.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((v) => submitMutation.mutate(v))}
          className="space-y-6"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lead-form-name">Họ tên</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Input {...field} id="lead-form-name" placeholder="Nguyễn Văn A" autoComplete="name" />
                  )}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="lead-form-phone">Số điện thoại</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <Input {...field} id="lead-form-phone" placeholder="09xx xxx xxx" autoComplete="tel" />
                  )}
                />
                <FieldError errors={[form.formState.errors.phone]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="lead-form-email">Email (không bắt buộc)</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <Input {...field} id="lead-form-email" type="email" placeholder="ban@email.com" autoComplete="email" />
                  )}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="lead-form-message">Nội dung cần tư vấn</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <Textarea {...field} id="lead-form-message" rows={3} placeholder="Bạn cần tư vấn về..." />
                  )}
                />
              </FieldContent>
            </Field>

            {/* Honeypot: hidden from real visitors, positioned off-screen
                rather than display:none (some bots skip display:none fields
                but still fill absolutely-positioned ones). */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="lead-form-website">Website</label>
              <Controller
                control={form.control}
                name="website"
                render={({ field }) => (
                  <input
                    {...field}
                    id="lead-form-website"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                )}
              />
            </div>
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={submitMutation.isLoading}>
            {submitMutation.isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
