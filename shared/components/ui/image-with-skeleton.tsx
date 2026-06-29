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
  priority,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(!!priority);

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse z-10" />
      )}
      <Image
        {...props}
        priority={priority}
        alt={alt || ""}
        className={cn(
          !priority && "transition-opacity duration-300",
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
