"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { getServiceGroupsAction } from "@/modules/service-group/presentation/actions";
import type { ServiceGroup } from "@/modules/service-group/domain/types";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import type { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";

import { createInquirySchema } from "../../domain";
import { createInquiryAction } from "../actions";
import { BranchSelectStep, type LeadBranch } from "./steps/BranchSelectStep";
import { ChoiceStep, type ChoiceOption } from "./steps/ChoiceStep";
import { ProductCategoryPickerStep, type PickedProductCategory } from "./steps/ProductCategoryPickerStep";
import { ServiceGroupPickerStep, type PickedServiceGroup } from "./steps/ServiceGroupPickerStep";
import { ServiceCategoryPickerStep, type PickedServiceCategory } from "./steps/ServiceCategoryPickerStep";
import { ProjectTypePickerStep, type PickedProjectType } from "./steps/ProjectTypePickerStep";
import { ProjectCategoryPickerStep, type PickedProjectCategory } from "./steps/ProjectCategoryPickerStep";
import { AttachmentStep } from "./steps/AttachmentStep";

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

// --- Option sets for every "choice" step across the 3 branches ---
const SCALE_OPTIONS: ChoiceOption[] = [
  { value: "<20m2", label: "Dưới 20m²" },
  { value: "20-40m2", label: "20 - 40m²" },
  { value: ">40m2", label: "Trên 40m²" },
  { value: "chua-ro", label: "Chưa rõ" },
];
const PRODUCT_BUDGET_OPTIONS: ChoiceOption[] = [
  { value: "<10tr", label: "Dưới 10 triệu" },
  { value: "10-20tr", label: "10 - 20 triệu" },
  { value: ">20tr", label: "Trên 20 triệu" },
  { value: "chua-ro", label: "Chưa rõ" },
];
const YES_NO_OPTIONS: ChoiceOption[] = [
  { value: "co", label: "Có" },
  { value: "khong", label: "Không" },
];
const PRODUCT_URGENCY_OPTIONS: ChoiceOption[] = [
  { value: "gap-1-2-ngay", label: "Gấp trong 1-2 ngày" },
  { value: "trong-tuan", label: "Trong tuần này" },
  { value: "tham-khao", label: "Chỉ tham khảo" },
];
const SERVICE_SUPPORT_TYPE_OPTIONS: ChoiceOption[] = [
  { value: "maintenance", label: "Bảo dưỡng - vệ sinh định kỳ" },
  { value: "repair", label: "Sửa chữa - có sự cố" },
  { value: "tradein", label: "Thu cũ đổi máy mới" },
  { value: "install", label: "Lắp đặt máy mới" },
  { value: "rental", label: "Thuê máy" },
];
const RENTAL_DURATION_OPTIONS: ChoiceOption[] = [
  { value: "ngan-han", label: "Ngắn hạn (theo ngày/tuần)" },
  { value: "theo-thang", label: "Theo tháng" },
  { value: "dai-han", label: "Theo mùa / dài hạn" },
];
const DEVICE_COUNT_OPTIONS: ChoiceOption[] = [
  { value: "1", label: "1 thiết bị" },
  { value: "2-3", label: "2 - 3 thiết bị" },
  { value: ">3", label: "Trên 3 thiết bị" },
];
const SYMPTOM_OPTIONS: ChoiceOption[] = [
  { value: "khong-lanh", label: "Không lạnh / không mát" },
  { value: "chay-nuoc", label: "Chảy nước" },
  { value: "mat-nguon", label: "Mất nguồn / không lên" },
  { value: "tieng-on", label: "Có tiếng ồn / mùi lạ" },
  { value: "bao-loi", label: "Báo lỗi / chớp đèn" },
  { value: "khac", label: "Khác" },
];
const CONDITION_OPTIONS: ChoiceOption[] = [
  { value: "tot", label: "Còn chạy tốt" },
  { value: "loi-nhe", label: "Có lỗi nhỏ" },
  { value: "hong", label: "Đã hỏng hẳn" },
];
const ACCESS_DIFFICULTY_OPTIONS: ChoiceOption[] = [
  { value: "tang-tret", label: "Tầng trệt / ban công dễ vào" },
  { value: "thang-thuong", label: "Trên cao, cần thang thường" },
  { value: "chung-cu-cao-tang", label: "Chung cư cao tầng, cần thiết bị chuyên dụng" },
  { value: "chua-ro", label: "Chưa rõ" },
];
const SERVICE_URGENCY_OPTIONS: ChoiceOption[] = [
  { value: "gap-1-2-gio", label: "Gấp trong 1-2 giờ" },
  { value: "hom-nay-ngay-mai", label: "Trong hôm nay - ngày mai" },
  { value: "trong-tuan", label: "Trong tuần này" },
  { value: "tham-khao", label: "Chỉ tham khảo" },
];
const PROJECT_SCALE_OPTIONS: ChoiceOption[] = [
  { value: "<100m2", label: "Dưới 100m²" },
  { value: "100-300m2", label: "100 - 300m²" },
  { value: "300-1000m2", label: "300 - 1000m²" },
  { value: ">1000m2", label: "Trên 1000m²" },
  { value: "chua-ro", label: "Chưa rõ" },
];
const PROJECT_BUDGET_OPTIONS: ChoiceOption[] = [
  { value: "<200tr", label: "Dưới 200 triệu" },
  { value: "200-500tr", label: "200 - 500 triệu" },
  { value: "500tr-1ty", label: "500 triệu - 1 tỷ" },
  { value: ">1ty", label: "Trên 1 tỷ" },
  { value: "chua-ro", label: "Chưa rõ, cần tư vấn" },
];
const PROJECT_STAGE_OPTIONS: ChoiceOption[] = [
  { value: "co-ban-ve", label: "Đã có bản vẽ thiết kế" },
  { value: "xay-tho", label: "Đang xây thô" },
  { value: "cai-tao", label: "Cải tạo - thay mới" },
  { value: "tham-khao", label: "Chỉ đang tham khảo giá" },
];
const ROLE_OPTIONS: ChoiceOption[] = [
  { value: "chu-dau-tu", label: "Chủ đầu tư" },
  { value: "don-vi-thi-cong", label: "Đơn vị thi công / thầu phụ" },
  { value: "kts", label: "KTS / tư vấn thiết kế" },
  { value: "khac", label: "Khác" },
];
const SITE_VISIT_OPTIONS: ChoiceOption[] = [
  { value: "co", label: "Có, sắp xếp lịch khảo sát" },
  { value: "chua-can", label: "Chưa cần, chỉ báo giá sơ bộ" },
];
const CONTACT_PREFERENCE_OPTIONS: ChoiceOption[] = [
  { value: "goi-dien", label: "Gọi điện thoại" },
  { value: "zalo", label: "Nhắn tin Zalo" },
];

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

interface PickedState {
  productCategoryId?: string;
  productCategoryName?: string;
  productCategorySlug?: string;
  serviceGroupId?: string;
  serviceGroupName?: string;
  serviceGroupSlug?: string;
  serviceCategoryId?: string;
  serviceCategoryName?: string;
  serviceCategorySlug?: string;
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

  const steps = useMemo<StepDescriptor[]>(() => {
    if (!branch) return [{ id: "branch", kind: "branch-select" }];

    const list: StepDescriptor[] = [];

    if (branch === "product") {
      if (!productId) list.push({ id: "product-picker", kind: "product-category-picker" });
      list.push({ id: "scale", kind: "choice", question: "Quy mô/công suất cần lắp?", options: SCALE_OPTIONS });
      list.push({ id: "budget", kind: "choice", question: "Ngân sách dự kiến?", options: PRODUCT_BUDGET_OPTIONS });
      list.push({ id: "tradeIn", kind: "choice", question: "Có máy cũ cần thu đổi không?", options: YES_NO_OPTIONS });
      list.push({ id: "urgency", kind: "choice", question: "Thời gian mong muốn?", options: PRODUCT_URGENCY_OPTIONS });
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
        case "install":
          list.push({ id: "scale", kind: "choice", question: "Quy mô cần lắp?", options: SCALE_OPTIONS });
          break;
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
      list.push({ id: "scale", kind: "choice", question: "Quy mô ước tính?", options: PROJECT_SCALE_OPTIONS });
      list.push({ id: "budget", kind: "choice", question: "Ngân sách dự kiến?", options: PROJECT_BUDGET_OPTIONS });
      list.push({ id: "stage", kind: "choice", question: "Giai đoạn hiện tại của công trình?", options: PROJECT_STAGE_OPTIONS });
      list.push({ id: "role", kind: "choice", question: "Vai trò của bạn?", options: ROLE_OPTIONS });
      list.push({ id: "siteVisit", kind: "choice", question: "Bạn có muốn hẹn khảo sát công trình miễn phí không?", options: SITE_VISIT_OPTIONS });
    }

    const attachmentQuestion =
      branch === "service"
        ? "Gửi ảnh tình trạng máy nếu có?"
        : branch === "project"
          ? "Gửi ảnh mặt bằng / công trình nếu có?"
          : "Gửi ảnh liên quan nếu có?";
    list.push({ id: "attachment", kind: "attachment", question: attachmentQuestion });
    list.push({
      id: "khuVuc",
      kind: "free-text",
      question: branch === "project" ? "Công trình ở khu vực nào?" : "Bạn ở khu vực nào?",
      placeholder: "VD: Quận 1, TP.HCM",
    });
    list.push({ id: "message", kind: "rhf-textarea", question: "Còn điều gì khác bạn muốn nói không?", description: "Không bắt buộc.", placeholder: "Ghi chú thêm..." });
    list.push({ id: "contactPreference", kind: "choice", question: "Bạn muốn được liên hệ qua?", options: CONTACT_PREFERENCE_OPTIONS });
    list.push({ id: "name", kind: "rhf-text", question: "Bạn tên là gì?", placeholder: "Nguyễn Văn A", type: "text", autoComplete: "name" });
    list.push({ id: "phone", kind: "rhf-text", question: "Số điện thoại của bạn?", placeholder: "09xx xxx xxx", type: "tel", autoComplete: "tel" });
    if (branch === "project") {
      list.push({ id: "email", kind: "rhf-text", question: "Email của bạn?", description: "Để gửi báo giá/hồ sơ chi tiết.", placeholder: "ban@email.com", type: "email", autoComplete: "email" });
    }

    return list;
  }, [branch, productId, serviceId, picked.serviceGroupId, picked.serviceGroupSlug, qualify.supportType]);

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
    setPicked((p) => ({ ...p, productCategoryId: category.id, productCategoryName: category.name, productCategorySlug: category.slug }));
    setQualify((q) => ({ ...q, productCategory: category.name }));
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
    setPicked((p) => ({ ...p, serviceCategoryId: category.id, serviceCategoryName: category.name, serviceCategorySlug: category.slug }));
    setQualify((q) => ({ ...q, serviceCategory: category.name }));
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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Check size={32} weight="bold" />
        </m.div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-semibold">Đã gửi yêu cầu tư vấn!</h1>
          <p className="text-muted-foreground">
            Điện máy ELC sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => router.push(exitHref)}>
            Xong
          </Button>
          {zaloHref && (
            <Button size="lg" variant="outline" asChild>
              <a href={zaloHref} target="_blank" rel="noopener noreferrer">
                Cần gấp? Chat Zalo với kỹ thuật viên ngay
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const showOkButton =
    currentStep.kind === "rhf-text" ||
    currentStep.kind === "rhf-textarea" ||
    currentStep.kind === "free-text" ||
    currentStep.kind === "attachment" ||
    currentStep.kind === "project-category-picker";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <div className="h-1 w-full shrink-0 bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => router.push(exitHref)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Đóng"
        >
          <X size={22} />
        </button>
        <span className="text-sm text-muted-foreground">
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
                  categories={productCategories}
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
                  categories={productCategories}
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
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance">
                    {currentStep.question}
                  </h1>
                  {currentStep.description && <p className="mt-3 text-muted-foreground">{currentStep.description}</p>}
                  <div className="mt-8">
                    <Input
                      autoFocus
                      defaultValue={qualify[currentStep.id] ?? ""}
                      onChange={(e) => setQualify((q) => ({ ...q, [currentStep.id]: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      placeholder={currentStep.placeholder}
                      className="!text-xl sm:!text-2xl h-auto border-0 border-b-2 rounded-none px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                    />
                  </div>
                </div>
              )}

              {(currentStep.kind === "rhf-text" || currentStep.kind === "rhf-textarea") && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance">
                    {currentStep.question}
                  </h1>
                  {currentStep.description && <p className="mt-3 text-muted-foreground">{currentStep.description}</p>}
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
                            className="!text-xl sm:!text-2xl border-0 border-b-2 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary bg-transparent resize-none"
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
                            className="!text-xl sm:!text-2xl h-auto border-0 border-b-2 rounded-none px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                          />
                        )
                      }
                    />
                    <FieldError errors={[form.formState.errors[currentStep.id]]} />
                  </div>
                </div>
              )}

              {showOkButton && (
                <div className="mt-8 flex items-center gap-4">
                  <Button type="button" size="lg" onClick={goNext} disabled={submitMutation.isLoading}>
                    {isLastStep ? (
                      submitMutation.isLoading ? "Đang gửi..." : "Gửi yêu cầu"
                    ) : (
                      <>
                        OK
                        <ArrowRight size={18} className="ml-1" />
                      </>
                    )}
                  </Button>
                  <span className="hidden sm:inline text-sm text-muted-foreground">nhấn Enter ↵</span>
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

      <div className="flex shrink-0 justify-center sm:justify-end px-6 sm:px-12 pb-6 pt-2">
        <Button type="button" variant="outline" size="icon" onClick={goPrev} aria-label="Câu trước">
          <ArrowLeft size={18} />
        </Button>
      </div>
    </div>
  );
}
