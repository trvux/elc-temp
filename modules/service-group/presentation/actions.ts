"use server";

import { revalidatePath } from "next/cache";
import {
  createServiceGroup,
  deleteServiceGroup,
  getServiceGroups,
  updateServiceGroup,
} from "../application/index";
import { CreateServiceGroupInput, UpdateServiceGroupInput } from "../domain/types";

export async function getServiceGroupsAction() {
  try {
    const data = await getServiceGroups();
    return { data, error: null };
  } catch (error) {
    console.error("getServiceGroupsAction error:", error);
    return { data: [], error: "Failed to fetch service groups" };
  }
}

export async function createServiceGroupAction(input: CreateServiceGroupInput) {
  try {
    const data = await createServiceGroup(input);
    revalidatePath("/admin/service-groups");
    return { data, error: null };
  } catch (error) {
    console.error("createServiceGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create service group",
    };
  }
}

export async function updateServiceGroupAction(input: UpdateServiceGroupInput) {
  try {
    const data = await updateServiceGroup(input);
    revalidatePath("/admin/service-groups");
    return { data, error: null };
  } catch (error) {
    console.error("updateServiceGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update service group",
    };
  }
}

export async function deleteServiceGroupAction(id: string) {
  try {
    await deleteServiceGroup(id);
    revalidatePath("/admin/service-groups");
    return { error: null };
  } catch (error) {
    console.error("deleteServiceGroupAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service group",
    };
  }
}
