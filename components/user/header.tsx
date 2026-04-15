// "use client";

// import { Button } from "@/components/ui/button";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import {
//   NavigationMenu,
//   NavigationMenuItem,
//   NavigationMenuLink,
//   NavigationMenuList,
//   navigationMenuTriggerStyle,
// } from "@/components/ui/navigation-menu";
// import { cn } from "@/lib/utils";
// import { Menu, X } from "lucide-react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import * as React from "react";

// interface NavLink {
//   name: string;
//   href: string;
// }

// const navLinks: NavLink[] = [
//   { name: "Trang chủ", href: "/" },
//   { name: "Công trình", href: "/cong-trinh" },
//   { name: "Sản phẩm", href: "/san-pham" },
//   { name: "Chi nhánh", href: "/chi-nhanh" },
//   { name: "Thông tin", href: "/thong-tin" },
// ];

// export function Header() {
//   const [isMenuOpen, setIsMenuOpen] = React.useState(false);
//   const pathname = usePathname();

//   return (
//     // <div className="w-full sticky top-0 left-0 right-0 z-50 mb-4">
//     //   {/* Main Header Container */}
//     //   <header className="px-4 py-4 sm:px-6 lg:px-12">
//     //     <div className="max-w-7xl mx-auto">
//     //       <Collapsible
//     //         open={isMenuOpen}
//     //         onOpenChange={setIsMenuOpen}
//     //         className={cn(
//     //           "relative flex flex-col bg-cream/90 backdrop-blur-xl rounded-2xl border border-border transition-all duration-500 shadow-md",
//     //           isMenuOpen && "rounded-2xl",
//     //         )}
//     //       >
//     //         {/* Top Bar */}
//     //         <div className="flex items-center justify-between px-6 py-3">
//     //           {/* Logo */}
//     //           <Link href="/" className="flex items-center gap-2 group shrink-0">
//     //             <span className="text-2xl font-bold tracking-tight text-black">
//     //               ELC
//     //             </span>
//     //           </Link>

//     //           {/* Desktop Navigation */}
//     //           <NavigationMenu className="hidden lg:flex px-8">
//     //             <NavigationMenuList className="gap-2">
//     //               {navLinks.map((link) => {
//     //                 const isActive =
//     //                   link.href === "/"
//     //                     ? pathname === "/"
//     //                     : pathname.startsWith(link.href);
//     //                 return (
//     //                   <NavigationMenuItem key={link.name}>
//     //                     <NavigationMenuLink
//     //                       asChild
//     //                       className={cn(
//     //                         navigationMenuTriggerStyle(),
//     //                         "bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent text-sm transition-colors h-9 px-4 hover:text-black hover:underline underline-offset-4",
//     //                         isActive
//     //                           ? "font-semibold text-black"
//     //                           : "font-medium text-black/80",
//     //                       )}
//     //                     >
//     //                       <Link href={link.href}>{link.name}</Link>
//     //                     </NavigationMenuLink>
//     //                   </NavigationMenuItem>
//     //                 );
//     //               })}
//     //             </NavigationMenuList>
//     //           </NavigationMenu>

//     //           {/* Desktop Actions */}
//     //           <div className="hidden lg:flex items-center gap-3">
//     //             <div className="h-6 w-px bg-border mr-2 opacity-50" />
//     //             <Button
//     //               asChild
//     //               className={cn(
//     //                 "rounded-xl border-border px-5 h-10 text-sm font-semibold",
//     //                 pathname === "/cong-trinh" && "border-2 border-black",
//     //               )}
//     //             >
//     //               <Link href="/cong-trinh">Khám phá</Link>
//     //             </Button>
//     //           </div>

//     //           {/* Mobile Toggle */}
//     //           <div className="flex lg:hidden items-center">
//     //             <CollapsibleTrigger asChild>
//     //               <Button
//     //                 variant="ghost"
//     //                 size="icon"
//     //                 aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
//     //                 className="p-1 rounded-lg text-black relative w-10 h-10 overflow-hidden"
//     //               >
//     //                 <div className="relative w-6 h-6 flex items-center justify-center">
//     //                   <Menu
//     //                     className={cn(
//     //                       "absolute transition-all duration-500 ease-in-out",
//     //                       isMenuOpen
//     //                         ? "opacity-0 rotate-90 scale-50"
//     //                         : "opacity-100 rotate-0 scale-100",
//     //                     )}
//     //                     size={20}
//     //                   />
//     //                   <X
//     //                     className={cn(
//     //                       "absolute transition-all duration-500 ease-in-out",
//     //                       isMenuOpen
//     //                         ? "opacity-100 rotate-0 scale-100"
//     //                         : "opacity-0 -rotate-90 scale-50",
//     //                     )}
//     //                     size={20}
//     //                   />
//     //                 </div>
//     //               </Button>
//     //             </CollapsibleTrigger>
//     //           </div>
//     //         </div>

