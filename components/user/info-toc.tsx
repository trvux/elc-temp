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

interface Page {
  id: string;
  title: string;
  slug: string;
}

interface InfoTOCProps {
  pages: Page[];
  currentSlug?: string;
  basePath?: string;
}

export function InfoTOC({ pages, currentSlug, basePath = "" }: InfoTOCProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleSelect = (slug: string) => {
    setOpen(false);
    const url = basePath ? `${basePath}/${slug}` : `/${slug}`;
    router.push(url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between text-zinc-500 hover:text-zinc-900 border-zinc-200"
        >
          {/* Sentence case instead of all caps as requested */}
          <span className="font-medium text-[14px]">Tìm kiếm thông tin</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 shadow-lg border-zinc-100">
        <Command>
          <CommandInput placeholder="Tìm kiếm trang..." />
          <CommandList>
            <CommandEmpty>Không có kết quả.</CommandEmpty>
            <CommandGroup>
              {pages.map((page) => (
                <CommandItem
                  key={page.id}
                  value={page.title}
                  onSelect={() => handleSelect(page.slug)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentSlug === page.slug ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {page.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
