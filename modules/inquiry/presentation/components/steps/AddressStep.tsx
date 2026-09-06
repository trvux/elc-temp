"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/shared/components/ui/input";
import { getProvincesAction, getWardsAction } from "@/modules/shipping-zone/presentation/actions";
import { LocationField } from "./LocationField";
import type { Province, Ward } from "@/modules/shipping-zone/domain/types";
import { cn } from "@/shared/lib/utils";

// Same underline-only, no-box look as every other step's Input in this
// form (ChoiceStep/free-text/rhf-text) — the admin-style boxed
// LocationCombobox (variant="outline") read as "khuôn quá" next to those
// (user feedback, 2026-09-07). variant="ghost" strips the Button's own
// border/background so this can fully own the look via className instead.
const UNDERLINE_FIELD_CLASS =
  "!text-xl sm:!text-2xl h-auto border-0 border-b-2 border-white/40 rounded-none px-0 py-2 shadow-none text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white bg-transparent";

// LocationCombobox's "ghost" variant still carries buttonVariants' own
// hover:bg-muted / aria-expanded:bg-muted (built for an admin dropdown,
// where a filled state makes sense) — while this popover is open, that
// painted a gray rectangle behind the trigger text, looking like stray
// broken styling next to the plain underline fields around it (user
// screenshot, 2026-09-07: "sao các xám xám nó vuông bên dưới kìa"|. This
// cancels just that fill, keeping everything else about the ghost variant.
const UNDERLINE_COMBOBOX_CLASS = cn(UNDERLINE_FIELD_CLASS, "hover:bg-transparent aria-expanded:bg-transparent aria-expanded:text-foreground");

// Stable references for useQuery's "no data yet" default — `= []` inline
// in the destructure below would allocate a brand-new array every render,
// and both arrays sit in the onChange effect's dependency list further
// down, so a fresh reference each render reruns that effect every render,
// which calls the parent's setQualify, which re-renders this component,
// which allocates a new empty array again: an infinite "Maximum update
// depth exceeded" loop (hit this for real, 2026-09-06 — LocationPickerDialog
// avoids it only because its own effect doesn't depend on the arrays
// themselves, just the code strings).
const EMPTY_PROVINCES: Province[] = [];
const EMPTY_WARDS: Ward[] = [];

interface AddressStepProps {
  question: string;
  description?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

// Replaces the old free-text "Bạn ở khu vực nào?" (a bare Input the visitor
// typed a whole address into) with the same tỉnh/thành + phường/xã picker
// the shipping-zone feature already built and keeps current — reusing it
// here means this gets Vietnam's July 2025 administrative reform (quận/
// huyện abolished, 63 tỉnh/thành merged into 34) for free and stays correct
// automatically if that data is ever updated again, instead of this form
// carrying its own second, driftable copy (user-reported, 2026-09-06:
// "hiện tại việt nam mới thay đổi quận phường... nếu có ai built sẵn thì
// dùng của họ" — this codebase already had). Free-text remains for exactly
// the part a fixed list can't cover: house number / hẻm / street name.
//
// The 3 sub-fields are combined into one plain string via onChange (same
// flat qualify[stepId]-is-a-string shape every other step already uses,
// including the same key "khuVuc" — a full re-composed address just reads
// better in the admin's "Thông tin khảo sát" list than a JSON blob would),
// so there's no schema change needed downstream. That does mean, unlike
// the plain free-text Input, coming back to this step after answering it
// only restores the free-text detail — not the previously-picked
// tỉnh/phường (their codes aren't recoverable from the composed string) —
// an accepted minor regression for a field visitors rarely revisit.
export function AddressStep({ question, description, onChange, onKeyDown }: AddressStepProps) {
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [detail, setDetail] = useState("");

  const { data: provinces = EMPTY_PROVINCES } = useQuery({
    queryKey: ["shipping-provinces"],
    queryFn: async () => {
      const { data, error } = await getProvincesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: wards = EMPTY_WARDS } = useQuery({
    queryKey: ["shipping-wards", provinceCode],
    queryFn: async () => {
      const { data, error } = await getWardsAction(provinceCode);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!provinceCode,
  });

  // Reports the composed address as an effect whenever a part changes —
  // not from inside a setState updater (see AttachmentStep's onChange fix,
  // same session: calling a parent setState synchronously inside this
  // component's own state update is what React's "Cannot update a
  // component while rendering a different component" warning flags).
  useEffect(() => {
    const provinceName = provinces.find((p) => p.code === provinceCode)?.name;
    const wardName = wards.find((w) => w.code === wardCode)?.name;
    onChange([detail.trim(), wardName, provinceName].filter(Boolean).join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, provinceCode, wardCode, provinces, wards]);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance text-white drop-shadow-sm">{question}</h1>
      {description && <p className="mt-3 text-white/80 drop-shadow-sm">{description}</p>}

      <div className="mt-8 flex flex-col gap-6">
        <LocationField
          items={provinces}
          value={provinceCode}
          onValueChange={(code) => {
            setProvinceCode(code);
            setWardCode("");
          }}
          placeholder="Tỉnh/thành phố"
          emptyText="Không tìm thấy tỉnh/thành."
          drawerTitle="Chọn tỉnh/thành phố"
          className={cn("w-full", UNDERLINE_COMBOBOX_CLASS)}
        />
        <LocationField
          items={wards}
          value={wardCode}
          onValueChange={setWardCode}
          placeholder="Phường/xã (tùy chọn)"
          disabled={!provinceCode}
          emptyText="Không tìm thấy phường/xã."
          drawerTitle="Chọn phường/xã"
          className={cn("w-full", UNDERLINE_COMBOBOX_CLASS)}
        />
        <Input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Số nhà, tên đường, hẻm..."
          className={UNDERLINE_FIELD_CLASS}
        />
      </div>
    </div>
  );
}
