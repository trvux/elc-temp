"use server";

import {revalidatePath, revalidateTag} from "next/cache";
import {createPage, CreatePageInput, deletePage, getPages, updatePage, UpdatePageInput} from "@/modules/page";

export async function getPagesAction() {
    try {
        const data = await getPages();
        return {data, error: null};
    } catch (error) {
        console.error("getPagesAction error:", error);
        return {data: [], error: "Failed to fetch pages"};
    }
}

export async function createPageAction(input: CreatePageInput) {
    try {
        const data = await createPage(input);
        revalidatePath("/admin/pages");
        revalidatePath(`/${data.slug}`);
        revalidateTag("layout", { expire: 0 });
        return {data, error: null};
    } catch (error) {
        console.error("createPageAction error:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to create page",
        };
    }
}

export async function updatePageAction(input: UpdatePageInput) {
    try {
        const data = await updatePage(input);
        revalidatePath("/admin/pages");
        revalidatePath(`/${data.slug}`);
        revalidateTag("layout", { expire: 0 });
        return {data, error: null};
    } catch (error) {
        console.error("updatePageAction error:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to update page",
        };
    }
}

export async function deletePageAction(id: string) {
    try {
        await deletePage(id);
        revalidatePath("/admin/pages");
        revalidateTag("layout", { expire: 0 });
        return {success: true, error: null};
    } catch (error) {
        console.error("deletePageAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete page",
        };
    }
}
