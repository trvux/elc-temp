"use client";

import { useState } from "react";
import { Check, CaretUpDown } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

interface LocationOption {
  code: string;
  name: string;
}

interface LocationComboboxProps {
  items: LocationOption[];
  value: string;
  onValueChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  // Defaults to fit-content (no forced width) — pass "w-full" when the
  // combobox should stretch to fill a full-width form field instead (see
  // BranchManagement.tsx/ShippingZoneManagement.tsx usages).
  className?: string;
}

// Single-select, type-to-filter combobox for province/ward pickers — same
// Popover+Command shape as ProvinceMultiSelect/WardMultiSelect (proven to
// render/scroll correctly in this app), just single-selection: picking an
// item closes the popover instead of toggling a chip list.
export function LocationCombobox({
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  emptyText = "Không tìm thấy.",
  className,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between font-normal", className)}
        >
          <span className="truncate">{selected?.name || placeholder || "Chọn..."}</span>
          <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm..." />
          {/* Base CommandList's own scrolling relies on a "no-scrollbar"
              class (hides the thumb but still scrolls via wheel/trackpad in
              theory) that repeatedly read as "the list just stops" — plain
              native div + inline maxHeight/overflowY here instead: a real
              browser scrollbar, no custom CSS involved, guaranteed to work
              regardless of cmdk's own internal sizing. */}
          <CommandList className="max-h-none overflow-visible p-0">
            <CommandEmpty className="px-2 py-3">{emptyText}</CommandEmpty>
            {/* Popover content isn't a registered "shard" for the
                Radix Dialog scroll-lock this combobox is usually nested
                inside (BranchManagement/ShippingZoneManagement forms are
                AdminDialogs) — that lock's document-level listener calls
                preventDefault() on every wheel event outside its allow-list,
                which silently kills native scrolling here. preventDefault()
                doesn't stop propagation, so we still get the event; drive
                scrollTop ourselves instead of relying on the browser. */}
            <div
              style={{ maxHeight: 288, overflowY: "auto" }}
              onWheel={(e) => {
                e.currentTarget.scrollTop += e.deltaY;
              }}
            >
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.code}
                    value={item.name}
                    onSelect={() => {
                      onValueChange(item.code);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === item.code ? "opacity-100" : "opacity-0")} />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
