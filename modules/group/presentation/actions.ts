"use server";

import { revalidatePath } from "next/cache";
import {
  createGroup,
  deleteGroup,
  getGroups,
  updateGroup,
} from "../application/index";
import { CreateGroupInput, UpdateGroupInput } from "../domain/types";

export async function getGroupsAction() {
  try {
    const data = await getGroups();
    return { data, error: null };
  } catch (error) {
    console.error("getGroupsAction error:", error);
    return { data: [], error: "Failed to fetch groups" };
  }
}

export async function createGroupAction(input: CreateGroupInput) {
  try {
    const data = await createGroup(input);
    revalidatePath("/admin/group-categories");
    return { data, error: null };
  } catch (error) {
    console.error("createGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create group",
    };
  }
}

export async function updateGroupAction(input: UpdateGroupInput) {
  try {
    const data = await updateGroup(input);
    revalidatePath("/admin/group-categories");
    return { data, error: null };
  } catch (error) {
    console.error("updateGroupAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update group",
    };
  }
}

export async function deleteGroupAction(id: string) {
  try {
    await deleteGroup(id);
    revalidatePath("/admin/group-categories");
    return { error: null };
  } catch (error) {
    console.error("deleteGroupAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete group",
    };
  }
}
