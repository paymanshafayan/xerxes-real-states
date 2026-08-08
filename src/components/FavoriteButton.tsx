"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

interface FavoriteButtonProps {
  propertyId: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function FavoriteButton({
  propertyId,
  size = "md",
  showLabel = false,
  className = "",
}: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite(propertyId));
  }, [propertyId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = toggleFavorite(propertyId);
    setFavorite(result.isFavorite);
    
    if (result.isFavorite) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center gap-1.5
        rounded-full transition-all duration-200
        ${favorite 
          ? "bg-red-50 text-red-500 hover:bg-red-100" 
          : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500"
        }
        ${animating ? "scale-125" : "scale-100"}
        shadow-md hover:shadow-lg
        ${className}
      `}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`${iconSizes[size]} ${favorite ? "fill-current" : ""}`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {favorite ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
