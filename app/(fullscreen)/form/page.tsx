import type { Metadata } from "next";

import { LeadFormScreen } from "@/modules/inquiry/presentation/components/LeadFormScreen";
import { getContactsAction } from "@/modules/contact/presentation/actions";

export const metadata: Metadata = {
  title: "Yêu cầu tư vấn / báo giá | Điện máy ELC",
  robots: { index: false, follow: false },
};

type EntityKind = "product" | "project" | "service";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseEntityKind(v: string | undefined): EntityKind | undefined {
  return v === "product" || v === "project" || v === "service" ? v : undefined;
}

export default async function LeadFormPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Fetched here rather than via ContactProvider — the (fullscreen) route
  // group deliberately mounts no providers, for a clean chrome-free takeover.
  const { data: contacts } = await getContactsAction();
  const zaloContact = contacts.find((c) => c.type === "zalo" && c.isActive);

  return (
    <LeadFormScreen
      productId={first(sp.productId)}
      projectId={first(sp.projectId)}
      serviceId={first(sp.serviceId)}
      entityName={first(sp.entityName)}
      entityKind={parseEntityKind(first(sp.entityKind))}
      returnTo={first(sp.returnTo)}
      zaloHref={zaloContact?.href}
    />
  );
}
