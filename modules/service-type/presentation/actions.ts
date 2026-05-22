"use server";

import { revalidatePath } from "next/cache";
import {
  createServiceType,
  deleteServiceType,
  getServiceTypes,
  updateServiceType,
} from "../application/index";
import { CreateServiceTypeInput, UpdateServiceTypeInput } from "../domain/types";

export async function getServiceTypesAction() {
  try {
    const data = await getServiceTypes();
    return { data, error: null };
  } catch (error) {
    console.error("getServiceTypesAction error:", error);
    return { data: [], error: "Failed to fetch service types" };
  }
}

export async function createServiceTypeAction(input: CreateServiceTypeInput) {
  try {
    const data = await createServiceType(input);
    revalidatePath("/admin/service-types");
    return { data, error: null };
  } catch (error) {
    console.error("createServiceTypeAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create service type",
    };
  }
}

export async function updateServiceTypeAction(input: UpdateServiceTypeInput) {
  try {
    const data = await updateServiceType(input);
    revalidatePath("/admin/service-types");
    return { data, error: null };
  } catch (error) {
    console.error("updateServiceTypeAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update service type",
    };
  }
}

export async function deleteServiceTypeAction(id: string) {
  try {
    await deleteServiceType(id);
    revalidatePath("/admin/service-types");
    return { error: null };
  } catch (error) {
    console.error("deleteServiceTypeAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service type",
    };
  }
}
