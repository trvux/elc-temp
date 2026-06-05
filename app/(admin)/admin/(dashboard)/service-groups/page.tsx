import { Metadata } from "next";
import { ServiceGroupManagement } from "@/modules/service-group";
import { getServiceGroupsAction } from "@/modules/service-group";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Quản lý Nhóm Dịch vụ - ELC Admin",
};

export default async function ServiceGroupsPage() {
  await connection();
  const { data } = await getServiceGroupsAction();

  return <ServiceGroupManagement initialData={data || []} />;
}
