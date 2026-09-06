"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
// Static import (not a "/images/..." string src) so Next generates a
// blurDataURL at build time — gives an instant blurred preview instead of
// empty space while the full photo streams in, which is what was showing
// as a black/gray flash on slow production connections (user-reported,
// 2026-09-07). The bg-[#3c70b0] fallback on each wrapping div (this
// photo's own average color, sampled via PIL) covers the sliver of time
// before even the blur preview paints.
import typeformBg from "@/public/images/typeform-bg.jpg";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { FieldError } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import * as gtag from "@/shared/lib/gtag";

import { getCategoriesAction } from "@/modules/category/presentation/actions";
import type { CategoryWithGroup } from "@/modules/category/domain/types";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import type { NumberBucket, PriceFacet, ProductFacets } from "@/modules/catalog/domain/types";
import { getServiceGroupsAction } from "@/modules/service-group/presentation/actions";
import type { ServiceGroup } from "@/modules/service-group/domain/types";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import type { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";

import {
  createInquirySchema,
  type ChoiceOption,
  SCALE_OPTIONS,
  PRODUCT_BUDGET_OPTIONS,
  VENTILATION_BUDGET_FALLBACK_OPTIONS,
  WATER_FILTER_BUDGET_FALLBACK_OPTIONS,
  SMART_HOME_BUDGET_FALLBACK_OPTIONS,
  WATER_FILTER_HOUSEHOLD_OPTIONS,
  YES_NO_OPTIONS,
  PRODUCT_URGENCY_OPTIONS,
  SERVICE_SUPPORT_TYPE_OPTIONS,
  RENTAL_DURATION_OPTIONS,
  DEVICE_COUNT_OPTIONS,
  SYMPTOM_OPTIONS,
  CONDITION_OPTIONS,
  ACCESS_DIFFICULTY_OPTIONS,
  SERVICE_URGENCY_OPTIONS,
  PROJECT_SCALE_OPTIONS_SMALL,
  PROJECT_SCALE_OPTIONS_MEDIUM,
  PROJECT_SCALE_OPTIONS_LARGE,
  PROJECT_BUDGET_OPTIONS_SMALL,
  PROJECT_BUDGET_OPTIONS_MEDIUM,
  PROJECT_BUDGET_OPTIONS_LARGE,
  PROJECT_STAGE_OPTIONS,
  ROLE_OPTIONS,
  SITE_VISIT_OPTIONS,
  CONTACT_PREFERENCE_OPTIONS,
  formatMillion,
} from "../../domain";
import { createInquiryAction } from "../actions";
import { BranchSelectStep, type LeadBranch } from "./steps/BranchSelectStep";
import { ChoiceStep } from "./steps/ChoiceStep";
import { ProductCategoryPickerStep, type PickedProductCategory } from "./steps/ProductCategoryPickerStep";
import { ServiceGroupPickerStep, type PickedServiceGroup } from "./steps/ServiceGroupPickerStep";
import { ServiceCategoryPickerStep, type PickedServiceCategory } from "./steps/ServiceCategoryPickerStep";
import { ProjectTypePickerStep, type PickedProjectType } from "./steps/ProjectTypePickerStep";
import { ProjectCategoryPickerStep, type PickedProjectCategory } from "./steps/ProjectCategoryPickerStep";
import { AttachmentStep } from "./steps/AttachmentStep";
import { AddressStep } from "./steps/AddressStep";


type LeadFormValues = {
  name: string;
  phone: string;
  email: string;
  message: string;
  website: string;
};

type EntityKind = "product" | "project" | "service";

const REMEMBERED_CONTACT_KEY = "elc_lead_contact";

interface RememberedContact {
  name: string;
  phone: string;
  email: string;
}

function readRememberedContact(): RememberedContact | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMEMBERED_CONTACT_KEY);
    return raw ? (JSON.parse(raw) as RememberedContact) : null;
  } catch {
    return null;
  }
}

function saveRememberedContact(contact: RememberedContact) {
  try {
    window.localStorage.setItem(REMEMBERED_CONTACT_KEY, JSON.stringify(contact));
  } catch {
    // localStorage unavailable (private mode, quota) — not worth surfacing.
  }
}

// Groups digits as "0909 411 633" (4-3-3 — the standard VN mobile display
// format, matches the field's own placeholder "09xx xxx xxx") while typing.
// Only applied to the local 10-digit form (0xxxxxxxxx): the schema also
// accepts the 84/+84 international form (11-12 digits), which uses a
// different grouping and isn't worth the extra cursor-math complexity for
// a rarely-typed path — those are left as plain digits, not truncated.
function formatVNPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 10) return digits;
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 10)].filter(Boolean).join(" ");
}

// Reformatting on every keystroke shifts character positions (inserting/
// removing spaces), so the cursor has to be recomputed by digit count
// rather than left at its raw index — otherwise typing in the middle of
// the number would jump the cursor to a wrong spot.
function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) {
  const input = e.target;
  const digitsBeforeCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, "").length;
  const formatted = formatVNPhoneDisplay(input.value);
  onChange(formatted);
  requestAnimationFrame(() => {
    let pos = 0;
    let seen = 0;
    while (pos < formatted.length && seen < digitsBeforeCursor) {
      if (/\d/.test(formatted[pos])) seen++;
      pos++;
    }
    input.setSelectionRange(pos, pos);
  });
}

function defaultMessage(entityKind?: EntityKind, entityName?: string): string {
  if (!entityKind || !entityName) return "";
  switch (entityKind) {
    case "product":
      return `Tôi quan tâm đến sản phẩm "${entityName}", vui lòng tư vấn và báo giá giúp tôi.`;
    case "service":
      return `Tôi quan tâm đến dịch vụ "${entityName}", vui lòng tư vấn giúp tôi.`;
    case "project":
      return `Tôi xem dự án "${entityName}" và muốn được tư vấn một dự án/giải pháp tương tự.`;
  }
}

// Derives the behavioral bucket directly from the picked ServiceGroup's
// slug — once a group is picked, re-asking "loại hỗ trợ nào?" would just
// re-ask something the pick already answered (same conflict as the product
// branch asking "quy mô/ngân sách" after a specific product was chosen).
// The "Bạn cần loại hỗ trợ nào?" question is shown only when the group step
// was skipped (see buildSteps) — this function is what silently drives
// routing the rest of the time. Returns undefined for a real group this
// doesn't recognize (e.g. "Thanh lý máy lạnh", "Khác", or any future
// admin-added group) — that's not a bug, it's the signal to fall back to
// the two generic questions instead of forcing a possibly-wrong bucket.
function deriveSupportType(groupSlug?: string): string | undefined {
  if (!groupSlug) return undefined;
  if (groupSlug.includes("bao-tri") || groupSlug.includes("bao-duong") || groupSlug.includes("ve-sinh")) return "maintenance";
  if (groupSlug.includes("sua-chua")) return "repair";
  if (groupSlug.includes("thu-cu")) return "tradein";
  if (groupSlug.includes("lap-dat") || groupSlug.includes("cung-cap")) return "install";
  if (groupSlug.includes("cho-thue")) return "rental";
  return undefined;
}

