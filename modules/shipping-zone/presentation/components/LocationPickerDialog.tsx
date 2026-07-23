"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "@phosphor-icons/react";

import { getProvincesAction, getWardsAction, lookupShippingZoneAction, setDeliveryProvinceAction } from "../actions";
import { ZoneLookupResult } from "../../domain";
import { LocationCombobox } from "./LocationCombobox";
import { useLocationPicker } from "@/shared/providers/location-picker-provider";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { TypographySmall } from "@/shared/components/ui/typography";

const DISMISSED_KEY = "elc-location-picker-dismissed";

function formatVnd(value: number): string {
  return value === 0 ? "Miễn phí" : `${value.toLocaleString("vi-VN")}đ`;
}

// Auto-opens once (per browsing session, until the visitor actually picks a
// location) when mounted with autoOpen — see
// app/(public)/san-pham/layout.tsx, which only passes autoOpen when
// getSavedProvinceCode() found nothing. Confirming here sets a cookie
// (setDeliveryProvinceAction) then refreshes the router so every Server
// Component downstream (ProductGrid, DeliveryEstimate) re-reads it.
export function LocationPickerDialog({ autoOpen }: { autoOpen: boolean }) {
  const router = useRouter();
  const { isOpen, openLocationPicker, closeLocationPicker } = useLocationPicker();
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [preview, setPreview] = useState<ZoneLookupResult | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: provinces = [] } = useQuery({
    queryKey: ["shipping-provinces"],
    queryFn: async () => {
      const { data, error } = await getProvincesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: wards = [] } = useQuery({
    queryKey: ["shipping-wards", provinceCode],
    queryFn: async () => {
      const { data, error } = await getWardsAction(provinceCode);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!provinceCode,
  });

  useEffect(() => {
    if (!autoOpen) return;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(DISMISSED_KEY)) return;
    openLocationPicker();
    // Only ever check autoOpen once on mount — openLocationPicker/closeLocationPicker
    // are stable useCallback refs from the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  useEffect(() => {
    if (!provinceCode) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    lookupShippingZoneAction(provinceCode, wardCode || undefined).then(({ data }) => {
      if (!cancelled) setPreview(data);
    });
    return () => {
      cancelled = true;
    };
  }, [provinceCode, wardCode]);

  function handleDismiss() {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
    closeLocationPicker();
  }

  async function handleConfirm() {
    if (!provinceCode) return;
    setSaving(true);
    try {
      await setDeliveryProvinceAction(provinceCode, wardCode || undefined);
      closeLocationPicker();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Bạn đang ở khu vực nào?
          </DialogTitle>
          <DialogDescription>
            Chọn tỉnh/thành và phường/xã để xem đúng phí và thời gian giao hàng cho sản phẩm ở đây.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <LocationCombobox
            items={provinces}
            value={provinceCode}
            onValueChange={(code) => {
              setProvinceCode(code);
              setWardCode("");
            }}
            placeholder="Chọn tỉnh/thành"
            emptyText="Không tìm thấy tỉnh/thành."
            className="w-full"
          />
          <LocationCombobox
            items={wards}
            value={wardCode}
            onValueChange={setWardCode}
            placeholder="Chọn phường/xã (tùy chọn)"
            disabled={!provinceCode}
            emptyText="Không tìm thấy phường/xã."
            className="w-full"
          />
          {preview && (
            <TypographySmall className="text-muted-foreground">
              {preview.zoneName}: {formatVnd(preview.feeVnd)} — Giao trong {preview.minDays}-{preview.maxDays} ngày
            </TypographySmall>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={handleDismiss}>
            Để sau
          </Button>
          <Button type="button" disabled={!provinceCode || saving} onClick={handleConfirm}>
            {saving ? "Đang lưu..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
