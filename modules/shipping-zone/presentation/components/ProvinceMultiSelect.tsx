"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CaretUpDown, X } from "@phosphor-icons/react";

import { getProvincesAction } from "../actions";
import { Badge } from "@/shared/components/ui/badge";
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

interface ProvinceMultiSelectProps {
  value: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
}

// Mirrors shared/components/ui/tag-multi-select.tsx's shape, backed by
// provinces instead of tags — a zone can span one or many provinces (see
// internal/shippingzone in elc-go for the matching rules).
export function ProvinceMultiSelect({ value, onChange, placeholder }: ProvinceMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const { data: provinces = [] } = useQuery({
    queryKey: ["shipping-provinces"],
    queryFn: async () => {
      const { data, error } = await getProvincesAction();
      if (error) throw new Error(error);
      return data;
    },
  });

  const selected = provinces.filter((p) => value.includes(p.code));

  function toggle(code: string) {
    if (value.includes(code)) {
      onChange(value.filter((v) => v !== code));
    } else {
      onChange([...value, code]);
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {placeholder || "Chọn tỉnh/thành..."}
            <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm tỉnh/thành..." />
            <CommandList className="max-h-96">
              <CommandEmpty>Không tìm thấy tỉnh/thành nào.</CommandEmpty>
              <CommandGroup>
                {provinces.map((province) => (
                  <CommandItem key={province.code} value={province.name} onSelect={() => toggle(province.code)}>
                    <Check
                      className={cn("mr-2 h-4 w-4", value.includes(province.code) ? "opacity-100" : "opacity-0")}
                    />
                    {province.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((province) => (
            <Badge key={province.code} variant="secondary" className="gap-1">
              {province.name}
              <button
                type="button"
                onClick={() => toggle(province.code)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
