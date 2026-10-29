"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "@phosphor-icons/react";

import { getProvincesAction, getWardsAction, lookupShippingZoneAction, ZoneLookupResult } from "@/modules/shipping-zone";
import { LocationCombobox } from "@/modules/shipping-zone/presentation/components/LocationCombobox";
import { useLocationPicker } from "@/shared/providers/location-picker-provider";

function formatVnd(value: number): string {
  return value === 0 ? "Miễn phí" : `${value.toLocaleString("vi-VN")}đ`;
}

interface DeliveryEstimateProps {
  // Pre-fills the selects from the visitor's saved location
  // (elc_delivery_province/elc_delivery_ward cookies, set via
  // LocationPickerDialog) instead of starting blank — see
  // ProductDetailModule.tsx.
  initialProvinceCode?: string | null;
  initialWardCode?: string | null;
}

// Lets a customer check real delivery fee/time for their area, since the
// shop delivers with its own fleet and fee/time genuinely differ by
// province/ward (see internal/shippingzone in elc-go). Deliberately
// decoupled from the product page's JSON-LD, which embeds the site-wide
// default zone at render time — see ProductDetailModule.tsx.
export function DeliveryEstimate({ initialProvinceCode, initialWardCode }: DeliveryEstimateProps) {
  const { openLocationPicker } = useLocationPicker();
  const [provinceCode, setProvinceCode] = useState<string>(initialProvinceCode || "");
  const [wardCode, setWardCode] = useState<string>(initialWardCode || "");
  const [result, setResult] = useState<ZoneLookupResult | null>(null);

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
    if (!provinceCode) {
      setResult(null);
      return;
    }
    let cancelled = false;
    lookupShippingZoneAction(provinceCode, wardCode || undefined).then(({ data }) => {
      if (!cancelled) setResult(data);
    });
    return () => {
      cancelled = true;
    };
  }, [provinceCode, wardCode]);

  return (
    <div role="group" aria-labelledby="delivery-estimate-label" className="flex flex-col gap-2 rounded-xl border p-4 bg-muted/10">
      <p id="delivery-estimate-label" className="flex items-center gap-1.5 type-caption text-foreground">
        <Truck aria-hidden="true" className="size-4 shrink-0" />
        Kiểm tra phí và thời gian giao hàng
      </p>

      <div className="flex flex-wrap gap-2">
        <LocationCombobox
          items={provinces}
          value={provinceCode}
          onValueChange={(code) => {
            setProvinceCode(code);
            setWardCode("");
          }}
          placeholder="Chọn tỉnh/thành"
          label="Tỉnh/thành"
          emptyText="Không tìm thấy tỉnh/thành."
        />
        <LocationCombobox
          items={wards}
          value={wardCode}
          onValueChange={setWardCode}
          placeholder="Chọn phường/xã (tùy chọn)"
          label="Phường/xã"
          disabled={!provinceCode}
          emptyText="Không tìm thấy phường/xã."
        />
      </div>

      {result && (
        <p role="status" className="type-caption text-muted-foreground">
          {result.zoneName}: {formatVnd(result.feeVnd)} — Giao trong {result.minDays}-{result.maxDays} ngày
        </p>
      )}

      {initialProvinceCode && (
        <button
          type="button"
          onClick={openLocationPicker}
          className="self-start type-legal text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Đổi khu vực đã lưu
        </button>
      )}
    </div>
  );
}
