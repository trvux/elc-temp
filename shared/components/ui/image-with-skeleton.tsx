"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface ImageWithSkeletonProps extends ImageProps {
  wrapperClassName?: string;
}

export function ImageWithSkeleton({
  className,
  wrapperClassName,
  alt,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {/* Skeleton / Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse z-10" />
      )}
      
      {/* Actual Image */}
      <Image
        {...props}
        alt={alt || ""}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={(e) => {
          setIsLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
      />
    </div>
  );
}
