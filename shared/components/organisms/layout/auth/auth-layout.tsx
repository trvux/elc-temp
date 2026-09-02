import Image from "next/image";
import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/logo/logo.svg"
            alt="Điện máy ELC"
            width={32}
            height={32}
            style={{ width: "auto" }}
            className="h-8 w-auto"
            priority
          />
          <span className="font-heading text-lg font-semibold tracking-tight">Điện máy ELC</span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        {children}
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Điện máy ELC. Đã đăng ký bản quyền.
      </footer>
    </div>
  );
}
