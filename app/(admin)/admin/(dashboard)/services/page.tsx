import { Metadata } from "next";
import { ServiceManagement } from "@/modules/service";
import { getServicesAction } from "@/modules/service";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Quản lý Dịch vụ - ELC Admin",
};

export default async function ServicesPage() {
  await connection();
  const [{ data: services }, { data: categories }] = await Promise.all([
    getServicesAction(),
    getCategoriesAction(),
  ]);

  return <ServiceManagement initialData={services || []} categories={categories || []} />;
}
