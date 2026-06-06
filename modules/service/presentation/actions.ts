"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from "../application/index";
import { CreateServiceInput, UpdateServiceInput, ServiceFilter } from "../domain/types";

export async function getServicesAction(options?: ServiceFilter) {
  try {
    const data = await getServices(options);
    return { data, error: null };
  } catch (error) {
    unstable_rethrow(error);
    console.error("getServicesAction error:", error);
    return { data: [], error: "Failed to fetch services" };
  }
}

export async function createServiceAction(input: CreateServiceInput) {
  try {
    const data = await createService(input);
    revalidateTag("services", { expire: 0 });
    revalidatePath("/dich-vu", "layout");
    revalidatePath("/admin/services");
    return { data, error: null };
  } catch (error) {
    console.error("createServiceAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create service",
    };
  }
}

export async function updateServiceAction(input: UpdateServiceInput) {
  try {
    const data = await updateService(input);
    revalidateTag("services", { expire: 0 });
    revalidatePath("/dich-vu", "layout");
    revalidatePath("/admin/services");
    return { data, error: null };
  } catch (error) {
    console.error("updateServiceAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update service",
    };
  }
}

export async function deleteServiceAction(id: string) {
  try {
    await deleteService(id);
    revalidateTag("services", { expire: 0 });
    revalidatePath("/dich-vu", "layout");
    revalidatePath("/admin/services");
    return { error: null };
  } catch (error) {
    console.error("deleteServiceAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service",
    };
  }
}
