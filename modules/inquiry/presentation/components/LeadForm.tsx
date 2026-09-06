"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircleText } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";

type EntityKind = "product" | "project" | "service";

interface LeadFormProps {
  productId?: string;
  projectId?: string;
  serviceId?: string;
  // Name of the product/project/service being viewed — carried along as a
  // query param so the full-screen form can pre-compose a (still editable)
  // message. Omit for a general/no-context inquiry.
  entityName?: string;
  entityKind?: EntityKind;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  showIcon?: boolean;
  className?: string;
}

// Navigates to the full-screen, one-question-at-a-time consultation form at
// /form (see LeadFormScreen) instead of opening a dialog/drawer.
// At most one of productId/projectId/serviceId should be passed; enforced
// again server-side (see elc-go internal/inquiry/domain's
// chk_inquiry_single_entity).
export function LeadForm({
  productId,
  projectId,
  serviceId,
  entityName,
  entityKind,
  triggerLabel = "Yêu cầu tư vấn / báo giá",
  triggerVariant = "outline",
  triggerSize = "lg",
  showIcon = true,
  className,
}: LeadFormProps) {
  const pathname = usePathname();

  const params = new URLSearchParams();
  if (productId) params.set("productId", productId);
  if (projectId) params.set("projectId", projectId);
  if (serviceId) params.set("serviceId", serviceId);
  if (entityName) params.set("entityName", entityName);
  if (entityKind) params.set("entityKind", entityKind);
  if (pathname) params.set("returnTo", pathname);

  const href = `/form?${params.toString()}`;

  return (
    <Button variant={triggerVariant} size={triggerSize} className={className} asChild>
      <Link href={href}>
        {showIcon && <ChatCircleText size={18} className="mr-2" />}
        {triggerLabel}
      </Link>
    </Button>
  );
}
