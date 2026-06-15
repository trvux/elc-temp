"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  createContact,
  deleteContact,
  getContacts,
  updateContact,
} from "../application";
import {
  CreateContactInput,
  UpdateContactInput,
  ContactFilter,
} from "../domain";
import { contactRepo } from "../infrastructure";

export async function getContactsAction(options?: ContactFilter) {
  try {
    const data = await getContacts(contactRepo, options);
    return { data, error: null };
  } catch (error) {
    console.error("getContactsAction error:", error);
    return { data: [], error: "Failed to fetch contacts" };
  }
}

export async function createContactAction(input: CreateContactInput) {
  try {
    const data = await createContact(contactRepo, input);
    revalidatePath("/admin/contacts");
    revalidateTag("layout", { expire: 0 });
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
    const data = await updateContact(contactRepo, input);
    revalidatePath("/admin/contacts");
    revalidateTag("layout", { expire: 0 });
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
    await deleteContact(contactRepo, id);
    revalidatePath("/admin/contacts");
    revalidateTag("layout", { expire: 0 });
    return { success: true, error: null };
  } catch (error) {
    console.error("deleteContactAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete contact",
    };
  }
}