//     //         {/* Mobile Menu Content */}
//     //         <CollapsibleContent className="CollapsibleContent overflow-hidden transition-all duration-500 ease-in-out">
//     //           <div className="flex flex-col px-6 py-2 border-t border-border">
//     //             {navLinks.map((link) => {
//     //               const isActive =
//     //                 link.href === "/"
//     //                   ? pathname === "/"
//     //                   : pathname.startsWith(link.href);
//     //               return (
//     //                 <Link
//     //                   key={link.name}
//     //                   href={link.href}
//     //                   onClick={() => setIsMenuOpen(false)}
//     //                   className={cn(
//     //                     "flex items-center justify-between py-4 text-base transition-colors border-b border-border/50 last:border-b-0 hover:bg-transparent hover:underline underline-offset-4",
//     //                     isActive
//     //                       ? "font-bold text-black"
//     //                       : "font-semibold text-black/80",
//     //                   )}
//     //                 >
//     //                   {link.name}
//     //                 </Link>
//     //               );
//     //             })}
//     //             <div className="py-4 last:border-b-0">
//     //               <Link
//     //                 href="/cong-trinh"
//     //                 onClick={() => setIsMenuOpen(false)}
//     //                 className={cn(
//     //                   "text-base transition-colors lg:bg-primary lg:text-foreground-primary underline-offset-4",
//     //                   pathname === "/cong-trinh"
//     //                     ? "font-bold text-black"
//     //                     : "font-semibold text-black/80",
//     //                 )}
//     //               >
//     //                 Xem công trình
//     //               </Link>
//     //             </div>
//     //           </div>
//     //         </CollapsibleContent>
//     //       </Collapsible>
//     //     </div>
//     //   </header>
//     // </div>
//     <div className="">
//       {/* Main Header Container */}
//       <header className="">
//         <div className="">
//           <Collapsible
//             open={isMenuOpen}
//             onOpenChange={setIsMenuOpen}
//             className={cn("", isMenuOpen && "")}
//           >
//             {/* Top Bar */}
//             <div className="">
//               {/* Logo */}
//               <Link href="/" className="">
//                 <span className="">ELC</span>
//               </Link>

//               {/* Desktop Navigation */}
//               <NavigationMenu className="">
//                 <NavigationMenuList className="">
//                   {navLinks.map((link) => {
//                     const isActive =
//                       link.href === "/"
//                         ? pathname === "/"
//                         : pathname.startsWith(link.href);
//                     return (
//                       <NavigationMenuItem key={link.name}>
//                         <NavigationMenuLink
//                           asChild
//                           className={cn(
//                             navigationMenuTriggerStyle(),
//                             "",
//                             isActive ? "" : "",
//                           )}
//                         >
//                           <Link href={link.href}>{link.name}</Link>
//                         </NavigationMenuLink>
//                       </NavigationMenuItem>
//                     );
//                   })}
//                 </NavigationMenuList>
//               </NavigationMenu>

//               {/* Desktop Actions */}
//               <div className="">
//                 <div className="" />
//                 <Button
//                   asChild
//                   className={cn("", pathname === "/cong-trinh" && "")}
//                 >
//                   <Link href="/cong-trinh">Khám phá</Link>
//                 </Button>
//               </div>

//               {/* Mobile Toggle */}
//               <div className="flex lg:hidden items-center">
//                 <CollapsibleTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
//                     className=""
//                   >
//                     <div className="">
//                       <Menu
//                         className={cn("", isMenuOpen ? "" : "")}
//                         size={20}
//                       />
//                       <X className={cn("", isMenuOpen ? "" : "")} size={20} />
//                     </div>
//                   </Button>
//                 </CollapsibleTrigger>
//               </div>
//             </div>

//             {/* Mobile Menu Content */}
//             <CollapsibleContent className="">
//               <div className="">
//                 {navLinks.map((link) => {
//                   const isActive =
//                     link.href === "/"
//                       ? pathname === "/"
//                       : pathname.startsWith(link.href);
//                   return (
//                     <Link
//                       key={link.name}
//                       href={link.href}
//                       onClick={() => setIsMenuOpen(false)}
//                       className={cn("", isActive ? "" : "")}
//                     >
//                       {link.name}
//                     </Link>
//                   );
//                 })}
//                 <div className="">
//                   <Link
//                     href="/cong-trinh"
//                     onClick={() => setIsMenuOpen(false)}
//                     className={cn("", pathname === "/cong-trinh" ? "" : "")}
//                   >
//                     Xem công trình
//                   </Link>
//                 </div>
//               </div>
//             </CollapsibleContent>
//           </Collapsible>
//         </div>
//       </header>
//     </div>
//   );
// }

