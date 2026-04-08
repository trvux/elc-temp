"use client";

import Link from "next/link";
import { Globe, MessageSquare, Building2 } from "lucide-react";
import { PhoneConfirmation } from "./phone-confirmation";

interface FooterProps {
  branches?: any[];
  projects?: any[];
  pages?: any[];
  settings?: Record<string, string>;
}

export function Footer({ branches, projects, pages, settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const phone = settings?.company_phone || "0909 411 633";
  const email = settings?.company_email || "contact@elc.com";
  const address = settings?.company_address || "06 Phan Chu Trinh St, Q7, HCM";

  return (
    <footer className="w-full bg-primary text-primary-foreground/60 py-16 px-container border-t border-border/10 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Brand Logo - Even more minimalist */}
        <div className="mb-14">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <span className="text-fluid-h3 font-black tracking-tighter text-primary-foreground capitalize italic">
              ELC
            </span>
          </Link>
        </div>

        {/* The Grid - Anthropic exact structure */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-12 gap-x-8">
          {/* Column 1: Projects */}
          <div className="space-y-6">
            <h4 className="text-xs text-primary-foreground font-bold capitalize tracking-[0.2em] opacity-90">
              Projects
            </h4>
            <nav className="flex flex-col gap-3 text-xs">
              {projects?.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href="/cong-trinh"
                  className="hover:text-primary-foreground transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 2: Branches */}
          <div className="space-y-6">
            <h4 className="text-xs text-primary-foreground font-bold capitalize tracking-[0.2em] opacity-90">
              Branches
            </h4>
            <nav className="flex flex-col gap-3 text-xs">
              {branches?.map((item) => (
                <Link
                  key={item.slug}
                  href={`/chi-nhanh/${item.slug}`}
                  className="hover:text-primary-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Intelligence */}
          <div className="space-y-6">
            <h4 className="text-xs text-primary-foreground font-bold capitalize tracking-[0.2em] opacity-90">
              Thông tin
            </h4>
            <nav className="flex flex-col gap-3 text-xs">
              {pages?.slice(0, 6).map((item) => (
                <Link
                  key={item.slug}
                  href={`/thong-tin?slug=${item.slug}`}
                  className="hover:text-primary-foreground transition-colors capitalize"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4: Help */}
          <div className="space-y-6">
            <h4 className="text-xs text-primary-foreground font-bold capitalize tracking-[0.2em] opacity-90">
              Hỗ trợ khách hàng
            </h4>
            <nav className="flex flex-col gap-3 text-xs">
              <PhoneConfirmation phone={phone.replace(/\s/g, "")}>
                <button className="hover:text-primary-foreground transition-colors text-left">
                  Trung tâm tổng đài
                </button>
              </PhoneConfirmation>
              <Link
                href="/thong-tin?slug=status"
                className="hover:text-primary-foreground transition-colors"
              >
                Tình trạng đơn hàng
              </Link>
              <Link
                href="/thong-tin?slug=baohanh"
                className="hover:text-primary-foreground transition-colors"
              >
                Tra cứu bảo hành
              </Link>
            </nav>
          </div>

          {/* Column 5: Connect */}
          <div className="space-y-6">
            <h4 className="text-xs text-primary-foreground font-bold capitalize tracking-[0.2em] opacity-90">
              Liên hệ ELC
            </h4>
            <nav className="flex flex-col gap-3 text-xs">
              <span className="cursor-default">{phone}</span>
              <Link
                href={`mailto:${email}`}
                className="hover:text-primary-foreground transition-colors truncate"
              >
                {email}
              </Link>
              <span className="cursor-default leading-relaxed">{address}</span>
            </nav>
          </div>

          {/* Column 6: Company & Policies */}
          <div className="space-y-6">
            <h4 className="text-xs text-primary-foreground font-bold capitalize tracking-[0.2em] opacity-90">
              Pháp lý & Quy định
            </h4>
            <nav className="flex flex-col gap-3 text-xs">
              <Link
                href="/thong-tin?slug=privacy"
                className="hover:text-primary-foreground transition-colors"
              >
                Chính sách bảo mật
              </Link>
              <Link
                href="/thong-tin?slug=terms"
                className="hover:text-primary-foreground transition-colors"
              >
                Điều khoản dịch vụ
              </Link>
              <Link
                href="/thong-tin?slug=legal"
                className="hover:text-primary-foreground transition-colors"
              >
                Thông báo pháp lý
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar - Social icons only */}
        <div className="mt-20 pt-8 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-4 text-xs">
            <p className="font-bold tracking-tight">
              © {currentYear} ELC Intelligence PBC
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="#"
                className="hover:text-primary-foreground transition-all opacity-60 hover:opacity-100"
              >
                <Globe size={18} strokeWidth={1.5} />
              </Link>
              <Link
                href="#"
                className="hover:text-primary-foreground transition-all opacity-60 hover:opacity-100"
              >
                <MessageSquare size={18} strokeWidth={1.5} />
              </Link>
              <Link
                href="#"
                className="hover:text-primary-foreground transition-all opacity-60 hover:opacity-100"
              >
                <Building2 size={18} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
