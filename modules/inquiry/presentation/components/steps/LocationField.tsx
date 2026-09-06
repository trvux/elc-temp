"use client";

import { useState } from "react";
import { Check, CaretUpDown } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/components/ui/command";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/components/ui/drawer";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { LocationCombobox } from "@/modules/shipping-zone/presentation/components/LocationCombobox";

interface LocationOption {
  code: string;
  name: string;
}

interface LocationFieldProps {
  items: LocationOption[];
  value: string;
  onValueChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
  drawerTitle: string;
}

// Desktop keeps the existing Popover-based LocationCombobox unchanged.
// Mobile swaps to a bottom Drawer instead — a Popover's position is
// computed relative to the trigger at open time and doesn't reliably keep
// tracking how much the on-screen keyboard shrinks the visual viewport
// (behavior varies by iOS Safari / Android Chrome version, and this
// trigger can sit anywhere down a long scrolling form); a full-height
// Drawer with its own scroll region is the standard mobile-picker shape
// (how both iOS and Android's native pickers work) and isn't affected by
// that. Reuses `useIsMobile` (768px, same as the admin sidebar's own
// cutover) rather than ProductFilterDialogButton's `lg` breakpoint — that
// one intentionally includes tablets because a filter accordion has no
// keyboard-interaction problem; this does, and only on an actual phone.
//
// User-proposed design, 2026-09-07 ("cái việc mở ra như này mà trên mobile
// có thêm cái keyword của phone nữa thì có bị conflic không ta? ... đưa
// search + chọn đó vào drawer") — shipped as a trial; revert to plain
// LocationCombobox everywhere if it doesn't feel right in practice.
export function LocationField({
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  emptyText = "Không tìm thấy.",
  className,
  drawerTitle,
}: LocationFieldProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.code === value);

  if (!isMobile) {
    return (
      <LocationCombobox
        items={items}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled}
        emptyText={emptyText}
        variant="ghost"
        className={className}
      />
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between font-normal hover:bg-transparent aria-expanded:bg-transparent aria-expanded:text-foreground",
            className,
          )}
        >
          <span className="truncate">{selected?.name || placeholder || "Chọn..."}</span>
          <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>{drawerTitle}</DrawerTitle>
        </DrawerHeader>
        <Command className="flex-1 overflow-hidden">
          <CommandInput placeholder="Tìm kiếm..." />
          <CommandList className="max-h-none overflow-y-auto px-2 pb-6">
            <CommandEmpty className="px-2 py-3">{emptyText}</CommandEmpty>
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
          </CommandList>
        </Command>
      </DrawerContent>
    </Drawer>
  );
}
