import { Metadata } from "next";
import { ServiceManagement } from "@/modules/service";
import { getServicesAction } from "@/modules/service";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Quản lý Dịch vụ - ELC Admin",
};

export default async function ServicesPage() {
  await connection();
  const { data: services } = await getServicesAction();

  return <ServiceManagement initialData={services || []} />;
}
