"use client";

import Link from "next/link";
import {
  Globe,
  MessageSquare,
  Building2,
} from "lucide-react";
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
    <footer className="w-full bg-[#0a0a0a] text-zinc-500 py-16 px-container border-t border-white/5 font-sans">
      <div className="mx-auto max-w-7xl">
        
        {/* Brand Logo - Even more minimalist */}
        <div className="mb-14">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <span className="text-3xl font-bold tracking-tighter text-white uppercase italic">
              ELC
            </span>
          </Link>
        </div>

        {/* The Grid - Anthropic exact structure */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-12 gap-x-8">
          
          {/* Column 1: Projects */}
          <div className="space-y-5">
            <h4 className="text-[14px] text-white font-medium">Projects</h4>
            <nav className="flex flex-col gap-3 text-[13px]">
              {projects?.slice(0, 8).map((item) => (
                <Link key={item.id} href="/cong-trinh" className="hover:text-white transition-colors">
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 2: Branches */}
          <div className="space-y-5">
            <h4 className="text-[14px] text-white font-medium">Branches</h4>
            <nav className="flex flex-col gap-3 text-[13px]">
              {branches?.map((item) => (
                <Link key={item.slug} href={`/chi-nhanh/${item.slug}`} className="hover:text-white transition-colors">
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Intelligence */}
          <div className="space-y-5">
            <h4 className="text-[14px] text-white font-medium">Thông tin</h4>
            <nav className="flex flex-col gap-3 text-[13px]">
              {pages?.slice(0, 6).map((item) => (
                <Link key={item.slug} href={`/thong-tin?slug=${item.slug}`} className="hover:text-white transition-colors capitalize">
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4: Help */}
          <div className="space-y-5">
            <h4 className="text-[14px] text-white font-medium">Hỗ trợ khách hàng</h4>
            <nav className="flex flex-col gap-3 text-[13px]">
              <PhoneConfirmation phone={phone.replace(/\s/g, '')}>
                <button className="hover:text-white transition-colors text-left">Trung tâm tổng đài</button>
              </PhoneConfirmation>
              <Link href="/thong-tin?slug=status" className="hover:text-white transition-colors">Tình trạng đơn hàng</Link>
              <Link href="/thong-tin?slug=baohanh" className="hover:text-white transition-colors">Tra cứu bảo hành</Link>
            </nav>
          </div>

          {/* Column 5: Connect */}
          <div className="space-y-5">
            <h4 className="text-[14px] text-white font-medium">Liên hệ ELC</h4>
            <nav className="flex flex-col gap-3 text-[13px]">
              <span className="cursor-default">{phone}</span>
              <a href={`mailto:${email}`} className="hover:text-white transition-colors truncate">{email}</a>
              <span className="cursor-default leading-relaxed">{address}</span>
            </nav>
          </div>

          {/* Column 6: Company & Policies */}
          <div className="space-y-5">
            <h4 className="text-[14px] text-white font-medium">Pháp lý & Quy định</h4>
            <nav className="flex flex-col gap-3 text-[13px]">
              <Link href="/thong-tin?slug=privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
              <Link href="/thong-tin?slug=terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link>
              <Link href="/thong-tin?slug=legal" className="hover:text-white transition-colors">Thông báo pháp lý</Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar - Social icons only */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-4 text-[13px]">
             <p className="font-medium">© {currentYear} ELC Intelligence PBC</p>
             <div className="flex items-center gap-5">
                <Link href="#" className="hover:text-white transition-all opacity-60 hover:opacity-100">
                  <Globe size={18} strokeWidth={1.5} />
                </Link>
                <Link href="#" className="hover:text-white transition-all opacity-60 hover:opacity-100">
                  <MessageSquare size={18} strokeWidth={1.5} />
                </Link>
                <Link href="#" className="hover:text-white transition-all opacity-60 hover:opacity-100">
                  <Building2 size={18} strokeWidth={1.5} />
                </Link>
             </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
