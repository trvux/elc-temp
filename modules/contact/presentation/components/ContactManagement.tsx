"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";

import { capitalize } from "@/shared/lib/helpers";

import {
  Contact,
  CONTACT_TYPES,
  createContactSchema,
  CreateContactInput,
  UpdateContactInput,
} from "../../domain";
import { getContactIcon } from "../utils";
import {
  createContactAction,
  deleteContactAction,
  getContactsAction,
  updateContactAction,
} from "../actions";
import { getContactColumns } from "./ContactColumns";

type ContactFormValues = {
  type: string;
  label: string;
  value: string;
  isActive: boolean;
  orderIndex: number;
};


export function ContactManagement() {
  const queryClient = useQueryClient();
  
  // Consolidate modal states
  const [activeContact, setActiveContact] = useState<Contact | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<string>("all");

  const form = useForm<ContactFormValues>({
    resolver: standardSchemaResolver(createContactSchema) as unknown as Resolver<ContactFormValues>,
    defaultValues: {
      type: "phone",
      label: "",
      value: "",
      isActive: true,
      orderIndex: 0,
    },
  });

  // Fetch Data
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await getContactsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      if (activeContact && activeContact !== "new") {
        return updateContactAction({
          ...values,
          id: activeContact.id,
        } as UpdateContactInput);
      }
      return createContactAction(values as CreateContactInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(activeContact === "new" ? "Đã tạo liên hệ" : "Đã cập nhật liên hệ");
      setActiveContact(null);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContactAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa liên hệ");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchType = filterType === "all" || c.type === filterType;
      return matchType;
    });
  }, [contacts, filterType]);

  const columns = useMemo(
    () =>
      getContactColumns({
        onEdit: (c) => {
          setActiveContact(c);
          form.reset({
            type: c.type,
            label: c.label || "",
            value: c.value,
            isActive: c.isActive,
            orderIndex: c.orderIndex,
          });
        },
        onDelete: setDeletingId,
      }),
    [form],
  );

  function openCreate() {
    setActiveContact("new");
    form.reset({
      type: "phone",
      label: "",
      value: "",
      isActive: true,
      orderIndex: 0,
    });
  }

  function handleTypeChange(val: string) {
    form.setValue("type", val);
    const found = CONTACT_TYPES.find((t) => t.value === val);
    const currentLabel = form.getValues("label");
    if (found && !currentLabel) {
      form.setValue("label", found.label);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Liên hệ</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình các kênh liên lạc hiển thị trên website.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm liên hệ
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Loại liên hệ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả các loại</SelectItem>
            {CONTACT_TYPES.map((t) => {
              const Icon = getContactIcon(t.value);
              return (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-muted-foreground" />
                    {t.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

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
        isLoading={isLoading}
        searchKey="value"
        searchPlaceholder="Tìm kiếm giá trị..."
      />

      <AdminDialog
        open={!!activeContact}
        onOpenChange={(open) => !open && setActiveContact(null)}
        size="lg"
        title={activeContact === "new" ? "Thêm liên hệ mới" : "Sửa liên hệ"}
        description="Thông tin này sẽ hiển thị ở chân trang hoặc trang liên hệ."
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-8"
        >
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="mb-2 font-medium">Loại liên hệ</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={handleTypeChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_TYPES.map((t) => {
                            const Icon = getContactIcon(t.value);
                            return (
                              <SelectItem key={t.value} value={t.value}>
                                <div className="flex items-center gap-2">
                                  <Icon size={16} />
                                  {t.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2 font-medium">Thứ tự hiển thị</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="orderIndex"
                    render={({ field }) => (
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="mb-2 font-medium">Trạng thái hoạt động</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <div className="flex items-center gap-3 py-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                          {field.value ? "Đang bật" : "Đang tắt"}
                        </span>
                      </div>
                    )}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel className="mb-2 font-medium">Nhãn hiển thị</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="VD: Hotline, CSKH, Fanpage..."
                      onChange={(e) => field.onChange(capitalize(e.target.value))}
                    />
                  )}
                />
                <FieldDescription className="text-xs italic">
                  Tên ngắn gọn mô tả thông tin liên hệ.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="mb-2 font-medium">Giá trị liên hệ</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Nhập số điện thoại, email hoặc URL..."
                    />
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveContact(null)}
              className="h-9"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-9"
              disabled={saveMutation.isLoading}
            >
              {saveMutation.isLoading ? "Đang xử lý..." : (activeContact === "new" ? "Tạo mới" : "Cập nhật")}
            </Button>
          </div>
        </form>
      </AdminDialog>

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
