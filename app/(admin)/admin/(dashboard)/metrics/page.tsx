import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { authRepo } from "@/modules/auth/infrastructure/authRepo";
import { getCurrentUser } from "@/modules/auth/server";
import { getMetricsSnapshot } from "@/modules/metrics/application";
import { parseRange } from "@/modules/metrics/domain/types";
import { createPromClient } from "@/modules/metrics/infrastructure/prometheus";
import { MetricsDashboard } from "@/modules/metrics/presentation/components/MetricsDashboard";

export const metadata: Metadata = { title: "Tình trạng hệ thống" };

export default async function MetricsPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await connection();

  // The dashboard layout already sends signed-out users to /login and plain
  // "member" accounts home. This page is further limited to admin and
  // super_admin: the check lives here, on the server, because hiding the
  // sidebar link is not access control.
  const user = await getCurrentUser(authRepo);
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "super_admin") redirect("/admin");

  const range = parseRange((await searchParams).range);
  const snapshot = await getMetricsSnapshot(createPromClient(), range);

  return <MetricsDashboard snapshot={snapshot} />;
}