// Which product-category groups each real service group actually has a
// Service for — verified against the live catalog (2026-09-06): only 6
// Service rows exist system-wide, and every one of them is about máy lạnh,
// plus a single "hệ thống cấp gió tươi, lọc không khí" entry under Cung
// cấp & lắp đặt. None exist for máy lọc nước or nhà thông minh, in any
// group. Before this table, ServiceCategoryPickerStep showed all 12
// product categories for every service group, letting a visitor pick a
// combination ELC has no actual service for (e.g. "Cho thuê" + "Cảm biến
// thông minh") — user-reported, 2026-09-06. A group with no entry here
// ("khac") is intentionally left unrestricted: it exists specifically for
// requests that don't fit a defined bucket, so narrowing it would defeat
// its purpose. Revisit/widen this table as admin adds real Service rows
// for other product lines — this isn't a hard business rule, just what's
// actually sellable today.
const SERVICE_GROUP_ALLOWED_PRODUCT_GROUPS: Record<string, string[]> = {
  "cung-cap-lap-dat": ["may-lanh", "may-loc-khong-khi"],
  "ve-sinh-bao-tri": ["may-lanh"],
  "thu-cu-doi-moi": ["may-lanh"],
  "thanh-ly-may-lanh": ["may-lanh"],
  "cho-thue": ["may-lanh"],
};

function filterCategoriesForServiceGroup(
  categories: CategoryWithGroup[] | null,
  serviceGroupSlug: string | undefined,
): CategoryWithGroup[] | null {
  if (!categories) return categories;
  const allowed = serviceGroupSlug ? SERVICE_GROUP_ALLOWED_PRODUCT_GROUPS[serviceGroupSlug] : undefined;
  if (!allowed) return categories;
  return categories.filter((c) => c.group?.slug && allowed.includes(c.group.slug));
}

// Same fix, same evidence-based reasoning, for the project branch's own
// "Công trình cần lắp những dòng máy nào?" multi-select — verified against
// all 71 real Project case studies (2026-09-06): every single one is
// HVAC/ventilation ("hệ thống điều hòa không khí" / "hệ thống cấp gió tươi
// thu hồi nhiệt, lọc không khí"), across all 13 project types (nhà phố,
// biệt thự, công trình công nghiệp, chung cư, etc.) — none is about máy
// lọc nước or nhà thông minh. Both phrases DO appear in many project
// articles, but only inside a generic "dịch vụ ELC cung cấp" boilerplate
// paragraph repeated verbatim across unrelated projects (confirmed by
// reading the surrounding text) — not as that project's actual delivered
// scope. Unlike the service branch, this doesn't vary by project type: no
// type in the real data shows evidence of either product line, so one
// constant list covers the whole branch instead of a per-type table.
const PROJECT_ALLOWED_PRODUCT_GROUPS = ["may-lanh", "may-loc-khong-khi"];

function filterCategoriesForProject(categories: CategoryWithGroup[] | null): CategoryWithGroup[] | null {
  if (!categories) return categories;
  return categories.filter((c) => c.group?.slug && PROJECT_ALLOWED_PRODUCT_GROUPS.includes(c.group.slug));
}

type ProductCluster = "may-lanh" | "may-loc-khong-khi" | "may-loc-nuoc" | "nha-thong-minh";

// Mirrors deriveSupportType's shape/reasoning for the service branch: a
// remote control, a water filter, and a wall-mounted AC unit have nothing
// in common price- or install-wise, so the follow-up questions branch on
// the picked category's *group* instead of asking one AC-shaped question
// set to all 12 categories. Falls back to "may-lanh" (the branch's
// original, most common shape) when no group is known yet — category
// picker skipped, or a future admin-added group this doesn't recognize —
// same "don't force a possibly-wrong bucket" posture as deriveSupportType.
function deriveProductCluster(groupSlug?: string): ProductCluster {
  switch (groupSlug) {
    case "may-loc-khong-khi":
      return "may-loc-khong-khi";
    case "may-loc-nuoc":
      return "may-loc-nuoc";
    case "nha-thong-minh":
      return "nha-thong-minh";
    default:
      return "may-lanh";
  }
}

type ProjectSizeTier = "small" | "medium" | "large";

// Maps each of the 13 real project types to a rough size tier, so "Quy mô
// ước tính?"/"Ngân sách dự kiến?" don't share one scale across a "nhà phố"
// and a "công trình công nghiệp" — verified against all 71 real Project
// case studies (2026-09-06): townhouse/apartment-unit jobs are visibly
// smaller than office/education/industrial ones in that data. PROVISIONAL
// grouping — no structured area/budget field exists on Project to derive
// this exactly, this is a read of the case-study spread, not sourced ELC
// figures (see PROJECT_SCALE_OPTIONS_*/PROJECT_BUDGET_OPTIONS_* for the
// same caveat). Defaults to "medium" when the project type was skipped —
// the least-wrong guess in either direction, same reasoning as
// deriveProductCluster's "may-lanh" default.
function deriveProjectSizeTier(typeSlug: string | undefined): ProjectSizeTier {
  switch (typeSlug) {
    case "nha-pho":
    case "chung-cu":
    case "can-ho-dich-vu":
      return "small";
    case "van-phong":
    case "tru-so-co-quan":
    case "co-so-giao-duc":
    case "nha-hang-trung-tam-tiec-cuoi":
    case "cong-trinh-cong-nghiep":
      return "large";
    default:
      // biet-thu, showroom, co-so-kinh-doanh, vui-choi-giai-tri, y-te, and
      // any unrecognized/skipped type.
      return "medium";
  }
}

// Real spec attribute codes on the catalog's structured-attribute system
// (see modules/catalog/domain/types's AttributeFacet/ProductFacets) that
// this form leans on to ask a capacity-relevant question instead of a
// hand-guessed one — confirmed present on every "Máy lạnh"/"Máy lọc không
// khí" category by querying the real product data before building this
// (2026-09-06): every AC category has phan_khuc_hp (a "select" facet of
// real HP segments actually sold in that category, e.g. treo tường only
// goes up to 3 HP while giấu trần nối ống gió goes up to 5.5 HP — they are
// NOT interchangeable), and máy cấp khí tươi has an airflow number facet
// instead (no HP/BTU concept applies to a ventilation unit).
const ATTR_HP_SEGMENT = "phan_khuc_hp";
const ATTR_AIRFLOW = "luu_luong_cap_gio_sach_cao_nhat";

// Minimum number of steps a scoped numeric question should offer. Below
// this, we ignore the backend's raw buckets and re-slice the real observed
// [min, max] into exactly this many equal-width bands instead — see
// buildNumberBucketOptions for why.
const TARGET_BAND_COUNT = 3;

// Splits [min, max] into `count` equal-width bands (last band absorbs any
// rounding remainder by ending exactly at `max`). Used whenever the
// backend's own bucketing left fewer than TARGET_BAND_COUNT bands after
// scoping to a narrow capacity tier — see buildNumberBucketOptions. count
// on each band is left at 0 (unknown per-band without fetching the actual
// product list, which none of this form's callers need beyond the choice
// labels).
function synthesizeBands(min: number, max: number, count: number): NumberBucket[] {
  if (max <= min || count <= 0) return [{ min, max, count: 0 }];
  const width = (max - min) / count;
  return Array.from({ length: count }, (_, i) => ({
    min: min + i * width,
    max: i === count - 1 ? max : min + (i + 1) * width,
    count: 0,
  }));
}

