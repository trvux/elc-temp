"use client";

import { useMemo, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDialog } from "@/shared/components/organisms/layout/admin/admin-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import { Field, FieldContent, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

import {
  CHANNEL_LABEL,
  decodeQualifyValue,
  INQUIRY_STATUSES,
  Inquiry,
  InquiryStatus,
  QUALIFY_STEP_LABELS,
} from "../../domain";
import { getInquiriesAction, updateInquiryDetailsAction, updateInquiryStatusAction } from "../actions";
import { downloadInquiryExport } from "../export-download";
import { InquiryAttachments } from "./InquiryAttachments";
import { getInquiryColumns } from "./InquiryColumns";

export function InquiryManagement() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [exporting, setExporting] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [draftStatus, setDraftStatus] = useState<InquiryStatus>("new");
  const [draftNote, setDraftNote] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  // Raw text, not number — avoids fighting an <input type="number"> over
  // intermediate states ("", "1.", "1.5") while typing; parsed on save.
  const [draftConversionValue, setDraftConversionValue] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["inquiries", filterStatus, filterFrom, filterTo],
    queryFn: async () => {
      const { data, error } = await getInquiriesAction({
        status: filterStatus === "all" ? undefined : filterStatus,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      if (error) throw new Error(error);
      return data;
    },
  });

  const updateMutation = useMutation({
    // Sequential, not parallel — updateInquiryDetailsAction (name/phone/
    // conversion value) must land first, so that when this changes status
    // to "converted", elc-go's PATCH /status sees this same save's
    // conversion_value rather than a stale one from before it (matters for
    // the GA4/Ads conversion push it triggers).
    mutationFn: async () => {
      const conversionValue = draftConversionValue.trim() === "" ? null : Number(draftConversionValue);
      // elc-go's SetIdentity requires non-blank name+phone whenever it's
      // called at all (see its doc comment) — a click-origin lead staff
      // never actually reached (still no name/phone) must skip this call
      // entirely, not send blanks, or the save fails validation before
      // the status change (e.g. just closing it out as unsuccessful) ever
      // runs.
      if (draftName.trim() !== "" || draftPhone.trim() !== "" || conversionValue !== null) {
        const detailsRes = await updateInquiryDetailsAction({
          id: activeInquiry!.id,
          name: draftName,
          phone: draftPhone,
          conversionValue,
        });
        if (detailsRes.error) return detailsRes;
      }

      return updateInquiryStatusAction({
        id: activeInquiry!.id,
        status: draftStatus,
        internalNote: draftNote,
      });
    },
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
    setDraftName(inquiry.name);
    setDraftPhone(inquiry.phone);
    setDraftConversionValue(inquiry.conversionValue != null ? String(inquiry.conversionValue) : "");
  }

  const columns = useMemo(() => getInquiryColumns({ onView: openDetail }), []);

  // A new filter shows a different list, so a selection made on the old one
  // must not silently ride along into the next export.
  function changeFilter(apply: () => void) {
    apply();
    setRowSelection({});
  }

  // Only rows still in the list count (a row can leave it after a status change).
  const selectedIds = useMemo(() => {
    const visible = new Set(inquiries.map((i) => i.id));
    return Object.keys(rowSelection).filter((id) => rowSelection[id] && visible.has(id));
  }, [rowSelection, inquiries]);

  const hasActiveFilter = filterStatus !== "all" || filterFrom !== "" || filterTo !== "";

  async function exportExcel(ids?: string[]) {
    setExporting(true);
    const result = await downloadInquiryExport({
      status: filterStatus,
      from: filterFrom,
      to: filterTo,
      ids,
    });
    setExporting(false);
    if (result.ok) toast.success(`Đã tải ${result.fileName}`);
    else toast.error(result.error);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="type-title text-foreground">
            Yêu cầu tư vấn
          </h1>
          <p className="type-body-sm text-muted-foreground">
            Danh sách khách hàng gửi yêu cầu tư vấn/báo giá từ website.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <Select value={filterStatus} onValueChange={(v) => changeFilter(() => setFilterStatus(v))}>
          <SelectTrigger className="w-full md:w-50">
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

        <label className="flex flex-col gap-1.5">
          <span className="type-caption text-muted-foreground">Từ ngày</span>
          <Input
            type="date"
            value={filterFrom}
            max={filterTo || undefined}
            onChange={(e) => changeFilter(() => setFilterFrom(e.target.value))}
            className="w-full md:w-44"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="type-caption text-muted-foreground">Đến ngày</span>
          <Input
            type="date"
            value={filterTo}
            min={filterFrom || undefined}
            onChange={(e) => changeFilter(() => setFilterTo(e.target.value))}
            className="w-full md:w-44"
          />
        </label>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            onClick={() =>
              changeFilter(() => {
                setFilterStatus("all");
                setFilterFrom("");
                setFilterTo("");
              })
            }
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}

        <div className="flex items-center gap-3 md:ml-auto">
          <span className="type-legal text-muted-foreground">
            {selectedIds.length > 0
              ? `Đã chọn ${selectedIds.length} dòng`
              : hasActiveFilter
                ? "Xuất theo trạng thái và ngày đang lọc"
                : "Xuất toàn bộ"}
          </span>
          <Button
            variant="outline"
            disabled={exporting || inquiries.length === 0}
            onClick={() => exportExcel(selectedIds.length > 0 ? selectedIds : undefined)}
            className="h-10"
          >
            {exporting ? "Đang xuất..." : selectedIds.length > 0 ? "Xuất dòng đã chọn" : "Xuất Excel"}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={inquiries}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Tìm theo tên khách hàng..."
        getRowId={(row) => row.id}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      <AdminDialog
        open={!!activeInquiry}
        onOpenChange={(open) => !open && setActiveInquiry(null)}
        size="lg"
        title="Chi tiết yêu cầu tư vấn"
        description={
          activeInquiry
            ? `${activeInquiry.name || "Chưa có tên"} — ${activeInquiry.phone || "Chưa có SĐT"} · ${CHANNEL_LABEL[activeInquiry.channel]}`
            : undefined
        }
      >
        {activeInquiry && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel className="mb-2 font-medium">Họ tên</FieldLabel>
                <FieldContent>
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Chưa có — điền sau khi liên hệ được khách"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="mb-2 font-medium">Số điện thoại</FieldLabel>
                <FieldContent>
                  <Input
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    placeholder="Chưa có — điền sau khi liên hệ được khách"
                  />
                </FieldContent>
              </Field>
            </div>

            {activeInquiry.email && (
              <div>
                <span className="type-caption text-muted-foreground">Email</span>
                <p className="type-body-sm">{activeInquiry.email}</p>
              </div>
            )}

            {activeInquiry.message && (
              <div>
                <span className="type-caption text-muted-foreground">
                  Nội dung khách gửi
                </span>
                <p className="type-body-sm whitespace-pre-wrap">{activeInquiry.message}</p>
              </div>
            )}

            {Object.keys(activeInquiry.qualifyData).length > 0 && (
              <div>
                <span className="type-caption text-muted-foreground">
                  Thông tin khảo sát
                </span>
                <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 type-body-sm">
                  {Object.entries(activeInquiry.qualifyData).map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-muted-foreground">{QUALIFY_STEP_LABELS[key] ?? key}</dt>
                      {/* whitespace-pre-line: the brief answers are one line per prompt. */}
                      <dd className="whitespace-pre-line">{decodeQualifyValue(key, value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {activeInquiry.interestHistory.length > 0 && (
              <div>
                <span className="type-caption text-muted-foreground">
                  Lịch sử quan tâm ({activeInquiry.interestHistory.length})
                </span>
                <ol className="mt-1.5 space-y-1 type-body-sm">
                  {activeInquiry.interestHistory.map((touch, idx) => (
                    <li key={idx} className="flex items-baseline gap-2">
                      <span className="type-legal text-muted-foreground whitespace-nowrap tabular-nums">
                        {new Date(touch.at).toLocaleString("vi-VN")}
                      </span>
                      <span>{touch.entityName || "Liên hệ chung (không gắn sản phẩm/dịch vụ)"}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {activeInquiry.attachments.length > 0 && (
              <div>
                <span className="type-caption text-muted-foreground">
                  Tệp khách gửi ({activeInquiry.attachments.length})
                </span>
                <InquiryAttachments inquiryId={activeInquiry.id} attachments={activeInquiry.attachments} />
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

            {draftStatus === "converted" && (
              <Field>
                <FieldLabel className="mb-2 font-medium">Giá trị đơn hàng (VNĐ)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draftConversionValue}
                    onChange={(e) => setDraftConversionValue(e.target.value)}
                    placeholder="VD: 15000000"
                  />
                  <p className="mt-1.5 type-legal text-muted-foreground">
                    {activeInquiry.adsConversionSyncedAt
                      ? `Đã đồng bộ Google Ads lúc ${new Date(activeInquiry.adsConversionSyncedAt).toLocaleString("vi-VN")}`
                      : "Chưa đồng bộ Google Ads."}
                  </p>
                </FieldContent>
              </Field>
            )}

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
              <Button
                variant="outline"
                disabled={exporting}
                onClick={() => exportExcel([activeInquiry.id])}
                className="h-9 mr-auto"
              >
                Xuất Excel khách này
              </Button>
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
