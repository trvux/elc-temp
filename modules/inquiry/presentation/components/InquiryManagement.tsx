"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import { Field, FieldContent, FieldLabel } from "@/shared/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { TypographySmall } from "@/shared/components/ui/typography";

import { INQUIRY_STATUSES, Inquiry, InquiryStatus } from "../../domain";
import { getInquiriesAction, updateInquiryStatusAction } from "../actions";
import { getInquiryColumns } from "./InquiryColumns";

export function InquiryManagement() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [draftStatus, setDraftStatus] = useState<InquiryStatus>("new");
  const [draftNote, setDraftNote] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["inquiries", filterStatus],
    queryFn: async () => {
      const { data, error } = await getInquiriesAction(
        filterStatus === "all" ? undefined : { status: filterStatus },
      );
      if (error) throw new Error(error);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateInquiryStatusAction({
        id: activeInquiry!.id,
        status: draftStatus,
        internalNote: draftNote,
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã cập nhật yêu cầu tư vấn");
      setActiveInquiry(null);
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["inquiries-new-count"] });
    },
  });

  function openDetail(inquiry: Inquiry) {
    setActiveInquiry(inquiry);
    setDraftStatus(inquiry.status);
    setDraftNote(inquiry.internalNote ?? "");
  }

  const columns = useMemo(() => getInquiryColumns({ onView: openDetail }), []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Yêu cầu tư vấn
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách khách hàng gửi yêu cầu tư vấn/báo giá từ website.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {INQUIRY_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterStatus !== "all" && (
          <Button
            variant="ghost"
            onClick={() => setFilterStatus("all")}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={inquiries}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm theo tên khách hàng..."
      />

      <AdminDialog
        open={!!activeInquiry}
        onOpenChange={(open) => !open && setActiveInquiry(null)}
        size="lg"
        title="Chi tiết yêu cầu tư vấn"
        description={activeInquiry ? `${activeInquiry.name} — ${activeInquiry.phone}` : undefined}
      >
        {activeInquiry && (
          <div className="space-y-6">
            {activeInquiry.email && (
              <div>
                <TypographySmall className="text-muted-foreground">Email</TypographySmall>
                <p className="text-sm">{activeInquiry.email}</p>
              </div>
            )}

            {activeInquiry.message && (
              <div>
                <TypographySmall className="text-muted-foreground">
                  Nội dung khách gửi
                </TypographySmall>
                <p className="text-sm whitespace-pre-wrap">{activeInquiry.message}</p>
              </div>
            )}

            <Field>
              <FieldLabel className="mb-2 font-medium">Trạng thái</FieldLabel>
              <FieldContent>
                <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as InquiryStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel className="mb-2 font-medium">Ghi chú nội bộ</FieldLabel>
              <FieldContent>
                <Textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  rows={3}
                  placeholder="VD: Đã gọi, khách hẹn gọi lại chiều mai..."
                />
              </FieldContent>
            </Field>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button variant="outline" onClick={() => setActiveInquiry(null)} className="h-9">
                Đóng
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isLoading}
                className="h-9"
              >
                {updateMutation.isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
