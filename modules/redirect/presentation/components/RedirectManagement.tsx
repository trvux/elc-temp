"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { DataTable } from "@/shared/components/ui/data-table";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

import { Redirect, RedirectSource, SOURCE_LABEL } from "../../domain/types";
import {
  createRedirectAction,
  deleteRedirectAction,
  getRedirectsAction,
  updateRedirectAction,
} from "../actions";

const PAGE_SIZE = 50;
const SOURCES: Array<RedirectSource | "all"> = ["all", "manual", "auto", "import"];

type Editing = Redirect | "new" | null;

export function RedirectManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState<RedirectSource | "all">("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Redirect | null>(null);

  // Search runs on the server (the table can hold hundreds of imported rows),
  // so wait for the typing to settle before asking.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryKey = ["redirects", debouncedSearch, source, page];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getRedirectsAction({
        q: debouncedSearch || undefined,
        source: source === "all" ? undefined : source,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["redirects"] });

  const toggleMutation = useMutation({
    mutationFn: async (r: Redirect) => {
      const res = await updateRedirectAction({ id: r.id, isActive: !r.isActive });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteRedirectAction(id);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("Đã xóa chuyển hướng");
      setDeleting(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<Redirect>[]>(
    () => [
      {
        accessorKey: "fromPath",
        header: "Đường dẫn cũ",
        cell: ({ row }) => <span className="type-mono break-all">{row.original.fromPath}</span>,
      },
      {
        accessorKey: "toPath",
        header: "Chuyển đến",
        cell: ({ row }) => <span className="type-mono break-all">{row.original.toPath}</span>,
      },
      {
        accessorKey: "source",
        header: "Nguồn",
        cell: ({ row }) => <Badge variant="secondary">{SOURCE_LABEL[row.original.source]}</Badge>,
      },
      {
        accessorKey: "note",
        header: "Ghi chú",
        cell: ({ row }) => <span className="type-body-sm text-muted-foreground">{row.original.note || "-"}</span>,
      },
      {
        accessorKey: "isActive",
        header: "Bật",
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => toggleMutation.mutate(row.original)}
            aria-label={`Bật hoặc tắt chuyển hướng ${row.original.fromPath}`}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ButtonGroup>
            <Button variant="outline" size="icon-sm" aria-label="Sửa" onClick={() => setEditing(row.original)}>
              <PencilSimple />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Xóa" onClick={() => setDeleting(row.original)}>
              <Trash />
            </Button>
          </ButtonGroup>
        ),
      },
    ],
    // toggleMutation.mutate is stable; the row handlers only set state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="type-title">Chuyển hướng</h1>
          <p className="type-body-sm text-muted-foreground">
            Khi một trang đổi địa chỉ, khách và Google được chuyển sang địa chỉ mới (mã 308, Google coi như 301).
            Đổi slug của bài, sản phẩm, dịch vụ... sẽ tự tạo chuyển hướng. Thay đổi có hiệu lực sau tối đa 2 phút.
          </p>
        </div>
        <Button onClick={() => setEditing("new")} className="h-9">
          <Plus size={16} className="mr-2" /> Thêm chuyển hướng
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo đường dẫn hoặc ghi chú..."
          className="sm:max-w-sm"
        />
        <ButtonGroup>
          {SOURCES.map((s) => (
            <Button
              key={s}
              variant={source === s ? "default" : "outline"}
              onClick={() => {
                setSource(s);
                setPage(0);
              }}
            >
              {s === "all" ? "Tất cả" : SOURCE_LABEL[s]}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      <DataTable columns={columns} data={items} isLoading={isLoading} getRowId={(r) => r.id} />

      <div className="flex items-center justify-between mt-4">
        <span className="type-body-sm text-muted-foreground">{total} chuyển hướng</span>
        <ButtonGroup>
          <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <Button variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Sau
          </Button>
        </ButtonGroup>
      </div>

      <RedirectDialog editing={editing} onClose={() => setEditing(null)} onSaved={refresh} />

      <DeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Xóa chuyển hướng?"
        description={
          deleting && (
            <>
              Địa chỉ <span className="type-mono">{deleting.fromPath}</span> sẽ không còn chuyển hướng và sẽ trả lỗi
              410 nếu không còn trang nào dùng địa chỉ này.
            </>
          )
        }
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function RedirectDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: Editing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = editing === "new";
  return (
    <AdminDialog
      open={!!editing}
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? "Thêm chuyển hướng" : "Sửa chuyển hướng"}
      description="Nhập đường dẫn trên website, ví dụ /dich-vu/ten-cu. Có thể dán cả URL đầy đủ."
      size="lg"
    >
      {editing && (
        // key: a different row (or "new") gets a fresh form, no reset effect needed.
        <RedirectForm
          key={editing === "new" ? "new" : editing.id}
          current={editing === "new" ? null : editing}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </AdminDialog>
  );
}

function RedirectForm({
  current,
  onClose,
  onSaved,
}: {
  current: Redirect | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = current === null;
  const [fromPath, setFromPath] = useState(current?.fromPath ?? "");
  const [toPath, setToPath] = useState(current?.toPath ?? "");
  const [note, setNote] = useState(current?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const res = current
        ? await updateRedirectAction({ id: current.id, toPath, note })
        : await createRedirectAction({ fromPath, toPath, note });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success(isNew ? "Đã thêm chuyển hướng" : "Đã cập nhật chuyển hướng");
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        save.mutate();
      }}
      className="flex flex-col gap-5 p-6"
    >
      <Field>
        <FieldLabel>Đường dẫn cũ *</FieldLabel>
        <Input
          value={fromPath}
          onChange={(e) => setFromPath(e.target.value)}
          placeholder="/dich-vu/ten-cu"
          disabled={!isNew}
          required
        />
      </Field>
      <Field>
        <FieldLabel>Chuyển đến *</FieldLabel>
        <Input value={toPath} onChange={(e) => setToPath(e.target.value)} placeholder="/dich-vu/ten-moi" required />
        <span className="type-legal text-muted-foreground">
          Nếu địa chỉ đích cũng đang chuyển hướng, hệ thống tự nối thẳng tới đích cuối và chặn vòng lặp.
        </span>
      </Field>
      <Field>
        <FieldLabel>Ghi chú</FieldLabel>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Vì sao đổi địa chỉ" />
      </Field>

      {error && (
        <p role="alert" className="type-body-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </form>
  );
}
