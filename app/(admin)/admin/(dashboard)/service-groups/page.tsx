import { Metadata } from "next";
import { ServiceGroupManagement } from "@/modules/service-group";
import { getServiceGroupsAction } from "@/modules/service-group";

export const metadata: Metadata = {
  title: "Quản lý Nhóm Dịch vụ - ELC Admin",
};

export default async function ServiceGroupsPage() {
  const { data } = await getServiceGroupsAction();

  return <ServiceGroupManagement initialData={data || []} />;
}
