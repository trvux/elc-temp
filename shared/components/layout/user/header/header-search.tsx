"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";

import {
  ArrowRight,
  Article,
  Briefcase,
  CircleDashed,
  MagnifyingGlass,
  Spinner,
  Wrench,
} from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  getAutocompleteSuggestionsAction,
  getDefaultSearchItemsAction,
  type DefaultSearchItem,
  type SearchSuggestionItem,
} from "./search-actions";

const PAGES = [
  { title: "Trang chủ", href: "/" },
  { title: "Dự án", href: "/du-an" },
  { title: "Sản phẩm", href: "/san-pham" },
  { title: "Dịch vụ", href: "/dich-vu" },
  { title: "Tin tức", href: "/tin-tuc" },
  { title: "Giới thiệu", href: "/thong-tin" },
];

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultItems, setDefaultItems] = useState<{
    productCategories: DefaultSearchItem[];
    projectTypes: DefaultSearchItem[];
    services: DefaultSearchItem[];
    news: DefaultSearchItem[];
  }>({
    productCategories: [],
    projectTypes: [],
    services: [],
    news: [],
  });
  const [, startTransition] = useTransition();

  // Keyboard shortcut listener (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch default search categories/items on load
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const res = await getDefaultSearchItemsAction();
        setDefaultItems(res);
      } catch (err) {
        console.error("Failed to load default items:", err);
      }
    };
    loadDefaults();
  }, []);

  // Debounced search autocomplete
  useEffect(() => {
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await getAutocompleteSuggestionsAction(inputValue);
        setSuggestions(results);
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSelect = (
    type: "product" | "project" | "service",
    slug: string,
  ) => {
    let link = "";
    if (type === "product") link = `/san-pham/${slug}`;
    else if (type === "project") link = `/du-an/${slug}`;
    else if (type === "service") link = `/dich-vu/${slug}`;

    setOpen(false);
    setInputValue("");
    startTransition(() => {
      router.push(link);
    });
  };

  const handleSelectDefault = (
    type: "product_category" | "project_type" | "service_item" | "news_item",
    slug: string,
  ) => {
    let link = "";
    if (type === "product_category") link = `/san-pham/${slug}`;
    else if (type === "project_type") link = `/du-an/${slug}`;
    else if (type === "service_item") link = `/dich-vu/${slug}`;
    else if (type === "news_item") link = `/tin-tuc/${slug}`;

    setOpen(false);
    setInputValue("");
    startTransition(() => {
      router.push(link);
    });
  };

  const handleSelectPage = (href: string) => {
    setOpen(false);
    setInputValue("");
    startTransition(() => {
      router.push(href);
    });
  };

  const getIcon = (type: "product" | "project" | "service") => {
    switch (type) {
      case "product":
        return <Article className="size-4 text-primary" />;
      case "project":
        return <Briefcase className="size-4" />;
      case "service":
        return <Wrench className="size-4" />;
    }
  };

  const getTypeLabel = (type: "product" | "project" | "service") => {
    switch (type) {
      case "product":
        return "Sản phẩm";
      case "project":
        return "Dự án";
      case "service":
        return "Dịch vụ";
    }
  };

  const products = suggestions.filter((item) => item.type === "product");
  const projects = suggestions.filter((item) => item.type === "project");
  const services = suggestions.filter((item) => item.type === "service");

  // If user is on a product category/brand page, extract the category base path
  // so we can offer "search within this category" as a primary option.
  // e.g. /san-pham/may-lanh-treo-tuong/ftkb25zmvv → /san-pham/may-lanh-treo-tuong
  const productContextPath = pathname.startsWith("/san-pham/")
    ? `/${pathname.split("/").slice(1, 3).join("/")}`
    : null;

  return (
    <>
      <style>{`
        body:has(.header-search-dialog) [data-slot="dialog-overlay"] {
          display: none !important;
        }
        [data-slot="dialog-portal"] [data-slot="dialog-content"].header-search-dialog,
        body [data-slot="dialog-content"].header-search-dialog {
          top: 10% !important;
          transform: translateX(-50%) !important;
          translate: 0 0 !important;
        }
      `}</style>

      {/* Trigger Button - Compact secondary button with search icon */}
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="relative h-9 w-full justify-start cursor-pointer text-muted-foreground/70 hover:text-muted-foreground/90 transition-colors"
      >
        <span className="text-sm text-foreground font-medium">Tìm kiếm...</span>
      </Button>

      {/* Command Palette Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="header-search-dialog border-4 border-border"
      >
        <Command shouldFilter={false} className="outline-none">
          <div className="flex items-center px-3">
            <div className="flex-1">
              <CommandInput
                placeholder="Tìm sản phẩm, dự án, dịch vụ..."
                value={inputValue}
                onValueChange={setInputValue}
              />
            </div>
            {isLoading && (
              <Spinner className="size-4 animate-spin text-muted-foreground shrink-0 ml-2" />
            )}
          </div>
          <CommandList className="p-2">
            {inputValue.trim().length < 2 ? (
              <>
                {/* Pages Group */}
                <CommandGroup heading="Trang">
                  {PAGES.map((page) => (
                    <CommandItem
                      key={page.href}
                      value={page.title}
                      onSelect={() => handleSelectPage(page.href)}
                      className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                    >
                      <ArrowRight className="size-4 text-muted-foreground/70 shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {page.title}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Default Product Categories */}
                {defaultItems.productCategories.length > 0 && (
                  <CommandGroup heading="Sản phẩm (Danh mục)">
                    {defaultItems.productCategories.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() =>
                          handleSelectDefault(item.type, item.slug)
                        }
                        className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                      >
                        <CircleDashed className="size-4 text-muted-foreground/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </h4>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Default Project Types */}
                {defaultItems.projectTypes.length > 0 && (
                  <CommandGroup heading="Dự án (Loại công trình)">
                    {defaultItems.projectTypes.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() =>
                          handleSelectDefault(item.type, item.slug)
                        }
                        className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                      >
                        <CircleDashed className="size-4 text-muted-foreground/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </h4>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Default Services */}
                {defaultItems.services.length > 0 && (
                  <CommandGroup heading="Dịch vụ (Nhóm dịch vụ)">
                    {defaultItems.services.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() =>
                          handleSelectDefault(item.type, item.slug)
                        }
                        className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                      >
                        <CircleDashed className="size-4 text-muted-foreground/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </h4>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Default News */}
                {defaultItems.news.length > 0 && (
                  <CommandGroup heading="Tin tức & Sự kiện">
                    {defaultItems.news.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() =>
                          handleSelectDefault(item.type, item.slug)
                        }
                        className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                      >
                        <CircleDashed className="size-4 text-muted-foreground/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </h4>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              <>
                {/* Global Search Options */}
                <CommandGroup heading="Tìm kiếm">
                  {/* Context-aware: when inside a product category, search within it first */}
                  {productContextPath && (
                    <CommandItem
                      value={`tìm sản phẩm trong danh mục ${inputValue}`}
                      onSelect={() => {
                        setOpen(false);
                        const params = new URLSearchParams();
                        params.set("search", inputValue.trim());
                        startTransition(() => {
                          router.push(`${productContextPath}?${params.toString()}`);
                        });
                      }}
                      className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/40 rounded-md transition-colors"
                    >
                      <MagnifyingGlass className="size-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          Tìm{" "}
                          <span className="font-semibold text-primary">
                            "{inputValue}"
                          </span>{" "}
                          trong danh mục này
                        </span>
                      </div>
                    </CommandItem>
                  )}
                  <CommandItem
                    value={`tìm sản phẩm ${inputValue}`}
                    onSelect={() => {
                      setOpen(false);
                      const params = new URLSearchParams();
                      params.set("search", inputValue.trim());
                      startTransition(() => {
                        router.push(`/san-pham?${params.toString()}`);
                      });
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/40 rounded-md transition-colors"
                  >
                    <MagnifyingGlass className={`size-4 shrink-0 ${productContextPath ? "text-muted-foreground" : "text-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        Tìm{" "}
                        <span className={`font-semibold ${productContextPath ? "text-muted-foreground" : "text-primary"}`}>
                          "{inputValue}"
                        </span>{" "}
                        trong tất cả Sản phẩm
                      </span>
                    </div>
                  </CommandItem>
                  <CommandItem
                    value={`tìm dự án ${inputValue}`}
                    onSelect={() => {
                      setOpen(false);
                      const params = new URLSearchParams();
                      params.set("search", inputValue.trim());
                      router.push(`/du-an?${params.toString()}`);
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/40 rounded-md transition-colors"
                  >
                    <MagnifyingGlass className="size-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        Tìm{" "}
                        <span className="font-semibold">"{inputValue}"</span>{" "}
                        trong Dự án
                      </span>
                    </div>
                  </CommandItem>
                  <CommandItem
                    value={`tìm dịch vụ ${inputValue}`}
                    onSelect={() => {
                      setOpen(false);
                      const params = new URLSearchParams();
                      params.set("search", inputValue.trim());
                      router.push(`/dich-vu?${params.toString()}`);
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/40 rounded-md transition-colors"
                  >
                    <MagnifyingGlass className="size-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        Tìm{" "}
                        <span className="font-semibold">"{inputValue}"</span>{" "}
                        trong Dịch vụ
                      </span>
                    </div>
                  </CommandItem>
                  <CommandItem
                    value={`tìm tin tức ${inputValue}`}
                    onSelect={() => {
                      setOpen(false);
                      const params = new URLSearchParams();
                      params.set("search", inputValue.trim());
                      router.push(`/tin-tuc?${params.toString()}`);
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/40 rounded-md transition-colors"
                  >
                    <MagnifyingGlass className="size-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        Tìm{" "}
                        <span className="font-semibold">"{inputValue}"</span>{" "}
                        trong Tin tức
                      </span>
                    </div>
                  </CommandItem>
                </CommandGroup>

                {suggestions.length === 0 && !isLoading && (
                  <CommandEmpty>Không tìm thấy kết quả nào.</CommandEmpty>
                )}

                {/* Product Suggestions */}
                {products.length > 0 && (
                  <CommandGroup heading="Sản phẩm">
                    {products.map((item) => (
                      <CommandItem
                        key={`${item.type}-${item.id}`}
                        value={item.title}
                        onSelect={() => handleSelect(item.type, item.slug)}
                        className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                      >
                        {item.image ? (
                          <div className="relative size-8 rounded border overflow-hidden bg-white shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="32px"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="size-8 rounded border bg-muted/40 flex items-center justify-center shrink-0">
                            {getIcon(item.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground line-clamp-2 mt-0.5">
                            {item.title}
                          </h4>
                          {item.sku && (
                            <span className="text-xs text-muted-foreground font-medium block mt-0.5">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>
                        {item.price && (
                          <span className="text-xs font-semibold text-primary shrink-0">
                            {item.price}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Project Suggestions */}
                {projects.length > 0 && (
                  <CommandGroup heading="Dự án">
                    {projects.map((item) => (
                      <CommandItem
                        key={`${item.type}-${item.id}`}
                        value={item.title}
                        onSelect={() => handleSelect(item.type, item.slug)}
                        className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                      >
                        {item.image ? (
                          <div className="relative size-8 rounded border overflow-hidden bg-white shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="32px"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="size-8 rounded border bg-muted/40 flex items-center justify-center shrink-0">
                            {getIcon(item.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground line-clamp-2 mt-0.5">
                            {item.title}
                          </h4>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Service Suggestions */}
                {services.length > 0 && (
                  <CommandGroup heading="Dịch vụ">
                    {services.map((item) => (
                      <CommandItem
                        key={`${item.type}-${item.id}`}
                        value={item.title}
                        onSelect={() => handleSelect(item.type, item.slug)}
                        className="flex items-center gap-3 p-2 cursor-pointer data-selected:bg-transparent hover:bg-muted/40 rounded-md transition-colors"
                      >
                        {item.image ? (
                          <div className="relative size-8 rounded border overflow-hidden bg-white shrink-0">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="32px"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="size-8 rounded border bg-muted/40 flex items-center justify-center shrink-0">
                            {getIcon(item.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground line-clamp-2 mt-0.5">
                            {item.title}
                          </h4>
                        </div>
                        {item.price && (
                          <span className="text-xs font-semibold text-primary shrink-0">
                            {item.price}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