"use client";

import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Trang chủ", href: "/" },
  { name: "Công trình", href: "/cong-trinh" },
  { name: "Sản phẩm", href: "/san-pham" },
  { name: "Chi nhánh", href: "/chi-nhanh" },
  { name: "Thông tin", href: "/thong-tin" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const checkActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // --- CONSTANT CLASSES ---
  const wrapperClass = cn(
    "sticky top-0 z-50 w-full transition-all duration-300",
    isScrolled || isMenuOpen ? "bg-cream backdrop-blur-md" : "bg-transparent",
    isScrolled && !isMenuOpen && "border-b border-border",
  );

  const containerClass = "w-full max-w-[1440px] mx-auto relative";
  const topBarClass = "flex h-16 items-center justify-between px-6";
  const logoClass = "flex items-center font-bold text-xl tracking-tighter";

  const desktopNavClass = "hidden lg:flex";
  const desktopActionClass = "hidden lg:flex items-center gap-4";

  const mobileToggleClass = "flex lg:hidden items-center";
  const iconBoxClass = "relative flex h-5 w-5 items-center justify-center";

  // Sửa lỗi lệch màu: dính chặt vào header bằng top-[calc(100%-1px)]
  const mobileMenuContentClass = cn(
    "absolute top-[calc(100%-1px)] left-0 w-full bg-cream lg:hidden border-b border-border rounded-2xl shadow-xl",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-300",
  );

  const mobileNavWrapperClass = "flex flex-col px-6 py-6";
  const overlayClass =
    "fixed inset-0 top-16 bg-black/10 backdrop-blur-[2px] lg:hidden transition-all duration-500";

  // Reusable Link Style
  const getLinkClass = (href: string, isMobile = false) =>
    cn(
      "transition-all duration-300",
      isMobile
        ? "text-xl font-medium tracking-tight"
        : "bg-transparent hover:bg-transparent",
      checkActive(href)
        ? "text-primary font-semibold"
        : "text-muted-foreground",
    );

  return (
    <div className={wrapperClass}>
      {/* Backdrop Overlay khi mở Menu */}
      {isMenuOpen && (
        <div className={overlayClass} onClick={() => setIsMenuOpen(false)} />
      )}

      <header className={containerClass}>
        <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <div className={topBarClass}>
            {/* Logo */}
            <Link href="/" className={logoClass}>
              ELC
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className={desktopNavClass}>
              <NavigationMenuList className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.name}>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        navigationMenuTriggerStyle(),
                        // Triệt tiêu focus background mặc định của Shadcn
                        "focus:bg-transparent focus:text-accent-foreground",
                        "data-active:bg-transparent data-[state=open]:bg-transparent",
                        // Giữ lại logic của mày
                        "bg-transparent hover:bg-transparent hover:underline hover:underline-offset-4 hover:decoration-2",
                        checkActive(link.href) && "text-primary font-semibold",
                      )}
                    >
                      <Link href={link.href}>{link.name}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Desktop Actions */}
            <div className={desktopActionClass}>
              <Button asChild variant="default">
                <Link href="/cong-trinh">Khám phá</Link>
              </Button>
            </div>

            {/* Mobile Toggle */}
            <div className={mobileToggleClass}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent data-[state=open]:bg-transparent"
                >
                  <div className={iconBoxClass}>
                    <Menu
                      className={cn(
                        "absolute transition-all duration-300",
                        isMenuOpen
                          ? "scale-0 opacity-0"
                          : "scale-100 opacity-100",
                      )}
                    />
                    <X
                      className={cn(
                        " absolute transition-all duration-300",
                        isMenuOpen
                          ? " scale-100 opacity-100"
                          : " scale-0 opacity-0",
                      )}
                    />
                  </div>
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Mobile Menu Content */}
          <CollapsibleContent className={mobileMenuContentClass}>
            <nav className={mobileNavWrapperClass}>
              {navLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "py-3 text-lg transition-colors", // Dùng py-3 để tạo khoảng trống quanh link
                      checkActive(link.href)
                        ? "text-primary font-bold"
                        : "text-muted-foreground",
                    )}
                  >
                    {link.name}
                  </Link>
                  {/* Thêm separator giữa các link, trừ link cuối cùng */}
                  {index < navLinks.length - 1 && <Separator />}
                </React.Fragment>
              ))}
              <Button asChild className="w-full">
                <Link href="/cong-trinh" onClick={() => setIsMenuOpen(false)}>
                  Xem công trình
                </Link>
              </Button>
            </nav>
          </CollapsibleContent>
        </Collapsible>
      </header>
    </div>
  );
}
