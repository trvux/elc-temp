"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CaretUpDown, X } from "@phosphor-icons/react";

import { getWardsAction } from "../actions";
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
import { useManualScroll } from "@/shared/lib/use-manual-scroll";
import { cn } from "@/shared/lib/utils";

interface WardMultiSelectProps {
  provinceCodes: string[];
  value: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
}

// Mirrors ProvinceMultiSelect, but options narrow to only the wards
// (phường/xã) of whichever province(s) are currently selected in the same
// form — leaving a zone's WardCodes empty means "the whole selected
// province(s)", same as before, just no longer via free-text keywords.
export function WardMultiSelect({ provinceCodes, value, onChange, placeholder }: WardMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const scrollHandlers = useManualScroll();

  const { data: wards = [] } = useQuery({
    queryKey: ["shipping-wards", provinceCodes],
    queryFn: async () => {
      const results = await Promise.all(provinceCodes.map((code) => getWardsAction(code)));
      const error = results.find((r) => r.error)?.error;
      if (error) throw new Error(error);
      return results.flatMap((r) => r.data);
    },
    enabled: provinceCodes.length > 0,
  });

  const selected = wards.filter((w) => value.includes(w.code));

  function toggle(code: string) {
    if (value.includes(code)) {
      onChange(value.filter((v) => v !== code));
    } else {
      onChange([...value, code]);
    }
  }

  if (provinceCodes.length === 0) {
    return <p className="text-xs text-muted-foreground">Chọn tỉnh/thành trước để chọn phường/xã cụ thể.</p>;
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {placeholder || "Chọn phường/xã..."}
            <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm phường/xã..." />
            {/* Radix Dialog's scroll-lock blocks native scroll here (this
                combobox opens from inside AdminDialog forms) — plain div +
                manual scrollTop drive, same fix as LocationCombobox. */}
            <CommandList className="max-h-none overflow-visible p-0">
              <CommandEmpty className="px-2 py-3">Không tìm thấy phường/xã nào.</CommandEmpty>
              <div style={{ maxHeight: 288, overflowY: "auto" }} {...scrollHandlers}>
                <CommandGroup>
                  {wards.map((ward) => (
                    <CommandItem key={ward.code} value={ward.name} onSelect={() => toggle(ward.code)}>
                      <Check className={cn("mr-2 h-4 w-4", value.includes(ward.code) ? "opacity-100" : "opacity-0")} />
                      {ward.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((ward) => (
            <Badge key={ward.code} variant="secondary" className="gap-1">
              {ward.name}
              <button
                type="button"
                onClick={() => toggle(ward.code)}
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
