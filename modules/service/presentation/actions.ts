"use server";

import {revalidatePath} from "next/cache";
import {createService, deleteService, getServices, updateService} from "@/modules/service";
import {CreateServiceInput, UpdateServiceInput} from "../domain/index";

export async function getServicesAction(options?: {
    isPublished?: boolean;
}) {
    try {
        const data = await getServices(options);
        return {data, error: null};
    } catch (error) {
        console.error("getServicesAction error:", error);
        return {data: [], error: "Failed to fetch services"};
    }
}

export async function createServiceAction(input: CreateServiceInput) {
    try {
        const data = await createService(input);
        revalidatePath("/admin/services");
        revalidatePath("/dich-vu");
        return {data, error: null};
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
        revalidatePath("/admin/services");
        revalidatePath("/dich-vu");
        revalidatePath(`/dich-vu/${data.slug}`);
        return {data, error: null};
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
        revalidatePath("/admin/services");
        revalidatePath("/dich-vu");
        return {success: true, error: null};
    } catch (error) {
        console.error("deleteServiceAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete service",
        };
    }
}
