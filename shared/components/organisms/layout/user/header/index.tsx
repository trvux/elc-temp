"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  CaretLeftIcon,
  CaretRightIcon,
  ListIcon,
  XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState, type CSSProperties } from "react";

import {
  buildNavGroups,
  type BrandNavRef,
  type NamedSlugRef,
  type ServiceNavRef,
} from "@/modules/settings/domain/navigation";
import type { CategoryRef, GroupCategoryRef } from "@/shared/lib/group-categories";
import { cn } from "@/shared/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./nav-menu-primitives";

interface HeaderProps {
  groupCategories?: GroupCategoryRef[];
  categoriesList?: CategoryRef[];
  brands?: BrandNavRef[];
  services?: ServiceNavRef[];
  projectTypes?: NamedSlugRef[];
}

// 1:1 port of elc-v2/components/site-nav.tsx. Only the data differs: groups
// come from buildNavGroups (real categories/brands/services/project types),
// links are next/link. Rendered dark like the v2 apple page; no hotline/search icon.
const navItem =
  "h-11 rounded-none px-2 text-xs leading-none font-normal tracking-[-0.01em] text-foreground/80 hover:bg-transparent hover:text-foreground focus:bg-transparent data-popup-open:bg-transparent data-popup-open:text-foreground data-popup-open:hover:bg-transparent data-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent";
const ease = "ease-[cubic-bezier(0.4,0,0.6,1)]";

