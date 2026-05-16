import { cn } from "@/shared/lib/utils";
import { Plus } from "lucide-react";

interface GridContainerProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  id?: string;
}

export function GridContainer({
  children,
  className,
  withPadding = true,
  id,
}: GridContainerProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full border-b border-border/60 overflow-hidden md:overflow-visible",
        className,
      )}
    >
      {/* Background Dots Pattern (optional but common in this style) */}
      <div className="absolute inset-0  opacity-[0.15] pointer-events-none" />

      {/* Vertical Lines (Left & Right edges of the center container) */}
      <div className="absolute left-1/2 -translate-x-[min(50vw,640px)] top-0 bottom-0 w-px bg-border/60 hidden md:block" />
      <div className="absolute left-1/2 translate-x-[min(50vw,640px)] top-0 bottom-0 w-px bg-border/60 hidden md:block" />

      {/* Intersection Markers (+) - Perfectly Centered */}
      <div
        className="absolute left-1/2 -translate-x-[min(50vw,640px)] top-0 -translate-y-1/2 z-10 text-muted-foreground/40 hidden md:flex items-center justify-center pointer-events-none"
        style={{
          transform:
            "translateX(calc(-1 * min(50vw, 640px) - 50%)) translateY(-50%)",
        }}
      >
        <Plus size={14} strokeWidth={1} />
      </div>
      <div
        className="absolute left-1/2 translate-x-[min(50vw,640px)] top-0 -translate-y-1/2 z-10 text-muted-foreground/40 hidden md:flex items-center justify-center pointer-events-none"
        style={{
          transform:
            "translateX(calc(min(50vw, 640px) - 50%)) translateY(-50%)",
        }}
      >
        <Plus size={14} strokeWidth={1} />
      </div>

      {/* Bottom Markers */}
      <div
        className="absolute left-1/2 -translate-x-[min(50vw,640px)] bottom-0 translate-y-1/2 z-10 text-muted-foreground/40 hidden md:flex items-center justify-center pointer-events-none"
        style={{
          transform:
            "translateX(calc(-1 * min(50vw, 640px) - 50%)) translateY(50%)",
        }}
      >
        <Plus size={14} strokeWidth={1} />
      </div>
      <div
        className="absolute left-1/2 translate-x-[min(50vw,640px)] bottom-0 translate-y-1/2 z-10 text-muted-foreground/40 hidden md:flex items-center justify-center pointer-events-none"
        style={{
          transform: "translateX(calc(min(50vw, 640px) - 50%)) translateY(50%)",
        }}
      >
        <Plus size={14} strokeWidth={1} />
      </div>

      {/* Content Wrapper */}
      <div
        className={cn(
          "relative mx-auto max-w-7xl",
          withPadding && "px-4 md:px-8 py-16 md:py-24",
        )}
      >
        {children}
      </div>
    </section>
  );
}
