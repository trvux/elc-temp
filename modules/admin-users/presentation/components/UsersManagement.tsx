"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { Role } from "@/modules/auth";

import { AdminUser, InviteUserInput, inviteUserSchema, ROLE_LABELS } from "../../domain/types";
import { getAdminUsersAction, inviteUserAction, updateUserRoleAction, updateUserStatusAction } from "../actions";
import { getUserColumns } from "./UsersColumns";

export function UsersManagement({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [disablingUser, setDisablingUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await getAdminUsersAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const form = useForm<InviteUserInput>({
    resolver: standardSchemaResolver(inviteUserSchema),
    defaultValues: { email: "", role: "user" },
    mode: "onTouched",
  });

  const inviteMutation = useMutation({
    mutationFn: inviteUserAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã gửi lời mời qua email");
      setInviteOpen(false);
      form.reset();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra");
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateUserRoleAction(id, role),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã đổi vai trò");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "disabled" }) =>
      updateUserStatusAction(id, status),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã cập nhật trạng thái");
      setDisablingUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const columns = useMemo(
    () =>
      getUserColumns({
        currentUserId,
        onRoleChange: (user, role) => roleMutation.mutate({ id: user.id, role }),
        onRequestDisable: setDisablingUser,
        onActivate: (user) => statusMutation.mutate({ id: user.id, status: "active" }),
      }),
    [currentUserId, roleMutation, statusMutation],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">
            Mời quản trị viên mới, đổi vai trò, khoá/mở tài khoản.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="h-9">
          <Plus size={16} className="mr-2" /> Mời người dùng
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchKey="email"
        searchPlaceholder="Tìm kiếm tên, email..."
      />

      <AdminDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        size="sm"
        title="Mời người dùng mới"
        description="Hệ thống sẽ gửi email chứa liên kết để họ tự tạo tài khoản."
        formId="invite-user-form"
        loading={inviteMutation.isPending}
      >
        <form
          id="invite-user-form"
          onSubmit={form.handleSubmit((values) => inviteMutation.mutate(values))}
          className="space-y-4"
        >
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                <Input id="invite-email" type="email" autoFocus {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Vai trò</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </form>
      </AdminDialog>

      <AlertDialog open={!!disablingUser} onOpenChange={(open) => !open && setDisablingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khoá tài khoản này?</AlertDialogTitle>
            <AlertDialogDescription>
              {disablingUser?.name || disablingUser?.username} sẽ bị đăng xuất ngay lập tức và không thể
              đăng nhập lại cho tới khi được mở khoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={statusMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (disablingUser) statusMutation.mutate({ id: disablingUser.id, status: "disabled" });
              }}
            >
              {statusMutation.isPending ? "Đang khoá..." : "Khoá tài khoản"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