export function Header({
  groupCategories = [],
  categoriesList = [],
  brands = [],
  services = [],
  projectTypes = [],
}: HeaderProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [openValue, setOpenValue] = useState<unknown>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // mobile drill-down: which group's sub-menu is showing (null = top level)
  const [view, setView] = useState<string | null>(null);
  // which side the incoming items come from: opening menu = top, drill in = right, back = left
  const [from, setFrom] = useState<"top" | "right" | "left">("top");

  const groups = useMemo(
    () => buildNavGroups({ groupCategories, categoriesList, brands, services, projectTypes }),
    [groupCategories, categoriesList, brands, services, projectTypes],
  );

  const current = groups.find((g) => g.label === view);
  const enter = {
    top: "slide-in-from-top-2",
    right: "slide-in-from-right-2",
    left: "slide-in-from-left-2",
  }[from];
  const baseDelay = from === "top" ? 200 : 160;

  const closeSheet = () => {
    setSheetOpen(false);
    setView(null);
    setFrom("top");
  };

  // Close the sheet on route change — derived from a prop during render
  // (React's alternative to a setState-in-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    closeSheet();
  }

  return (
    <>
      {/* page behind the panel dims + blurs, like apple.com */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 z-140 backdrop-blur-[20px] transition-opacity delay-80 duration-320 motion-reduce:transition-none bg-black/40",
          ease,
          openValue ? "opacity-100" : "opacity-0",
        )}
      />

      <header
        ref={headerRef}
        className={cn(
          "dark sticky top-0 z-200 text-foreground backdrop-blur-xl backdrop-saturate-180 transition-colors delay-80 duration-270 motion-reduce:transition-none",
          ease,
          // closed: bar takes the page colour; open: bar + panel become ONE colour
          openValue ? "bg-[#161617]" : "bg-background",
        )}
      >
        <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-[22px] min-[834px]:h-11">
          {/* mobile logo; on desktop the logo lives inside the list below */}
          <Link
            href="/"
            className="-ml-1 grid h-full place-items-center min-[834px]:hidden"
            onClick={closeSheet}
          >
            <Image src="/logo/logo.svg" alt="Điện máy ELC" width={28} height={28} priority className="size-7" />
          </Link>

          <NavigationMenu
            anchor={headerRef}
            positionerClassName="dark"
            onValueChange={setOpenValue}
            className="hidden max-w-none min-[834px]:flex"
          >
            <NavigationMenuList className="gap-9">
              <li className="mr-2 grid h-11 place-items-center">
                <Link href="/">
                  <Image src="/logo/logo.svg" alt="Điện máy ELC" width={28} height={28} priority className="size-7" />
                </Link>
              </li>
              {groups.map((g) => (
                <NavigationMenuItem key={g.label}>
                  {g.columns ? (
                    <>
                      <NavigationMenuTrigger className={cn(navItem, "[&>svg]:hidden")}>{g.label}</NavigationMenuTrigger>
                      <NavigationMenuContent className="p-0 pr-0 data-ending-style:opacity-100 data-starting-style:opacity-100">
                        <div className="mx-auto flex max-w-[1024px] px-[22px] pt-10 pb-[84px]">
                          {g.columns.map((c, ci) => (
                            <div key={c.heading} className={c.big ? "max-w-md pr-22" : "pr-11"}>
                              <p className="text-xs leading-[1.3334] tracking-[-0.01em] text-muted-foreground">
                                {c.heading}
                              </p>
                              <ul className={c.big ? "mt-[7px]" : "mt-2.5"}>
                                {c.links.map((l, li) => (
                                  <li
                                    key={`${l.label}|${l.href}`}
                                    style={{ "--i": li, "--g": ci } as CSSProperties}
                                    className="flyout-item -mx-[11px]"
                                  >
                                    <NavigationMenuLink
                                      render={<Link href={l.href} />}
                                      className={cn(
                                        "-mb-1.5 flex w-fit rounded-none px-[11px] font-semibold text-foreground/90 transition-colors duration-320 hover:bg-transparent hover:text-foreground focus:bg-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:-outline-offset-7 focus-visible:outline-primary",
                                        ease,
                                        c.big
                                          ? "pt-[9px] pb-[7px] text-2xl leading-[1.1667] tracking-[0.009em]"
                                          : "pt-2 pb-[7px] text-xs leading-[1.3334] tracking-[-0.01em]",
                                      )}
                                    >
                                      {l.label}
                                    </NavigationMenuLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink
                      render={<Link href={g.href} />}
                      aria-current={pathname.startsWith(g.href) ? "page" : undefined}
                      className={cn(navItem, "items-center")}
                    >
                      {g.label}
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Mobile: full-height sheet from the top, links stagger in */}
          <Dialog.Root
            open={sheetOpen}
            onOpenChange={(o) => (o ? setSheetOpen(true) : closeSheet())}
          >
            <Dialog.Trigger
              aria-label="Menu"
              className="-mr-2 grid size-11 place-items-center rounded-full min-[834px]:hidden"
            >
              <ListIcon className="size-5" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-300 bg-black/80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
              <Dialog.Popup
                className={cn(
                  "dark fixed inset-x-0 top-0 z-300 flex h-dvh flex-col bg-[#161617] text-foreground outline-none transition duration-400 data-ending-style:-translate-y-8 data-ending-style:opacity-0 data-starting-style:-translate-y-8 data-starting-style:opacity-0 min-[834px]:hidden",
                  ease,
                )}
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="flex h-12 shrink-0 items-center justify-between px-4">
                  {current ? (
                    <button
                      type="button"
                      aria-label="Back"
                      onClick={() => {
                        setFrom("left");
                        setView(null);
                      }}
                      className="-ml-2 grid size-11 animate-in place-items-center rounded-full fade-in slide-in-from-left-1 fill-mode-both delay-150 duration-240 motion-reduce:animate-none"
                    >
                      <CaretLeftIcon className="size-5" />
                    </button>
                  ) : (
                    <span />
                  )}
                  <Dialog.Close
                    aria-label="Close menu"
                    className="-mr-2 grid size-11 place-items-center rounded-full"
                  >
                    <XIcon className="size-5" />
                  </Dialog.Close>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pb-12">
                  {current?.columns ? (
                    <div key={current.label} className="px-12">
                      {current.columns.map((c, ci) => (
                        <div key={c.heading} className={ci ? "mt-10" : ""}>
                          {ci > 0 && (
                            <p className="mb-3 text-[1.0625rem] leading-6 text-muted-foreground">{c.heading}</p>
                          )}
                          <ul>
                            {c.links.map((l, li) => (
                              <li
                                key={`${l.label}|${l.href}`}
                                style={{ animationDelay: `${baseDelay + (ci * 4 + li) * 20}ms` }}
                                className={cn(
                                  "animate-in fade-in fill-mode-both duration-240 motion-reduce:animate-none",
                                  ease,
                                  enter,
                                )}
                              >
                                <Link
                                  href={l.href}
                                  onClick={closeSheet}
                                  className={cn(
                                    "block font-semibold",
                                    c.big ? "py-[7.5px] text-[1.75rem] leading-8" : "py-1.5 text-[1.0625rem] leading-6",
                                  )}
                                >
                                  {l.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="px-12">
                      {groups.map((g, i) => (
                        <li
                          key={g.label}
                          style={{ animationDelay: `${baseDelay + i * 20}ms` }}
                          className={cn(
                            "animate-in fade-in fill-mode-both duration-240 motion-reduce:animate-none",
                            ease,
                            enter,
                          )}
                        >
                          {g.columns ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFrom("right");
                                setView(g.label);
                              }}
                              className="group flex w-full items-center justify-between py-[7.5px] text-left text-[1.75rem] leading-8 font-semibold"
                            >
                              {g.label}
                              <CaretRightIcon
                                aria-hidden="true"
                                className={cn(
                                  "size-5 -translate-x-1 text-muted-foreground opacity-0 transition duration-240 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100",
                                  ease,
                                )}
                              />
                            </button>
                          ) : (
                            <Link
                              href={g.href}
                              onClick={closeSheet}
                              className="block py-[7.5px] text-[1.75rem] leading-8 font-semibold"
                            >
                              {g.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
    </>
  );
}
