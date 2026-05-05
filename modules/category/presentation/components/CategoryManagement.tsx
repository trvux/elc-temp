"use client";

import { useEffect, useState, useMemo } from "react";
import { Category, CategoryType } from "@/modules/category/domain/types";
import { 
  getCategoriesAction, 
  createCategoryAction, 
  updateCategoryAction, 
  deleteCategoryAction 
} from "@/modules/category/presentation/actions";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { DataTable } from "@/shared/components/ui/data-table";
import { getColumns, type CategoryRow } from "./columns";
import { AdminDialog } from "@/shared/components/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/layout/admin/delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Plus, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { capitalize } from "@/shared/lib/utils";

// Local type removed, using domain Category from modules/category

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [internalSlug, setInternalSlug] = useState("");
  const [type, setType] = useState<CategoryType>("PRODUCT");
  const [parentId, setParentId] = useState<string>("none");

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await getCategoriesAction();
    if (error) {
      toast.error(error);
    } else {
      setCategories(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const flattenedData = useMemo(() => {
    // Tìm các danh mục gốc (không có parentId hoặc parentId không tồn tại trong danh sách hiện tại)
    const rootCategories = categories.filter(
      (c) => !c.parentId || !categories.find((p) => p.id === c.parentId),
    );
    
    const result: CategoryRow[] = [];
    const visited = new Set<string>();

    const processCategory = (cat: Category, level: number) => {
      if (visited.has(cat.id)) return;
      visited.add(cat.id);
      
      result.push({ ...cat, level });
      
      const children = categories.filter((c) => c.parentId === cat.id);
      // Sắp xếp theo tên để hiển thị nhất quán
      children.sort((a, b) => a.name.localeCompare(b.name));
      
      children.forEach((child) => processCategory(child, level + 1));
    };

    // Sắp xếp các danh mục gốc
    rootCategories.sort((a, b) => a.name.localeCompare(b.name));
    rootCategories.forEach((root) => processCategory(root, 0));

    // Đảm bảo không bỏ sót danh mục nào (phòng trường hợp logic gốc bỏ sót)
    if (result.length < categories.length) {
      categories.forEach(c => {
        if (!visited.has(c.id)) {
          result.push({ ...c, level: 0 });
          visited.add(c.id);
        }
      });
    }

    return result;
  }, [categories]);


  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (cat) => openEdit(cat as unknown as Category),
        onDelete: openDelete,
      }),
    [categories],
  ); // Re-memo if needed, though functions are stable enough here

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  const fullSlug = useMemo(() => {
    if (parentId === "none") return internalSlug;
    const parent = categories.find((c) => c.id === parentId);
    if (!parent) return internalSlug;
    // Sử dụng dấu gạch ngang (-) để tạo slug kép SEO tốt hơn
    return `${parent.slug}-${internalSlug}`;
  }, [parentId, internalSlug, categories]);

  // Only parents of same type shown as parent options
  function parentOptions(forType: CategoryType) {
    return categories.filter((c) => !c.parentId && c.type === forType);
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setInternalSlug("");
    setType("PRODUCT");
    setParentId("none");
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    // If it's a child, only show the last part of the slug in the input
    const slugParts = cat.slug?.split("-") || [""];
    setInternalSlug(slugParts[slugParts.length - 1]);
    setType(cat.type);
    setParentId(cat.parentId ?? "none");
    setOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      slug: fullSlug,
      type,
      parentId: parentId === "none" ? null : parentId,
    };

    if (editing) {
      if (parentId === editing.id) {
        toast.error("Không thể chọn chính nó làm danh mục cha");
        return;
      }
      
      const { error } = await updateCategoryAction({
        id: editing.id,
        ...payload
      });

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Đã cập nhật danh mục");
    } else {
      const { error } = await createCategoryAction(payload);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Đã tạo danh mục");
    }

    setOpen(false);
    fetchCategories();
  }

  function openDelete(id: string) {
    const hasChildren = categories.some((c) => c.parentId === id);
    if (hasChildren) {
      toast.error("Vui lòng xóa các danh mục con trước");
      return;
    }
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await deleteCategoryAction(deletingId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Đã xóa danh mục");
    setDeleteOpen(false);
    fetchCategories();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý cấu trúc danh mục sản phẩm và dự án.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={flattenedData}
        searchKey="name"
        searchPlaceholder="Tìm kiếm danh mục..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title={editing ? "Sửa danh mục" : "Thêm danh mục"}
        description={
          editing
            ? "Cập nhật thông tin cho danh mục này."
            : "Điền thông tin bên dưới để tạo danh mục mới."
        }
      >
        <div className="space-y-6">
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Tên danh mục
              </FieldLabel>
              <FieldContent>
                <Input
                  className="w-full"
                  placeholder="VD: Máy lạnh âm trần"
                  value={name}
                  onChange={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    const capitalized = capitalize(val);
                    setName(capitalized);
                    setInternalSlug(generateSlug(capitalized));
                  }}
                />
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Slug / Đường dẫn
              </FieldLabel>
              <FieldContent>
                <Input
                  className="w-full font-mono text-sm"
                  placeholder="may-lanh-am-tran"
                  value={internalSlug}
                  onChange={(e) =>
                    setInternalSlug(generateSlug(e.target.value))
                  }
                />
                <FieldDescription className="mt-1.5 text-xs">
                  Đường dẫn đầy đủ:{" "}
                  <span className="font-mono text-primary font-medium">
                    /{fullSlug || "..."}
                  </span>
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Loại
              </FieldLabel>
              <FieldContent>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as CategoryType);
                    setParentId("none");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT">Sản phẩm</SelectItem>
                    <SelectItem value="PROJECT">Dự án</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[140px] pt-2 font-medium">
                Danh mục cha
              </FieldLabel>
              <FieldContent>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Không có (cấp 1)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có (cấp 1)</SelectItem>
                    {parentOptions(type)
                      .filter((p) => p.id !== editing?.id)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {parentId !== "none" && (
                  <FieldDescription className="mt-1.5 flex items-center gap-1 text-xs">
                    Đường dẫn:
                    <span className="font-medium text-foreground">
                      {categories.find((c) => c.id === parentId)?.name}
                    </span>
                    <CornerDownRight
                      size={12}
                      className="mx-0.5 text-muted-foreground"
                    />
                    <span className="font-medium text-primary">
                      {name || "..."}
                    </span>
                  </FieldDescription>
                )}
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} className="min-w-[100px]">
              {editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </div>
      </AdminDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Xóa danh mục này?"
        description="Lưu ý: Tất cả danh mục con (nếu có) cũng sẽ bị xóa vĩnh viễn khỏi hệ thống."
      />
    </div>
  );
}
