import {Category, UpdateCategoryInput} from "../domain/types";
import {updateCategorySchema} from "@/modules/category";
import {categoryRepo} from "../infrastructure/categoryRepo";

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
    // 1. Validate input
    const validated = updateCategorySchema.parse(input);

    // 2. Get current category to check for changes
    const current = await categoryRepo.getById(validated.id);
    if (!current) throw new Error("Category not found");

    // 3. Update the category itself
    const updated = await categoryRepo.update(validated as UpdateCategoryInput);

    // 4. If slug or type changed, propagate to children
    const typeChanged = validated.type && current.type !== validated.type;
    const slugChanged = validated.slug && current.slug !== validated.slug;

    if (typeChanged || slugChanged) {
        const children = await categoryRepo.getChildren(current.id);

        for (const child of children) {
            const childInternalSlug = child.slug.split("-").pop() || "";
            const newChildSlug = slugChanged ? `${updated.slug}-${childInternalSlug}` : child.slug;

            await categoryRepo.update({
                id: child.id,
                type: updated.type, // Sync with updated parent type
                slug: newChildSlug,   // Sync slug prefix
            });
        }
    }

    return updated;
}
