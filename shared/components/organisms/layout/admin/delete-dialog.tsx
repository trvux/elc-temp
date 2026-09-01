"use client";

import { ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { Product } from "@/modules/catalog/domain/types";
import { ProjectWithCategory } from "@/modules/project/domain/types";
import { Service } from "@/modules/service/domain/types";

const EMPTY_ARRAY: unknown[] = [];

type DeleteEntityType = "group" | "category" | "project-type" | "service-group";

interface AffectedSection {
  title: string;
  items: { id: string; name: string }[];
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: ReactNode;
  isLoading?: boolean;
  
  // Reusable warning logic
  entityType?: DeleteEntityType;
  entityId?: string | null;

  // Custom configuration overrides
  affectedSections?: AffectedSection[];
  warningText?: string;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Xác nhận xóa?",
  description,
  isLoading = false,
  entityType,
  entityId,
  affectedSections = [],
  warningText,
}: DeleteDialogProps) {
  // Fetch Category Group categories (for entityType === "group")
  const isGroup = entityType === "group" && !!entityId && open;
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-new-list"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: isGroup,
  });
  const categories = (categoriesData || EMPTY_ARRAY) as CategoryWithGroup[];

  // Fetch Category products and projects (for entityType === "category")
  const isCategory = entityType === "category" && !!entityId && open;
  const { data: productsData } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data } = await getProductsAction();
      return data || [];
    },
    enabled: isCategory,
  });
  const products = (productsData || EMPTY_ARRAY) as Product[];

  const { data: projectsData } = useQuery({
    queryKey: ["admin-projects-list"],
    queryFn: async () => {
      const { data } = await getProjectsAction();
      return data || [];
    },
    enabled: (isCategory || (entityType === "project-type" && !!entityId)) && open,
  });
  const projects = (projectsData || EMPTY_ARRAY) as ProjectWithCategory[];

  // Fetch Service Group services (for entityType === "service-group")
  const isServiceGroup = entityType === "service-group" && !!entityId && open;
  const { data: servicesData } = useQuery({
    queryKey: ["admin-services-list"],
    queryFn: async () => {
      const { data } = await getServicesAction();
      return data || [];
    },
    enabled: isServiceGroup,
  });
  const services = (servicesData || EMPTY_ARRAY) as Service[];

  // Compute affected sections based on entityType/entityId
  const affectedCategories = useMemo(() => {
    if (!isGroup || !entityId) return [];
    return categories
      .filter((c) => c.groupId === entityId)
      .map((c) => ({ id: c.id, name: c.name }));
  }, [categories, isGroup, entityId]);

  const affectedProducts = useMemo(() => {
    if (!isCategory || !entityId) return [];
    return products
      .filter((p) => p.categoryId === entityId)
      .map((p) => ({ id: p.id, name: p.name }));
  }, [products, isCategory, entityId]);

  const affectedProjects = useMemo(() => {
    if (!isCategory || !entityId) return [];
    return projects
      .filter((p) => p.categories?.some((cat: { id: string }) => cat.id === entityId))
      .map((p) => ({ id: p.id, name: p.title }));
  }, [projects, isCategory, entityId]);

  const affectedProjectsForType = useMemo(() => {
    if (entityType !== "project-type" || !entityId) return [];
    return projects
      .filter((p) => p.projectTypeId === entityId)
      .map((p) => ({ id: p.id, name: p.title }));
  }, [projects, entityType, entityId]);

  const affectedServices = useMemo(() => {
    if (!isServiceGroup || !entityId) return [];
    return services
      .filter((s) => s.groupId === entityId)
      .map((s) => ({ id: s.id, name: s.title }));
  }, [services, isServiceGroup, entityId]);

  const computedSections = useMemo(() => {
    if (affectedSections && affectedSections.length > 0) {
      return affectedSections;
    }
    if (!entityType || !entityId) return [];

    switch (entityType) {
      case "group":
        return [
          {
            title: "Nhóm danh mục này đang chứa các danh mục con sau",
            items: affectedCategories,
          },
        ];
      case "category":
        return [
          {
            title: "Danh mục này đang được liên kết với các sản phẩm sau",
            items: affectedProducts,
          },
          {
            title: "Danh mục này đang được liên kết với các dự án sau",
            items: affectedProjects,
          },
        ];
      case "project-type":
        return [
          {
            title: "Loại dự án này đang được liên kết với các dự án sau",
            items: affectedProjectsForType,
          },
        ];
      case "service-group":
        return [
          {
            title: "Nhóm dịch vụ này đang được liên kết với các dịch vụ sau",
            items: affectedServices,
          },
        ];
      default:
        return [];
    }
  }, [
    entityType,
    entityId,
    affectedSections,
    affectedCategories,
    affectedProducts,
    affectedProjects,
    affectedProjectsForType,
    affectedServices,
  ]);

  const computedWarningText = useMemo(() => {
    if (warningText) return warningText;
    if (!entityType || !entityId) return undefined;

    switch (entityType) {
      case "group":
        return "Nếu xóa, tất cả các danh mục con này cũng sẽ bị xóa mềm theo.";
      case "category":
        return "Nếu xóa, các liên kết này sẽ bị loại bỏ khỏi hệ thống.";
      case "project-type":
        return "Nếu xóa, các dự án này sẽ bị đưa về trạng thái không có loại dự án.";
      case "service-group":
        return "Nếu xóa, các dịch vụ này sẽ bị đưa về trạng thái không có nhóm.";
      default:
        return undefined;
    }
  }, [entityType, entityId, warningText]);

  const hasAffectedItems = computedSections.some((sec) => sec.items.length > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {description ? (
                description
              ) : (
                <p>Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
              )}

              {hasAffectedItems && (
                <div className="mt-3 border-t pt-3 space-y-3 text-muted-foreground">
                  {computedSections.map((section, idx) => {
                    if (section.items.length === 0) return null;
                    return (
                      <div key={idx} className="space-y-1">
                        <p className="font-semibold text-sm text-foreground">
                          {section.title} (tổng cộng {section.items.length}):
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs max-h-30 overflow-y-auto">
                          {section.items.map((item) => (
                            <li key={item.id}>{item.name}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                  {computedWarningText && (
                    <p className="text-xs pt-1 font-medium text-muted-foreground">
                      {computedWarningText}
                    </p>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            variant="destructive"
            disabled={isLoading}
          >
            {isLoading ? "Đang xóa..." : "Vâng, Xóa ngay"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
