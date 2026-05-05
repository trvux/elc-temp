"use server";

import { revalidatePath } from "next/cache";
import { 
  updateSettings, 
  createContact, 
  updateContact, 
  deleteContact 
} from "../application/index";
import { 
  SiteSetting, 
  CreateContactInput, 
  UpdateContactInput 
} from "../domain/index";

export async function updateSettingsAction(settings: SiteSetting[]) {
  try {
    await updateSettings(settings);
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (error) {
    console.error("updateSettingsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

export async function createContactAction(input: CreateContactInput) {
  try {
    const data = await createContact(input);
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { data, error: null };
  } catch (error) {
    console.error("createContactAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create contact",
    };
  }
}

export async function updateContactAction(input: UpdateContactInput) {
  try {
    const data = await updateContact(input);
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { data, error: null };
  } catch (error) {
    console.error("updateContactAction error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update contact",
    };
  }
}

export async function deleteContactAction(id: string) {
  try {
    await deleteContact(id);
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteContactAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete contact",
    };
  }
}
