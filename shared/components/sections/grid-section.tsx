"use client";
import React from "react";

interface GridSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  isFirst?: boolean;
  showDiamond?: boolean;
}

export function GridSection({
  children,
  id,
  className = "",
  isFirst = false,
  showDiamond = true,
}: GridSectionProps) {
  const borderColor = "border-muted-foreground/35";

  return (
    <div id={id} className={`w-full relative ${className}`}>
      {/* Refined Divider Block inspired by shadcnstudio.com */}
      {!isFirst && (
        <div className="absolute top-0 left-0 w-full h-px z-10 pointer-events-none">
          {/* Full-width viewport line */}
          <div className="absolute left-1/2 h-px w-screen -translate-x-1/2">
            <hr className={`-mt-px w-full border-dashed ${borderColor}`} />
            {showDiamond && (
              <div className="relative mx-auto h-px w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-8">
                {/* Top-left diamond indicator */}
                <span
                  className={`border ${borderColor} bg-background absolute top-1/2 left-0 z-20 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] hidden lg:block`}
                />
                {/* Top-right diamond indicator */}
                <span
                  className={`border ${borderColor} bg-background absolute top-1/2 right-0 z-20 w-2.5 h-2.5 translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] hidden lg:block`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`mx-auto h-full w-full max-w-350 border-dashed min-[87.5rem]:border-x min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-8 relative ${borderColor} py-10 md:py-16 lg:py-20`}
      >
        {children}
      </div>
    </div>
  );
}




