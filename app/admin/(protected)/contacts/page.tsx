"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, type ContactRow } from "./columns";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Pencil,
  Trash2,
  Plus,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Link,
} from "lucide-react";

import { toast } from "sonner";
import { capitalize } from "@/lib/utils";

type Contact = {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
};

const CONTACT_TYPES = [
  { value: "phone", label: "Điện thoại", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "facebook", label: "Facebook", icon: Globe },
  { value: "zalo", label: "Zalo", icon: MessageCircle },
  { value: "website", label: "Website", icon: Link },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter states
  const [filterType, setFilterType] = useState<string>("all");

  const [type, setType] = useState("phone");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);

  const supabase = createClient();

  async function fetchContacts() {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .order("order_index");
    setContacts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchType = filterType === "all" || c.type === filterType;
      return matchType;
    });
  }, [contacts, filterType]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: (c) => openEdit(c as unknown as Contact),
        onDelete: openDelete,
      }),
    [contacts],
  );

  function openCreate() {
    setEditing(null);
    setType("phone");
    setLabel("");
    setValue("");
    setOrderIndex(0);
    setOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setType(c.type);
    setLabel(c.label || "");
    setValue(c.value);
    setOrderIndex(c.order_index);
    setOpen(true);
  }

  // Auto set label khi chọn type
  function handleTypeChange(val: string) {
    setType(val);
    const found = CONTACT_TYPES.find((t) => t.value === val);
    if (found && !label) setLabel(found.label);
  }

  async function handleSave() {
    if (!value.trim()) {
      toast.error("Nhập giá trị liên hệ");
      return;
    }

    const payload = { type, label, value, order_index: orderIndex };

    if (editing) {
      const { error } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Lỗi cập nhật");
        return;
      }
      toast.success("Đã cập nhật");
    } else {
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) {
        toast.error("Lỗi tạo mới");
        return;
      }
      toast.success("Đã tạo liên hệ");
    }

    setOpen(false);
    fetchContacts();
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", deletingId);
    if (error) {
      toast.error("Lỗi xóa");
      return;
    }
    toast.success("Đã xóa");
    setDeleteOpen(false);
    fetchContacts();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liên hệ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình các kênh liên lạc hiển thị trên website.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm liên hệ
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-1">
        <div className="w-full md:w-auto">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Loại liên hệ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả các loại</SelectItem>
              {CONTACT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <t.icon size={16} className="text-muted-foreground" />
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filterType !== "all" && (
          <Button
            variant="ghost"
            onClick={() => setFilterType("all")}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredContacts}
        searchKey="value"
        searchPlaceholder="Tìm kiếm nhãn, giá trị..."
      />

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title={editing ? "Sửa liên hệ" : "Thêm liên hệ"}
        description="Thông tin này sẽ hiển thị ở chân trang hoặc trang liên hệ."
      >
        <div className="space-y-6">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2 font-medium">
                  Loại liên hệ
                </FieldLabel>
                <FieldContent>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon size={16} />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2 font-medium">
                  Thứ tự hiển thị
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                Nhãn hiển thị
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder="VD: Hotline, CSKH, Fanpage..."
                  value={label}
                  onChange={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setLabel(capitalize(val));
                  }}
                />
                <FieldDescription className="text-xs italic">
                  Tên ngắn gọn mô tả thông tin liên hệ.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="mb-2 font-medium">
                {type === "phone"
                  ? "Số điện thoại"
                  : type === "email"
                    ? "Địa chỉ email"
                    : "URL / Link"}
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={
                    type === "phone"
                      ? "0909 123 456"
                      : type === "email"
                        ? "contact@company.com"
                        : "https://..."
                  }
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </div>
      </AdminDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
