"use server";

import { revalidatePath } from "next/cache";
import {
  createContact,
  CreateContactInput,
  deleteContact,
  getContacts,
  updateContact,
  UpdateContactInput,
  ContactFilter,
} from "@/modules/contact";

export async function getContactsAction(options?: ContactFilter) {
  try {
    const data = await getContacts(options);
    return { data, error: null };
  } catch (error) {
    console.error("getContactsAction error:", error);
    return { data: [], error: "Failed to fetch contacts" };
  }
}

export async function createContactAction(input: CreateContactInput) {
  try {
    const data = await createContact(input);
    revalidatePath("/admin/contacts");
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
    revalidatePath("/admin/contacts");
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
    revalidatePath("/admin/contacts");
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteContactAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete contact",
    };
  }
}