// Builds one ChoiceOption per NumberBucket. formatNumber formats a bare
// number (no unit) — the unit is appended once at the end of the label, not
// per-number, so a 2-sided range reads "10 - 20 triệu"/"200 - 300 m³/h"
// rather than "10 triệu - 20 triệu". A bucket where min === max is an exact
// value (few enough distinct readings that showing the real number beats a
// range — see NumberBucket's own doc comment in
// modules/catalog/domain/types.ts). Shared by budget (VND, /1_000_000) and
// airflow (m³/h, no conversion) — the two numeric specs this form turns
// into dynamic questions.
//
// `observedMin`/`observedMax` are the facet's own top-level min/max (real
// range across every matching product) — separate from any individual
// bucket's boundaries, and used to re-derive bands whenever the backend
// left fewer than TARGET_BAND_COUNT bands after scoping to a narrow
// capacity tier. The backend buckets into a handful of fixed round-number
// bands (5-10tr/10-20tr/20-50tr/...), so a narrow tier's whole real range
// often collapses into just 1-2 of those — e.g. "Máy lạnh treo tường" at
// 3 HP is 26-41tr, entirely inside the single 20-50tr band; at 1 HP it's
// 6.55-15.45tr, spanning only the 5-10tr/10-20tr pair. Showing either as
// one lump range, or as a bare "Dưới X"/"Trên X" pair, is accurate but
// gives sales/the visitor no resolution to express a preference within
// it — user feedback (2026-09-06): first "nó phải có range step nhảy
// chứ?" (only the 1-bucket case was fixed), then "sao 1hp hay 1.5hp vẫn
// còn ... dưới x trên x" (the 2-bucket case has the exact same coarseness,
// fixed here by triggering synthesis below TARGET_BAND_COUNT rather than
// only at exactly 1).
function buildNumberBucketOptions(
  buckets: NumberBucket[],
  observedMin: number,
  observedMax: number,
  formatNumber: (n: number) => string,
  unit: string,
): ChoiceOption[] {
  const synthesized = buckets.length < TARGET_BAND_COUNT && observedMax > observedMin;
  if (synthesized) return buildSynthesizedOptions(observedMin, observedMax, formatNumber, unit);
  return buckets.map((bucket, i) => {
    if (bucket.min === bucket.max) return { value: `${bucket.min}-${bucket.max}`, label: `${formatNumber(bucket.min)} ${unit}` };
    const isFirst = i === 0;
    const isLast = i === buckets.length - 1;
    const label = isFirst
      ? `Dưới ${formatNumber(bucket.max)} ${unit}`
      : isLast
        ? `Trên ${formatNumber(bucket.min)} ${unit}`
        : `${formatNumber(bucket.min)} - ${formatNumber(bucket.max)} ${unit}`;
    return { value: `${bucket.min}-${bucket.max}`, label };
  });
}

// Synthesized bands are clamped to the real observed min/max by
// construction — every one of them, including the first/last, has a fully
// known range, unlike a genuine backend bucket whose first/last slot is an
// intentionally open-ended "Dưới X"/"Trên X" (the category could have
// units below/above what's shown). So these always render as a closed
// range, never "Dưới"/"Trên" — that framing would silently reintroduce the
// bug this whole mechanism exists to fix: a first band saying "Dưới 30
// triệu" when nothing in this capacity tier is actually below 26 triệu.
//
// Dividing a narrow enough span into TARGET_BAND_COUNT equal-width bands
// can produce neighbors whose boundaries round to the *same* displayed
// number after formatNumber (e.g. "Máy lạnh âm trần đa hướng thổi" at 1.5
// HP is only 21.01-22.49tr wide — split 3 ways that's ~0.49tr bands, and
// two of them both round to "22 triệu") — shown separately that's two
// visually identical options, confusing regardless of their technically
// different underlying ranges (user-reported screenshot, 2026-09-06).
// Fixed by computing every band's label first, then merging consecutive
// bands whose label collides into one (extending its range, keeping the
// shared label) — this can yield fewer than TARGET_BAND_COUNT options when
// the tier is genuinely too narrow to support that much resolution at
// whole-unit rounding, which is honest rather than papering over it with a
// fabricated third option.
function buildSynthesizedOptions(min: number, max: number, formatNumber: (n: number) => string, unit: string): ChoiceOption[] {
  const labeled = synthesizeBands(min, max, TARGET_BAND_COUNT).map((band) => {
    const minLabel = formatNumber(band.min);
    const maxLabel = formatNumber(band.max);
    return { min: band.min, max: band.max, label: minLabel === maxLabel ? `${minLabel} ${unit}` : `${minLabel} - ${maxLabel} ${unit}` };
  });
  const merged: typeof labeled = [];
  for (const item of labeled) {
    const prev = merged[merged.length - 1];
    if (prev && prev.label === item.label) {
      prev.max = item.max;
      continue;
    }
    merged.push({ ...item });
  }
  return merged.map((item) => ({ value: `${item.min}-${item.max}`, label: item.label }));
}

// Builds "Ngân sách dự kiến?" straight from a real price facet
// (ProductFacets.price — the same histogram the public catalog's price
// filter uses) instead of a hand-picked scale, since every product group's
// (and within "Máy lạnh," every capacity tier's) real price range is
// different. `facet` should already be scoped to whatever capacity the
// visitor just picked (see the scoped-refetch effect below) — an unscoped,
// whole-category facet is what caused the original bug report: a visitor
// picking "trên 40m²"/5 HP still saw "Dưới 10 triệu" as a budget option,
// because that price floor belongs to the category's cheapest 1 HP unit,
// not anything near the capacity they said they need. Returns null when
// there's no usable facet (not loaded yet, or that category/tier has no
// priced products), so the caller falls back to a provisional
// *_BUDGET_FALLBACK_OPTIONS constant.
function buildDynamicBudgetOptions(facet: PriceFacet | null): ChoiceOption[] | null {
  if (!facet || facet.buckets.length === 0) return null;
  return [...buildNumberBucketOptions(facet.buckets, facet.min, facet.max, formatMillion, "triệu"), { value: "chua-ro", label: "Chưa rõ" }];
}

// A widely-used VN AC-retail rule of thumb (the same one printed on most
// storefront spec sheets), NOT an ELC-specific figure — shown as a
// parenthetical hint only, since most customers think in phòng size (m²)
// rather than HP/BTU. The real, authoritative options list is still
// buildHpOptions's per-category HP segments below; this only decorates
// each with a familiar area range.
const HP_AREA_HINT: Record<string, string> = {
  "1": "9-15m²",
  "1.5": "15-20m²",
  "2": "20-30m²",
  "2.5": "30-40m²",
  "3": "40-45m²",
  "3.5": "45-55m²",
  "4": "55-65m²",
  "4.5": "65-75m²",
  "5": "75-85m²",
  "5.5": "85m²+",
};

// Builds "Quy mô/công suất cần lắp?" from the picked AC category's real HP
// segments (phan_khuc_hp) instead of a fixed <20m²/20-40m²/>40m² set shared
// by every AC category — treo tường tops out at 3 HP while giấu trần nối
// ống gió goes to 5.5 HP, so a shared option list either can't reach a
// giấu trần visitor's real need or offers a treo tường visitor segments
// that don't exist for that product line. Returns null (caller falls back
// to the static SCALE_OPTIONS) if this category's facet has no HP data
// yet — defensive, but not expected to trigger for any real AC category
// (verified present on all 5 as of 2026-09-06).
function buildHpOptions(facets: ProductFacets | null): ChoiceOption[] | null {
  const attr = facets?.attributes.find((a) => a.code === ATTR_HP_SEGMENT);
  if (!attr || attr.options.length === 0) return null;
  const sorted = [...attr.options].sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
  const options = sorted.map((o) => {
    const hp = o.value.replace(/\s*HP$/i, "").trim();
    const hint = HP_AREA_HINT[hp];
    return { value: o.value, label: hint ? `${o.value} (~${hint})` : o.value };
  });
  return [...options, { value: "chua-ro", label: "Chưa rõ" }];
}

