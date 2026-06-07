import { Metadata } from "next";
import { ServiceManagement } from "@/modules/service";
import { getServicesAction } from "@/modules/service";
import { getServiceGroupsAction } from "@/modules/service-group";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Quản lý Dịch vụ - ELC Admin",
};

export default async function ServicesPage() {
  await connection();
  const [{ data: services }, { data: groups }, { data: categories }] = await Promise.all([
    getServicesAction(),
    getServiceGroupsAction(),
    getCategoriesAction()
  ]);

  return (
    <ServiceManagement 
      initialData={services || []} 
      groups={groups || []}
      categories={categories || []}
    />
  );
}
