"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  async function handleDelete(id: string) {
    const hasChildren = categories.some((c) => c.parent_id === id);
    if (hasChildren) {
      toast.error("Xóa danh mục con trước rồi mới xóa được danh mục cha");
      return;
    }
    if (!confirm("Xóa danh mục này?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Lỗi khi xóa");
      return;
    }
    toast.success("Đã xóa danh mục");
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
                <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : tree.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                  Chưa có danh mục nào
                </TableCell>
              </TableRow>
            ) : (
              tree.map((parent) => (
                <Fragment key={parent.id}>
                  {/* Parent row */}
                  <TableRow key={parent.id} className="bg-gray-50/50">
                    <TableCell className="font-semibold">{parent.name}</TableCell>
                    <TableCell>
                      <Badge variant={parent.type === "product" ? "default" : "secondary"}>
                        {parent.type === "product" ? "Sản phẩm" : "Công trình"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-400">Cấp 1</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(parent)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(parent.id)}
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
                          <CornerDownRight size={14} className="text-gray-300 shrink-0" />
                          {child.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={child.type === "product" ? "default" : "secondary"} className="opacity-60">
                          {child.type === "product" ? "Sản phẩm" : "Công trình"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-400">Cấp 2</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(child)}>
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(child.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa danh mục" : "Thêm danh mục"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tên danh mục</Label>
              <Input
                placeholder="VD: Máy lạnh âm trần"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Loại</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as "product" | "project");
                  setParentId("none"); // reset parent when type changes
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Sản phẩm</SelectItem>
                  <SelectItem value="project">Công trình</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Danh mục cha{" "}
                <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
              </Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Không có (cấp 1)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Không có (cấp 1) —</SelectItem>
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
                <p className="text-xs text-gray-400">
                  Đường dẫn:{" "}
                  <span className="text-gray-600">
                    {categories.find((c) => c.id === parentId)?.name} › {name || "..."}
                  </span>
                </p>
              )}
            </div>

            <Button className="w-full" onClick={handleSave}>
              {editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