// Same idea as buildHpOptions but for "Máy cấp khí tươi" — that product
// line has no HP/BTU concept at all (verified 2026-09-06: its only
// capacity-shaped spec is airflow, m³/h), so it gets its own dynamic
// question instead of reusing the AC one or a diện tích guess.
function buildAirflowOptions(facets: ProductFacets | null): ChoiceOption[] | null {
  const attr = facets?.attributes.find((a) => a.code === ATTR_AIRFLOW);
  if (!attr || !attr.buckets || attr.buckets.length === 0) return null;
  const min = attr.min ?? attr.buckets[0].min;
  const max = attr.max ?? attr.buckets[attr.buckets.length - 1].max;
  return [...buildNumberBucketOptions(attr.buckets, min, max, (v) => String(v), "m³/h"), { value: "chua-ro", label: "Chưa rõ" }];
}

function parseNumericRange(value: string): [number, number] | null {
  const match = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(value);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

interface CapacityQuestion {
  id: "scale" | "deviceCount" | "householdSize";
  question: string;
  options: ChoiceOption[];
  // True for item types with no installation site worth photographing
  // (small accessories) — callers that show a photo step should skip it
  // when this is set, same reasoning wherever it's used.
  skipAttachment?: boolean;
}

// What to ask about "what exactly are we sizing" for a given product
// category — shared by the product branch's own picker (paired with a
// budget question) AND the service branch's "install" supportType (no
// budget: pricing isn't fixed for services — see the branch's own
// comment). Keeping this in one place is what stops the two branches from
// drifting apart the way the product branch and this "install" path
// already had (user-reported screenshot, 2026-09-06: "Cung cấp & lắp đặt"
// + "Công tắc thông minh" asked "Quy mô cần lắp?" in m², the exact same
// category-mismatch bug the product branch was fixed for earlier).
function buildCapacityQuestion(categorySlug: string | undefined, groupSlug: string | undefined, facets: ProductFacets | null): CapacityQuestion {
  const cluster = deriveProductCluster(groupSlug);
  switch (cluster) {
    case "may-lanh": {
      const hpOptions = buildHpOptions(facets);
      return {
        id: "scale",
        question: hpOptions ? "Công suất máy cần lắp?" : "Quy mô/công suất cần lắp?",
        options: hpOptions ?? SCALE_OPTIONS,
      };
    }
    case "may-loc-khong-khi": {
      // See the product branch's own isAccessory comment — "Phụ kiện đồng
      // bộ" is bought to match an existing system, not to size a new one.
      if (categorySlug?.includes("phu-kien")) {
        return { id: "deviceCount", question: "Số lượng phụ kiện cần lắp?", options: DEVICE_COUNT_OPTIONS, skipAttachment: true };
      }
      const airflowOptions = buildAirflowOptions(facets);
      return {
        id: "scale",
        question: airflowOptions ? "Lưu lượng cấp gió cần lắp?" : "Diện tích/quy mô cần lắp hệ thống?",
        options: airflowOptions ?? SCALE_OPTIONS,
      };
    }
    case "may-loc-nuoc":
      return { id: "householdSize", question: "Gia đình/cơ sở có bao nhiêu người sử dụng?", options: WATER_FILTER_HOUSEHOLD_OPTIONS };
    case "nha-thong-minh":
      return { id: "deviceCount", question: "Số lượng thiết bị cần lắp?", options: DEVICE_COUNT_OPTIONS, skipAttachment: true };
  }
}

// Which provisional *_BUDGET_FALLBACK_OPTIONS scale applies once a real
// price facet isn't available — keyed off what buildCapacityQuestion just
// asked, since that's what actually determines the right price scale (a
// "deviceCount" answer means small accessories regardless of which cluster
// produced it — "Phụ kiện đồng bộ" and "Nhà thông minh" share the same
// small-accessory fallback scale for exactly that reason).
function budgetFallbackFor(cluster: ProductCluster, capacityQuestionId: CapacityQuestion["id"]): ChoiceOption[] {
  if (capacityQuestionId === "deviceCount") return SMART_HOME_BUDGET_FALLBACK_OPTIONS;
  if (capacityQuestionId === "householdSize") return WATER_FILTER_BUDGET_FALLBACK_OPTIONS;
  return cluster === "may-lanh" ? PRODUCT_BUDGET_OPTIONS : VENTILATION_BUDGET_FALLBACK_OPTIONS;
}

interface PickedState {
  productCategoryId?: string;
  productCategoryName?: string;
  productCategorySlug?: string;
  productGroupSlug?: string;
  serviceGroupId?: string;
  serviceGroupName?: string;
  serviceGroupSlug?: string;
  serviceCategoryId?: string;
  serviceCategoryName?: string;
  serviceCategorySlug?: string;
  serviceCategoryGroupSlug?: string;
  projectTypeId?: string;
  projectTypeName?: string;
  projectTypeSlug?: string;
  projectCategoryIds?: string[];
  projectCategoryNames?: string[];
}

type StepDescriptor =
  | { id: string; kind: "branch-select" }
  | { id: string; kind: "product-category-picker" }
  | { id: string; kind: "service-group-picker" }
  | { id: string; kind: "service-category-picker" }
  | { id: string; kind: "project-type-picker" }
  | { id: string; kind: "project-category-picker" }
  | { id: string; kind: "choice"; question: string; description?: string; options: ChoiceOption[]; defaultValue?: string }
  | { id: string; kind: "free-text"; question: string; description?: string; placeholder: string }
  | { id: string; kind: "address"; question: string; description?: string }
  | { id: string; kind: "attachment"; question: string }
  | { id: "name" | "phone" | "email"; kind: "rhf-text"; question: string; description?: string; placeholder: string; type: "text" | "tel" | "email"; autoComplete: string }
  | { id: "message"; kind: "rhf-textarea"; question: string; description?: string; placeholder: string };

interface LeadFormScreenProps {
  productId?: string;
  projectId?: string;
  serviceId?: string;
  entityName?: string;
  entityKind?: EntityKind;
  returnTo?: string;
  zaloHref?: string;
}

export function LeadFormScreen({
  productId,
  projectId,
  serviceId,
  entityName,
  entityKind,
  returnTo,
  zaloHref,
}: LeadFormScreenProps) {
  const router = useRouter();
  const exitHref = returnTo || "/";

  const [branch, setBranch] = useState<LeadBranch | null>((entityKind as LeadBranch) ?? null);
  const [picked, setPicked] = useState<PickedState>({});
  const [qualify, setQualify] = useState<Record<string, string>>({});
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Lazily fetched catalog data, keyed by branch — undefined until needed,
  // null while loading, populated once fetched.
  const [productCategories, setProductCategories] = useState<CategoryWithGroup[] | null>(null);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[] | null>(null);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeWithCategories[] | null>(null);
  // Full facets (price + real spec attributes) for whichever product
  // category was just picked — unscoped, i.e. across every capacity tier
  // in that category. Drives buildHpOptions/buildAirflowOptions, and is
  // buildDynamicBudgetOptions' fallback before a capacity answer narrows it.
  const [productCategoryFacets, setProductCategoryFacets] = useState<ProductFacets | null>(null);
  // Price facet re-scoped to whatever capacity (HP segment / airflow band)
  // the visitor just answered in the "scale" step — see the effect below.
  // This is what actually fixes a >40m²/5 HP visitor seeing a budget floor
  // that only exists for the category's cheapest small unit.
  const [productScopedPriceFacet, setProductScopedPriceFacet] = useState<PriceFacet | null>(null);
  // Same as productCategoryFacets but for the service branch's own category
  // picker (ServiceCategoryPickerStep) — drives the "install" supportType's
  // capacity question. No scoped-*price* facet equivalent: service pricing
  // isn't fixed catalog pricing (every real Service row is
  // price_display_text "Liên hệ" — verified against the DB, 2026-09-06),
  // so this branch never asks a "Ngân sách dự kiến?" question at all,
  // unlike the product branch.
  const [serviceCategoryFacets, setServiceCategoryFacets] = useState<ProductFacets | null>(null);

  useEffect(() => {
    // Category catalog is shared by the product branch's own picker and the
    // service branch's "dòng máy nào" follow-up (see ServiceCategoryPickerStep)
    // — fetch it for either.
    if ((branch === "product" || branch === "service" || branch === "project") && productCategories === null) {
      void getCategoriesAction().then((res) => setProductCategories(res.data));
    }
    if (branch === "service" && serviceGroups === null) {
      void getServiceGroupsAction().then((res) => setServiceGroups(res.data));
    }
    if (branch === "project" && projectTypes === null) {
      void getProjectTypesAction().then((res) => setProjectTypes(res.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch]);

  // Re-fetches the price facet scoped to the capacity the visitor just
  // picked in "scale" (HP segment for máy lạnh, airflow band for máy cấp
  // khí tươi) — fires whenever that answer, or the picked category, changes
  // (including "picked a different category" or "went back and picked a
  // different scale"). "Chưa rõ"/no answer yet clears the scoped facet
  // rather than fetching, so buildDynamicBudgetOptions falls back to the
  // whole-category facet instead of a stale scope from a previous answer.
  useEffect(() => {
    const categoryId = picked.productCategoryId;
    if (branch !== "product" || !categoryId) {
      setProductScopedPriceFacet(null);
      return;
    }
    const scaleAnswer = qualify.scale;
    if (!scaleAnswer || scaleAnswer === "chua-ro") {
      setProductScopedPriceFacet(null);
      return;
    }
    const cluster = deriveProductCluster(picked.productGroupSlug);
    if (cluster === "may-lanh") {
      void getProductsAction({ categoryId, attributeTokens: { [ATTR_HP_SEGMENT]: [scaleAnswer] }, limit: 1 }).then((res) => {
        setProductScopedPriceFacet(res.facets.price.buckets.length > 0 ? res.facets.price : null);
      });
    } else if (cluster === "may-loc-khong-khi") {
      const range = parseNumericRange(scaleAnswer);
      if (!range) {
        setProductScopedPriceFacet(null);
        return;
      }
      void getProductsAction({ categoryId, attributeRanges: { [ATTR_AIRFLOW]: range }, limit: 1 }).then((res) => {
        setProductScopedPriceFacet(res.facets.price.buckets.length > 0 ? res.facets.price : null);
      });
    } else {
      setProductScopedPriceFacet(null);
    }
  }, [branch, picked.productCategoryId, picked.productGroupSlug, qualify.scale]);

  const steps = useMemo<StepDescriptor[]>(() => {
    if (!branch) return [{ id: "branch", kind: "branch-select" }];

    const list: StepDescriptor[] = [];

    let skipAttachment = false;
    // Set only by the service branch — "Gửi ảnh tình trạng máy" (send a
    // photo of the machine's *condition*) presumes an existing machine,
    // which doesn't exist for "install a brand-new unit" or "rent a unit"
    // (user-reported screenshot, 2026-09-06 audit: this wording was fixed
    // regardless of supportType).
    let serviceAttachmentQuestion: string | undefined;

    if (branch === "product") {
      if (!productId) list.push({ id: "product-picker", kind: "product-category-picker" });

      const cluster = deriveProductCluster(picked.productGroupSlug);
      const cq = buildCapacityQuestion(picked.productCategorySlug, picked.productGroupSlug, productCategoryFacets);
      const categoryPriceFacet = productCategoryFacets?.price ?? null;
      // Scoped-by-capacity facet first (the actual bug fix — a 5 HP pick
      // must not see the category's cheapest 1 HP unit's price floor; only
      // applies to "scale" questions, the only ones with a matching
      // scoped-refetch effect above), then the whole-category facet while
      // that scoped fetch is still in flight, then a provisional static
      // fallback matched to what's actually being asked.
      const budgetOptions =
        (cq.id === "scale" ? buildDynamicBudgetOptions(productScopedPriceFacet) : null) ??
        buildDynamicBudgetOptions(categoryPriceFacet) ??
        budgetFallbackFor(cluster, cq.id);

      list.push({ id: cq.id, kind: "choice", question: cq.question, options: cq.options });
      list.push({ id: "budget", kind: "choice", question: "Ngân sách dự kiến?", options: budgetOptions });

      // Trade-in is a "Máy lạnh"-specific behavior (the established
      // ELC service, per BranchSelectStep's own service-group icon) — not
      // asked for the other 3 clusters, dropped rather than forced.
      if (cluster === "may-lanh") {
        list.push({ id: "tradeIn", kind: "choice", question: "Có máy cũ cần thu đổi không?", options: YES_NO_OPTIONS });
        // Same depth as the service branch's own trade-in path
        // (oldDeviceInfo + condition) — without this, a "Có" answer here
        // gave sales nothing to price the trade-in against.
        if (qualify.tradeIn === "co") {
          list.push({ id: "oldDeviceInfo", kind: "free-text", question: "Đời máy / hãng máy cũ?", description: "Không bắt buộc.", placeholder: "VD: Daikin, khoảng 5 năm" });
          list.push({ id: "condition", kind: "choice", question: "Tình trạng máy hiện tại?", options: CONDITION_OPTIONS });
        }
      }
      list.push({ id: "urgency", kind: "choice", question: "Thời gian mong muốn?", options: PRODUCT_URGENCY_OPTIONS });
      if (cq.skipAttachment) skipAttachment = true;
    } else if (branch === "service") {
      if (!serviceId) {
        list.push({ id: "service-group-picker", kind: "service-group-picker" });
        if (picked.serviceGroupId) list.push({ id: "service-category-picker", kind: "service-category-picker" });
      }

      // Only ask "loại hỗ trợ nào" when the group step was skipped (or this
      // is a serviceId-preset entry with no group at all) — that's the only
      // case nothing else has told us yet. Picking a real group already
      // answers this; re-asking it would be the exact conflict the product
      // branch had (asking quy mô/ngân sách again after a specific product
      // was already chosen).
      const groupPicked = !serviceId && Boolean(picked.serviceGroupId);
      if (!groupPicked) {
        list.push({ id: "supportType", kind: "choice", question: "Bạn cần loại hỗ trợ nào?", options: SERVICE_SUPPORT_TYPE_OPTIONS });
      }
      const effectiveSupportType = groupPicked ? deriveSupportType(picked.serviceGroupSlug) : qualify.supportType;
      serviceAttachmentQuestion =
        effectiveSupportType === "install" || effectiveSupportType === "rental"
          ? "Gửi ảnh mặt bằng lắp đặt nếu có?"
          : "Gửi ảnh tình trạng máy nếu có?";

      switch (effectiveSupportType) {
        case "maintenance":
          list.push({ id: "deviceCount", kind: "choice", question: "Số lượng thiết bị cần xử lý?", options: DEVICE_COUNT_OPTIONS });
          break;
        case "repair":
          list.push({ id: "symptom", kind: "choice", question: "Máy đang gặp vấn đề gì?", options: SYMPTOM_OPTIONS });
          break;
        case "tradein":
          list.push({ id: "oldDeviceInfo", kind: "free-text", question: "Đời máy / hãng máy cũ?", description: "Không bắt buộc.", placeholder: "VD: Daikin, khoảng 5 năm" });
          list.push({ id: "condition", kind: "choice", question: "Tình trạng máy hiện tại?", options: CONDITION_OPTIONS });
          break;
        case "install": {
          // Same capacity question as the product branch's own picker —
          // no budget line, since service pricing isn't fixed (every real
          // Service row is price_display_text "Liên hệ", verified against
          // the DB 2026-09-06) — but the same category-mismatch bug
          // applies equally here: this used to always ask "Quy mô cần
          // lắp?" in m² regardless of which of the 12 categories was
          // picked (user-reported screenshot, 2026-09-06: "Cung cấp & lắp
          // đặt" + "Công tắc thông minh" asked for m²).
          const cq = buildCapacityQuestion(picked.serviceCategorySlug, picked.serviceCategoryGroupSlug, serviceCategoryFacets);
          list.push({ id: cq.id, kind: "choice", question: cq.question, options: cq.options });
          if (cq.skipAttachment) skipAttachment = true;
          break;
        }
        case "rental":
          list.push({ id: "rentalDuration", kind: "choice", question: "Thời gian thuê dự kiến?", options: RENTAL_DURATION_OPTIONS });
          break;
        default:
          // Group picked but not one of the known buckets (e.g. "Thanh lý
          // máy lạnh", "Khác") — ask two generic, always-relevant questions
          // instead of forcing a possibly-wrong bucket.
          if (groupPicked) {
            list.push({ id: "deviceCount", kind: "choice", question: "Số lượng thiết bị liên quan?", options: DEVICE_COUNT_OPTIONS });
            list.push({ id: "condition", kind: "choice", question: "Tình trạng hiện tại?", options: CONDITION_OPTIONS });
          }
      }
      list.push({ id: "accessDifficulty", kind: "choice", question: "Vị trí lắp đặt / độ khó tiếp cận?", options: ACCESS_DIFFICULTY_OPTIONS });
      list.push({ id: "urgency", kind: "choice", question: "Thời gian mong muốn?", options: SERVICE_URGENCY_OPTIONS });
    } else if (branch === "project") {
      list.push({ id: "project-type-picker", kind: "project-type-picker" });
      list.push({ id: "project-category-picker", kind: "project-category-picker" });

      // Scale/budget bands are tiered by project type (see
      // deriveProjectSizeTier's own comment for why and how) — but the
      // exact numbers are still a read of past case studies, not sourced
      // ELC pricing, so the question itself says "tham khảo" rather than
      // presenting them as firm brackets.
      const sizeTier = deriveProjectSizeTier(picked.projectTypeSlug);
      const projectScaleOptions =
        sizeTier === "small" ? PROJECT_SCALE_OPTIONS_SMALL : sizeTier === "large" ? PROJECT_SCALE_OPTIONS_LARGE : PROJECT_SCALE_OPTIONS_MEDIUM;
      const projectBudgetOptions =
        sizeTier === "small" ? PROJECT_BUDGET_OPTIONS_SMALL : sizeTier === "large" ? PROJECT_BUDGET_OPTIONS_LARGE : PROJECT_BUDGET_OPTIONS_MEDIUM;

      list.push({
        id: "scale",
        kind: "choice",
        question: "Quy mô ước tính?",
        description: "Mức tham khảo — đội ngũ tư vấn sẽ khảo sát chính xác khi liên hệ.",
        options: projectScaleOptions,
      });
      list.push({
        id: "budget",
        kind: "choice",
        question: "Ngân sách dự kiến?",
        description: "Mức tham khảo, có thể điều chỉnh sau khảo sát thực tế.",
        options: projectBudgetOptions,
      });
      list.push({ id: "stage", kind: "choice", question: "Giai đoạn hiện tại của công trình?", options: PROJECT_STAGE_OPTIONS });
      list.push({ id: "role", kind: "choice", question: "Vai trò của bạn?", options: ROLE_OPTIONS });
      list.push({ id: "siteVisit", kind: "choice", question: "Bạn có muốn hẹn khảo sát công trình miễn phí không?", options: SITE_VISIT_OPTIONS });
    }

    const attachmentQuestion =
      branch === "service"
        ? (serviceAttachmentQuestion ?? "Gửi ảnh tình trạng máy nếu có?")
        : branch === "project"
          ? "Gửi ảnh mặt bằng / công trình nếu có?"
          : "Gửi ảnh liên quan nếu có?";
    if (!skipAttachment) list.push({ id: "attachment", kind: "attachment", question: attachmentQuestion });
    list.push({
      id: "khuVuc",
      kind: "address",
      question: branch === "project" ? "Công trình ở khu vực nào?" : "Bạn ở khu vực nào?",
    });
    list.push({ id: "message", kind: "rhf-textarea", question: "Còn điều gì khác bạn muốn nói không?", description: "Không bắt buộc.", placeholder: "Ghi chú thêm..." });
    list.push({ id: "contactPreference", kind: "choice", question: "Bạn muốn được liên hệ qua?", options: CONTACT_PREFERENCE_OPTIONS });
    list.push({ id: "name", kind: "rhf-text", question: "Bạn tên là gì?", placeholder: "Nguyễn Văn A", type: "text", autoComplete: "name" });
    list.push({ id: "phone", kind: "rhf-text", question: "Số điện thoại của bạn?", placeholder: "09xx xxx xxx", type: "tel", autoComplete: "tel" });
    if (branch === "project") {
      list.push({ id: "email", kind: "rhf-text", question: "Email của bạn?", description: "Để gửi báo giá/hồ sơ chi tiết.", placeholder: "ban@email.com", type: "email", autoComplete: "email" });
    }

    return list;
  }, [
    branch,
    productId,
    serviceId,
    picked.serviceGroupId,
    picked.serviceGroupSlug,
    picked.serviceCategorySlug,
    picked.serviceCategoryGroupSlug,
    picked.productGroupSlug,
    picked.projectTypeSlug,
    productCategoryFacets,
    productScopedPriceFacet,
    serviceCategoryFacets,
    qualify.supportType,
    qualify.tradeIn,
  ]);

  const form = useForm<LeadFormValues>({
    resolver: standardSchemaResolver(createInquirySchema) as unknown as Resolver<LeadFormValues>,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      message: defaultMessage(entityKind, entityName),
      website: "",
    },
  });

  useEffect(() => {
    const remembered = readRememberedContact();
    if (!remembered) return;
    form.setValue("name", remembered.name);
    form.setValue("phone", remembered.phone);
    form.setValue("email", remembered.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const isLastStep = stepIndex === steps.length - 1;

  // Each step swap re-enters this scroll region at the top — otherwise a
  // step reached while scrolled down a long card grid would carry that
  // scroll offset into the next (possibly short) step.
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [stepIndex]);

  // Guarded by identity, not just "is there an element" — the ref callback
  // below is an inline arrow function, so React re-invokes it with the same
  // DOM node on every re-render (a new keystroke re-renders the form via
  // RHF's field state). Without this guard, el.select() would re-run and
  // re-select all text on every keystroke, so the next character typed
  // replaces the whole value instead of appending to it.
  const lastFocusedRef = useRef<Element | null>(null);
  function focusField(el: HTMLInputElement | HTMLTextAreaElement | null) {
    if (!el || el === lastFocusedRef.current) return;
    lastFocusedRef.current = el;
    el.focus();
    if (el instanceof HTMLInputElement) el.select();
  }

  const submitMutation = useMutation({
    mutationFn: () => {
      const values = form.getValues();
      const subType =
        branch === "product" ? picked.productCategorySlug
        : branch === "service" ? picked.serviceGroupSlug
        : branch === "project" ? picked.projectTypeSlug
        : undefined;

      return createInquiryAction({
        ...values,
        productId,
        projectId,
        serviceId,
        leadType: branch ?? "general",
        subType,
        qualifyData: qualify,
        attachments: attachmentUrls,
      });
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const values = form.getValues();
      saveRememberedContact({ name: values.name, phone: values.phone, email: values.email });
      gtag.event("generate_lead", {
        lead_source: branch ?? "general",
        items: entityName ? [{ item_id: productId ?? projectId ?? serviceId, item_name: entityName }] : undefined,
      });
      setSubmitted(true);
    },
    onError: () => {
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    },
  });

  function advance() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goNext() {
    if (currentStep.kind === "rhf-text" || currentStep.kind === "rhf-textarea") {
      void form.trigger(currentStep.id).then((valid) => {
        if (!valid) return;
        if (isLastStep) {
          form.handleSubmit(() => submitMutation.mutate())();
        } else {
          advance();
        }
      });
      return;
    }
    if (isLastStep) {
      form.handleSubmit(() => submitMutation.mutate())();
    } else {
      advance();
    }
  }

  function goPrev() {
    if (stepIndex === 0) {
      router.push(exitHref);
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      goNext();
    } else if (e.key === "Escape") {
      router.push(exitHref);
    }
  }

  function selectChoice(value: string) {
    setQualify((q) => ({ ...q, [currentStep.id]: value }));
    advance();
  }

  function selectProductCategory(category: PickedProductCategory) {
    setPicked((p) => ({
      ...p,
      productCategoryId: category.id,
      productCategoryName: category.name,
      productCategorySlug: category.slug,
      productGroupSlug: category.groupSlug,
    }));
    setQualify((q) => ({ ...q, productCategory: category.name }));
    // Reset immediately (not just on resolve) so a category switch never
    // shows the previous category's facets (budget scale, HP/airflow
    // options) while the new one loads. The scoped facet resets itself via
    // the effect above once productCategoryId changes.
    setProductCategoryFacets(null);
    void getProductsAction({ categoryId: category.id, limit: 1 }).then((res) => {
      setProductCategoryFacets(res.facets);
    });
    advance();
  }

  function selectServiceGroup(group: PickedServiceGroup) {
    setPicked((p) => ({ ...p, serviceGroupId: group.id, serviceGroupName: group.name, serviceGroupSlug: group.slug }));
    // Record the derived bucket into qualify_data too (not just used
    // internally for step-routing) so admin sees the same `supportType`
    // key whether it came from the question or was silently derived here.
    const derived = deriveSupportType(group.slug);
    setQualify((q) => ({ ...q, serviceGroup: group.name, ...(derived ? { supportType: derived } : {}) }));
    advance();
  }

  function selectServiceCategory(category: PickedServiceCategory) {
    setPicked((p) => ({
      ...p,
      serviceCategoryId: category.id,
      serviceCategoryName: category.name,
      serviceCategorySlug: category.slug,
      serviceCategoryGroupSlug: category.groupSlug,
    }));
    setQualify((q) => ({ ...q, serviceCategory: category.name }));
    setServiceCategoryFacets(null);
    void getProductsAction({ categoryId: category.id, limit: 1 }).then((res) => {
      setServiceCategoryFacets(res.facets);
    });
    advance();
  }

  function selectProjectType(type: PickedProjectType) {
    setPicked((p) => ({ ...p, projectTypeId: type.id, projectTypeName: type.name, projectTypeSlug: type.slug }));
    setQualify((q) => ({ ...q, projectType: type.name }));
    advance();
  }

  // Toggle, not select-and-advance — a project can need several equipment
  // lines at once, so the visitor confirms with the OK button (see
  // showOkButton) instead of each tap jumping to the next question.
  function toggleProjectCategory(category: PickedProjectCategory) {
    const ids = picked.projectCategoryIds ?? [];
    const names = picked.projectCategoryNames ?? [];
    const idx = ids.indexOf(category.id);
    const nextIds = idx >= 0 ? ids.filter((_, i) => i !== idx) : [...ids, category.id];
    const nextNames = idx >= 0 ? names.filter((_, i) => i !== idx) : [...names, category.name];
    setPicked((p) => ({ ...p, projectCategoryIds: nextIds, projectCategoryNames: nextNames }));
    setQualify((q) => ({ ...q, projectCategories: nextNames.join(", ") }));
  }

  if (submitted) {
    return (
      <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#3c70b0]">
        <Image src={typeformBg} alt="" fill priority placeholder="blur" sizes="100vw" className="object-cover -z-20" />
        <div className="absolute inset-0 -z-10 bg-blue-950/25" />

        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Check size={56} weight="bold" className="text-white drop-shadow-md" />
          </m.div>
          <div className="space-y-2 max-w-md">
            <h1 className="text-2xl font-semibold text-white drop-shadow-sm">Đã gửi yêu cầu tư vấn!</h1>
            <p className="text-white/80 drop-shadow-sm">
              Điện máy ELC sẽ liên hệ với bạn trong thời gian sớm nhất.
            </p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:justify-center sm:gap-4">
            <Button size="lg" className="w-full sm:w-auto sm:min-w-48" onClick={() => router.push(exitHref)}>
              Xong
            </Button>
            {zaloHref && (
              <Button size="lg" variant="outline" className="w-full sm:w-auto sm:min-w-48" asChild>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer">
                  Cần gấp? Chat Zalo với kỹ thuật viên ngay
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const showOkButton =
    currentStep.kind === "rhf-text" ||
    currentStep.kind === "rhf-textarea" ||
    currentStep.kind === "free-text" ||
    currentStep.kind === "address" ||
    currentStep.kind === "attachment" ||
    currentStep.kind === "project-category-picker";

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden bg-[#3c70b0]">
      {/* User-supplied background (2026-09-07). Text/buttons throughout this
          form are now explicitly light (text-white etc., matching
          HeroSection's own approach) so a darkening overlay only helps
          contrast here — unlike the earlier white scrim attempt, which
          fought the light text and got reverted. A flat deep-blue tint
          (not a directional gradient like hero's) since the ask was
          simply "make the photo read as a deeper blue," not to fade any
          one edge. */}
      <Image src={typeformBg} alt="" fill priority placeholder="blur" sizes="100vw" className="object-cover -z-20" />
      <div className="absolute inset-0 -z-10 bg-blue-950/25" />

      {/* Step 2 (2026-09-07): every "bare" text/border element (no opaque
          fill behind it) gets an explicit light color here, same approach
          as HeroSection's own text-white/text-white/70/80 — not a `.dark`
          class wrap (tried and reverted: plain elements with no explicit
          color class inherit body's already-resolved light-mode color
          instead of re-reading a nested .dark scope's --foreground). Solid
          controls (the outline-variant back button, the dark avatar
          circle) already read fine as opaque shapes on the photo and are
          intentionally left alone. */}
      <div className="h-1 w-full shrink-0 bg-white/30">
        <div
          className="h-full bg-white transition-[width] duration-300 ease-out"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => router.push(exitHref)}
          className="text-white/70 drop-shadow-sm hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <X size={22} />
        </button>
        <span className="text-sm text-white/70 drop-shadow-sm">
          {stepIndex + 1} / {steps.length}
        </span>
      </div>

      {/* Single scroll region for the whole step — steps that outgrow the
          viewport (e.g. a 12+ item category grid) scroll here as one unit,
          with the header/footer chrome always pinned above and below.
          Replaces a previous design that vertically centered this content:
          centering an overflowing flex item clips its "before" edge outside
          any scrollable range, so tall steps silently lost their first row. */}
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-12 md:px-24">
        <div className="w-full max-w-2xl mx-auto py-8">
          <AnimatePresence mode="wait">
            <m.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentStep.kind === "branch-select" && <BranchSelectStep onSelect={setBranch} />}

              {currentStep.kind === "choice" && (
                <ChoiceStep
                  question={currentStep.question}
                  description={currentStep.description}
                  options={currentStep.options}
                  value={qualify[currentStep.id] ?? currentStep.defaultValue}
                  onSelect={selectChoice}
                />
              )}

              {currentStep.kind === "product-category-picker" && (
                <ProductCategoryPickerStep
                  categories={productCategories}
                  selectedId={picked.productCategoryId}
                  onSelect={selectProductCategory}
                  onSkip={advance}
                />
              )}

              {currentStep.kind === "service-group-picker" && (
                <ServiceGroupPickerStep
                  groups={serviceGroups}
                  selectedId={picked.serviceGroupId}
                  onSelect={selectServiceGroup}
                  onSkip={advance}
                />
              )}

              {currentStep.kind === "service-category-picker" && (
                <ServiceCategoryPickerStep
                  categories={filterCategoriesForServiceGroup(productCategories, picked.serviceGroupSlug)}
                  selectedId={picked.serviceCategoryId}
                  onSelect={selectServiceCategory}
                  onSkip={advance}
                />
              )}

              {currentStep.kind === "project-type-picker" && (
                <ProjectTypePickerStep
                  projectTypes={projectTypes}
                  selectedId={picked.projectTypeId}
                  onSelect={selectProjectType}
                  onSkip={advance}
                />
              )}

              {currentStep.kind === "project-category-picker" && (
                <ProjectCategoryPickerStep
                  categories={filterCategoriesForProject(productCategories)}
                  selectedIds={picked.projectCategoryIds ?? []}
                  onToggle={toggleProjectCategory}
                  onSkip={advance}
                />
              )}

              {currentStep.kind === "attachment" && (
                <AttachmentStep question={currentStep.question} urls={attachmentUrls} onChange={setAttachmentUrls} />
              )}

              {currentStep.kind === "free-text" && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance text-white drop-shadow-sm">
                    {currentStep.question}
                  </h1>
                  {currentStep.description && <p className="mt-3 text-white/80 drop-shadow-sm">{currentStep.description}</p>}
                  <div className="mt-8">
                    <Input
                      autoFocus
                      defaultValue={qualify[currentStep.id] ?? ""}
                      onChange={(e) => setQualify((q) => ({ ...q, [currentStep.id]: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      placeholder={currentStep.placeholder}
                      className="!text-xl sm:!text-2xl h-auto border-0 border-b-2 border-white/40 rounded-none px-0 py-2 shadow-none text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white bg-transparent"
                    />
                  </div>
                </div>
              )}

              {currentStep.kind === "address" && (
                <AddressStep
                  question={currentStep.question}
                  description={currentStep.description}
                  onChange={(v) => setQualify((q) => ({ ...q, [currentStep.id]: v }))}
                  onKeyDown={handleKeyDown}
                />
              )}

              {(currentStep.kind === "rhf-text" || currentStep.kind === "rhf-textarea") && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance text-white drop-shadow-sm">
                    {currentStep.question}
                  </h1>
                  {currentStep.description && <p className="mt-3 text-white/80 drop-shadow-sm">{currentStep.description}</p>}
                  <div className="mt-8">
                    <Controller
                      control={form.control}
                      name={currentStep.id}
                      render={({ field }) =>
                        currentStep.kind === "rhf-textarea" ? (
                          <Textarea
                            {...field}
                            ref={(el) => {
                              field.ref(el);
                              focusField(el);
                            }}
                            onKeyDown={handleKeyDown}
                            rows={3}
                            placeholder={currentStep.placeholder}
                            className="!text-xl sm:!text-2xl border-0 border-b-2 border-white/40 rounded-none px-0 shadow-none text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white bg-transparent resize-none"
                          />
                        ) : (
                          <Input
                            {...field}
                            ref={(el) => {
                              field.ref(el);
                              focusField(el);
                            }}
                            type={currentStep.type}
                            autoComplete={currentStep.autoComplete}
                            onKeyDown={handleKeyDown}
                            onChange={
                              currentStep.id === "phone"
                                ? (e) => handlePhoneChange(e, field.onChange)
                                : field.onChange
                            }
                            placeholder={currentStep.placeholder}
                            className="!text-xl sm:!text-2xl h-auto border-0 border-b-2 border-white/40 rounded-none px-0 py-2 shadow-none text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white bg-transparent"
                          />
                        )
                      }
                    />
                    <FieldError errors={[form.formState.errors[currentStep.id]]} />
                  </div>
                </div>
              )}

            </m.div>
          </AnimatePresence>

          {/* Honeypot: hidden from real visitors, positioned off-screen
              rather than display:none. */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="lead-form-website">Website</label>
            <Controller
              control={form.control}
              name="website"
              render={({ field }) => (
                <input {...field} id="lead-form-website" tabIndex={-1} autoComplete="off" />
              )}
            />
          </div>
        </div>
      </div>

      {/* Both nav buttons live in one fixed footer row now, instead of
          "Tiếp tục" scrolling away inside the step content while "Quay
          lại" stayed pinned bottom-right — that split them into opposite
          corners on steps tall/short enough to notice (user-reported
          screenshot, 2026-09-07: multi-select category grid). Always
          visible regardless of scroll position, same as a typical
          multi-step form's persistent nav bar. */}
      <div className="flex shrink-0 items-center justify-between gap-4 px-6 sm:px-12 pb-6 pt-2">
        <Button type="button" variant="outline" onClick={goPrev}>
          <ArrowLeft size={18} />
          Quay lại
        </Button>

        {showOkButton && (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-white/70 drop-shadow-sm">nhấn Enter ↵</span>
            <Button type="button" size="lg" onClick={goNext} disabled={submitMutation.isLoading}>
              {isLastStep ? (
                submitMutation.isLoading ? "Đang gửi..." : "Gửi yêu cầu"
              ) : (
                <>
                  Tiếp tục
                  <ArrowRight size={18} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
