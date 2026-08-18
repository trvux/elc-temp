"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteDialog } from "@/shared/components/organisms/layout/admin/delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { VARIANT_STOCK_STATUS, VARIANT_STOCK_STATUS_MAP, PRODUCT_STATUS, PRODUCT_STATUS_MAP } from "../../domain";
import { deleteProductAction, getProductsAction } from "../actions";
import { getProductColumns } from "./ProductColumns";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";

export function ProductManagement() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStockStatus, setFilterStockStatus] = useState<string>("all");

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await getProductsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await getGroupsAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-new"],
    queryFn: async () => {
      const { data, error } = await getCategoriesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa sản phẩm");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleGroupIdChange = (val: string) => {
    setFilterGroupId(val);
    setFilterCategoryId("all");
  };

  const filteredCategoriesForFilter = useMemo(() => {
    if (filterGroupId === "all") {
      return categories;
    }
    return categories.filter((c) => c.groupId === filterGroupId);
  }, [categories, filterGroupId]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const matchGroup = filterGroupId === "all" || (cat && cat.groupId === filterGroupId);
      const matchCategory = filterCategoryId === "all" || p.categoryId === filterCategoryId;
      const matchFeatured = filterIsFeatured === "all" || (filterIsFeatured === "true" ? p.isFeatured : !p.isFeatured);
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchStockStatus = filterStockStatus === "all" || p.displayStockStatus === filterStockStatus;
      return matchGroup && matchCategory && matchFeatured && matchStatus && matchStockStatus;
    });
  }, [products, filterGroupId, filterCategoryId, filterIsFeatured, filterStatus, filterStockStatus, categories]);

  const columns = useMemo(
    () =>
      getProductColumns({
        onEdit: (p) => router.push(`/admin/products/${p.id}`),
        onDelete: setDeletingId,
      }),
    [router]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh sách sản phẩm, giá bán và thông số kỹ thuật.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/admin/products/new")} className="h-9">
            <Plus size={16} className="mr-2" /> Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select value={filterGroupId} onValueChange={handleGroupIdChange}>
          <SelectTrigger className="w-full md:w-50">
            <SelectValue placeholder="Nhóm danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhóm danh mục</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
          <SelectTrigger className="w-full md:w-55">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-80 overflow-y-auto">
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {filteredCategoriesForFilter.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterIsFeatured} onValueChange={setFilterIsFeatured}>
          <SelectTrigger className="w-full md:w-37.5">
            <SelectValue placeholder="Mức độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mức độ</SelectItem>
            <SelectItem value="true">Nổi bật</SelectItem>
            <SelectItem value="false">Thường</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-37.5">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.values(PRODUCT_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {PRODUCT_STATUS_MAP[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Tình trạng kho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tình trạng</SelectItem>
            {Object.values(VARIANT_STOCK_STATUS).map((status) => (
              <SelectItem key={status} value={status}>
                {VARIANT_STOCK_STATUS_MAP[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterGroupId !== "all" ||
          filterCategoryId !== "all" ||
          filterIsFeatured !== "all" ||
          filterStatus !== "all" ||
          filterStockStatus !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterGroupId("all");
              setFilterCategoryId("all");
              setFilterIsFeatured("all");
              setFilterStatus("all");
              setFilterStockStatus("all");
            }}
            className="h-10 text-muted-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoadingProducts}
        searchKey="name"
        searchPlaceholder="Tìm kiếm tên sản phẩm..."
      />

      <DeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
