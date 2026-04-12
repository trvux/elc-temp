"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Branch {
  id: string;
  name: string;
  slug: string;
}

interface BranchTOCProps {
  branches: Branch[];
  currentSlug?: string;
  className?: string; // Add this
}

export function BranchTOC({
  branches,
  currentSlug,
  className, // Add this
}: BranchTOCProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleSelect = (slug: string) => {
    setOpen(false);
    router.push(`/chi-nhanh/${slug}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-56 justify-between text-muted-foreground hover:text-foreground border-border",
            className
          )}
        >
          <span className="font-medium text-sm">Tìm kiếm chi nhánh</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 shadow-lg border-border">
        <Command>
          <CommandInput placeholder="Nhập tên chi nhánh..." />
          <CommandList>
            <CommandEmpty>Không có chi nhánh này.</CommandEmpty>
            <CommandGroup>
              {branches.map((branch) => (
                <CommandItem
                  key={branch.id}
                  value={branch.name}
                  onSelect={() => handleSelect(branch.slug)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentSlug === branch.slug ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {branch.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
