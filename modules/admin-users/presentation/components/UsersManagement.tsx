"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { DataTable } from "@/shared/components/ui/data-table";
import type { Role } from "@/modules/auth";

import { AdminUser } from "../../domain/types";
import { getAdminUsersAction, updateUserRoleAction, updateUserStatusAction } from "../actions";
import { getUserColumns } from "./UsersColumns";

export function UsersManagement({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [disablingUser, setDisablingUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await getAdminUsersAction();
      if (error) throw new Error(error);
      return data;
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Mọi người tự tạo tài khoản bằng cách đăng nhập ở /login — đổi vai trò tại đây để cấp quyền vào
          trang quản trị, khoá/mở tài khoản.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchKey="email"
        searchPlaceholder="Tìm kiếm tên, email..."
      />

      <AlertDialog open={!!disablingUser} onOpenChange={(open) => !open && setDisablingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khoá tài khoản này?</AlertDialogTitle>
            <AlertDialogDescription>
              {disablingUser?.name || disablingUser?.username || disablingUser?.email} sẽ bị đăng xuất ngay lập tức và không thể
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
