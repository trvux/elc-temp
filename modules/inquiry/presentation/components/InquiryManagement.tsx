"use client";

import { useMemo, useState } from "react";
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
import { TypographySmall } from "@/shared/components/ui/typography";

import {
  CHANNEL_LABEL,
  decodeQualifyValue,
  INQUIRY_STATUSES,
  Inquiry,
  InquiryStatus,
  QUALIFY_STEP_LABELS,
} from "../../domain";
import { getInquiriesAction, updateInquiryDetailsAction, updateInquiryStatusAction } from "../actions";
import { getInquiryColumns } from "./InquiryColumns";

export function InquiryManagement() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [draftStatus, setDraftStatus] = useState<InquiryStatus>("new");
  const [draftNote, setDraftNote] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  // Raw text, not number — avoids fighting an <input type="number"> over
  // intermediate states ("", "1.", "1.5") while typing; parsed on save.
  const [draftConversionValue, setDraftConversionValue] = useState("");

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
        getRowId={(row) => row.id}
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

            {Object.keys(activeInquiry.qualifyData).length > 0 && (
              <div>
                <TypographySmall className="text-muted-foreground">
                  Thông tin khảo sát
                </TypographySmall>
                <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {Object.entries(activeInquiry.qualifyData).map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-muted-foreground">{QUALIFY_STEP_LABELS[key] ?? key}</dt>
                      <dd>{decodeQualifyValue(key, value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {activeInquiry.attachments.length > 0 && (
              <div>
                <TypographySmall className="text-muted-foreground">
                  Ảnh khách gửi
                </TypographySmall>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeInquiry.attachments.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- ad-hoc R2 URLs from visitor uploads, not worth wiring into next/image's remote patterns for an admin-only thumbnail */}
                      <img src={url} alt="" className="size-20 rounded-lg border border-border object-cover" />
                    </a>
                  ))}
                </div>
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
                  <p className="mt-1.5 text-xs text-muted-foreground">
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
