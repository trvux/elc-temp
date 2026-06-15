"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  createServiceGroup,
  deleteServiceGroup,
  getServiceGroups,
  updateServiceGroup,
} from "../application/index";
import { CreateServiceGroupInput, UpdateServiceGroupInput } from "../domain/types";
import { serviceGroupRepo } from "../infrastructure/serviceGroupRepo";

export async function getServiceGroupsAction() {
  try {
    const data = await getServiceGroups(serviceGroupRepo);
    return { data, error: null };
  } catch (error) {
    unstable_rethrow(error);
    console.error("getServiceGroupsAction error:", error);
    return { data: [], error: "Failed to fetch service groups" };
  }
}

export async function createServiceGroupAction(input: CreateServiceGroupInput) {
  try {
    const data = await createServiceGroup(serviceGroupRepo, input);
    revalidatePath("/admin/service-groups");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("services", { expire: 0 });
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
    const data = await updateServiceGroup(serviceGroupRepo, input);
    revalidatePath("/admin/service-groups");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("services", { expire: 0 });
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
    await deleteServiceGroup(serviceGroupRepo, id);
    revalidatePath("/admin/service-groups");
    revalidateTag("layout", { expire: 0 });
    revalidateTag("services", { expire: 0 });
    return { error: null };
  } catch (error) {
    console.error("deleteServiceGroupAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete service group",
    };
  }
}
