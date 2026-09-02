"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Lock, LockOpen } from "@phosphor-icons/react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { Role } from "@/modules/auth";

import { AdminUser, ROLE_LABELS } from "../../domain/types";

interface ColumnProps {
  currentUserId: string;
  onRoleChange: (user: AdminUser, role: Role) => void;
  onRequestDisable: (user: AdminUser) => void;
  onActivate: (user: AdminUser) => void;
}

export const getUserColumns = ({
  currentUserId,
  onRoleChange,
  onRequestDisable,
  onActivate,
}: ColumnProps): ColumnDef<AdminUser>[] => [
  {
    accessorKey: "name",
    header: "Người dùng",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name || row.original.email}</span>
        {/* Google/magic-link accounts (role=member) have no username — only
            invited admin-panel accounts ever set one. */}
        {row.original.username && (
          <span className="text-xs text-muted-foreground">@{row.original.username}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => {
      const user = row.original;
      const isSelf = user.id === currentUserId;
      return (
        <Select
          value={user.role}
          disabled={isSelf}
          onValueChange={(value) => onRoleChange(user, value as Role)}
        >
          <SelectTrigger className="w-40" disabled={isSelf}>
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
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "secondary" : "outline"}>
        {row.original.status === "active" ? "Đang hoạt động" : "Đã khoá"}
      </Badge>
    ),
  },
  {
    accessorKey: "lastLoginAt",
    header: "Đăng nhập gần nhất",
    cell: ({ row }) =>
      row.original.lastLoginAt
        ? new Date(row.original.lastLoginAt).toLocaleString("vi-VN")
        : "Chưa đăng nhập",
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const user = row.original;
      const isSelf = user.id === currentUserId;
      if (isSelf) {
        return <span className="text-xs text-muted-foreground">Tài khoản của bạn</span>;
      }
      return user.status === "active" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRequestDisable(user)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title="Khoá tài khoản"
        >
          <Lock size={14} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onActivate(user)}
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          title="Mở khoá tài khoản"
        >
          <LockOpen size={14} />
        </Button>
      );
    },
  },
];
