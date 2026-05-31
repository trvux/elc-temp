"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  FilterFn,
} from "@tanstack/react-table";
import { cn } from "@/shared/lib/utils";


import { useState, useMemo } from "react";
import { Input } from "@/shared/components/ui/input";

// Fuzzy filter function for Vietnamese and general text
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const searchTerm = value.toLowerCase();
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  const normalizedSearchTerm = normalize(searchTerm);

  const checkValue = (val: any) => {
    if (!val) return false;
    const rowValue = String(val).toLowerCase();
    const normalizedRowValue = normalize(rowValue);

    if (normalizedRowValue.includes(normalizedSearchTerm)) return true;

    let searchIdx = 0;
    for (
      let i = 0;
      i < normalizedRowValue.length && searchIdx < normalizedSearchTerm.length;
      i++
    ) {
      if (normalizedRowValue[i] === normalizedSearchTerm[searchIdx]) {
        searchIdx++;
      }
    }
    return searchIdx === normalizedSearchTerm.length;
  };

  // If used as a column filter
  if (columnId) {
    return checkValue(row.getValue(columnId));
  }

  // If used as a global filter, check all columns
  return row.getAllCells().some((cell) => checkValue(cell.getValue()));
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  rowClassName?: (data: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
  isLoading = false,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="w-full max-w-full overflow-hidden">
      {(searchKey || globalFilter !== undefined) && (
        <div className="flex items-center py-4">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="w-full h-[calc(100vh-300px)] min-h-[400px] overflow-auto relative">
          <table className="w-full min-w-[1000px] caption-bottom text-sm border-separate border-spacing-0">
            <thead className="[&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-card">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="sticky top-0 z-20 bg-card h-10 px-2 text-left align-middle text-sm font-medium whitespace-nowrap text-foreground border-b shadow-[0_1px_0_0_rgba(0,0,0,0.08)]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center p-2 align-middle"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                      rowClassName?.(row.original)
                    )}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-2 align-middle whitespace-normal min-w-[100px]"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center p-2 align-middle"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
