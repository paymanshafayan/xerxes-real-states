"use client";

import { useState } from "react";
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className = "",
  priority = false,
  quality = 75,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  objectFit = "cover",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Domains configured in next.config.ts `images.remotePatterns` — Next.js
  // Image optimization only works for these; anything else must use a plain
  // <img> tag or the Image Optimization API will reject it at request time.
  const OPTIMIZABLE_HOSTS = ["images.pexels.com"];

  const isExternal = src.startsWith("http");
  const isOptimizable =
    !isExternal || OPTIMIZABLE_HOSTS.some((host) => {
      try {
        return new URL(src).hostname === host;
      } catch {
        return false;
      }
    });

  // For external images on a domain we can't optimize, fall back to a plain
  // <img> tag with basic loading optimizations.
  if (isExternal && !isOptimizable) {
    return (
      <div className={`relative overflow-hidden ${fill ? "w-full h-full" : ""}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          className={`
            ${fill ? "w-full h-full" : ""}
            ${objectFit === "cover" ? "object-cover" : objectFit === "contain" ? "object-contain" : ""}
            ${isLoading ? "opacity-0" : "opacity-100"}
            transition-opacity duration-300
            ${className}
          `}
          style={{
            ...(fill && { position: "absolute", inset: 0 }),
          }}
        />
        {error && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Image not found</span>
          </div>
        )}
      </div>
    );
  }

  // For local images and whitelisted external hosts, use Next.js Image
  return (
    <div className={`relative overflow-hidden ${fill ? "w-full h-full" : ""}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={`
          ${objectFit === "cover" ? "object-cover" : objectFit === "contain" ? "object-contain" : ""}
          ${isLoading ? "opacity-0" : "opacity-100"}
          transition-opacity duration-300
          ${className}
        `}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
      />
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <span className="text-gray-400 text-sm">Image not found</span>
        </div>
      )}
    </div>
  );
}

// Blur placeholder generator
export function generateBlurDataURL(width: number, height: number): string {
  const shimmer = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect width="100%" height="100%" fill="url(#shimmer)"/>
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f3f4f6"/>
          <stop offset="50%" style="stop-color:#e5e7eb"/>
          <stop offset="100%" style="stop-color:#f3f4f6"/>
        </linearGradient>
      </defs>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString("base64")}`;
}
