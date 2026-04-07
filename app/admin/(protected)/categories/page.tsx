"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fragment } from "react";
import { Pencil, Trash2, Plus, CornerDownRight } from "lucide-react";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  type: "product" | "project";
  parent_id: string | null;
  created_at: string;
};

type CategoryWithChildren = Category & { children: Category[] };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"product" | "project">("product");
  const [parentId, setParentId] = useState<string>("none");

  const supabase = createClient();

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("type")
      .order("name");
    setCategories(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  // Build tree: only top-level + their children (2 levels max)
  const parents = categories.filter((c) => !c.parent_id);
  const tree: CategoryWithChildren[] = parents.map((p) => ({
    ...p,
    children: categories.filter((c) => c.parent_id === p.id),
  }));

  // Only parents of same type shown as parent options
  function parentOptions(forType: "product" | "project") {
    return categories.filter((c) => !c.parent_id && c.type === forType);
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setType("product");
    setParentId("none");
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setParentId(cat.parent_id ?? "none");
    setOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      type,
      parent_id: parentId === "none" ? null : parentId,
    };

    if (editing) {
      // Prevent setting self as parent
      if (parentId === editing.id) {
        toast.error("Không thể chọn chính nó làm danh mục cha");
        return;
      }
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Lỗi khi cập nhật");
        return;
      }
      toast.success("Đã cập nhật danh mục");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) {
        toast.error("Lỗi khi tạo");
        return;
      }
      toast.success("Đã tạo danh mục");
    }

    setOpen(false);
    fetchCategories();
  }

  function openDelete(id: string) {
    const hasChildren = categories.some((c) => c.parent_id === id);
    if (hasChildren) {
      toast.error("Vui lòng xóa các danh mục con trước");
      return;
    }
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await supabase.from("categories").delete().eq("id", deletingId);
    if (error) {
      toast.error("Lỗi khi xóa");
      return;
    }
    toast.success("Đã xóa danh mục");
    setDeleteOpen(false);
    fetchCategories();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Cấp</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-gray-400 py-8"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : tree.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-gray-400 py-8"
                >
                  Chưa có danh mục nào
                </TableCell>
              </TableRow>
            ) : (
              tree.map((parent) => (
                <Fragment key={parent.id}>
                  {/* Parent row */}
                  <TableRow key={parent.id} className="bg-gray-50/50">
                    <TableCell className="font-semibold">
                      {parent.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          parent.type === "product" ? "default" : "secondary"
                        }
                      >
                        {parent.type === "product" ? "Sản phẩm" : "Công trình"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-400">Cấp 1</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(parent)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => openDelete(parent.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Children rows */}
                  {parent.children.map((child) => (
                    <TableRow key={child.id}>
                      <TableCell>
                        <span className="flex items-center gap-1.5 pl-4 text-gray-600">
                          <CornerDownRight
                            size={14}
                            className="text-gray-300 shrink-0"
                          />
                          {child.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            child.type === "product" ? "default" : "secondary"
                          }
                          className="opacity-60"
                        >
                          {child.type === "product" ? "Sản phẩm" : "Công trình"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-400">Cấp 2</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(child)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => openDelete(child.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              <FieldLabel className="min-w-[120px] pt-2">
                Tên danh mục
              </FieldLabel>
              <FieldContent>
                <Input
                  className="w-full"
                  placeholder="VD: Máy lạnh âm trần"
                  value={name}
                  onChange={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setName(val.charAt(0).toUpperCase() + val.slice(1));
                  }}
                />
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[120px] pt-2">Loại</FieldLabel>
              <FieldContent>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as "product" | "project");
                    setParentId("none");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Sản phẩm</SelectItem>
                    <SelectItem value="project">Công trình</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel className="min-w-[120px] pt-2">
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
                  <FieldDescription className="mt-1.5 flex items-center gap-1">
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
