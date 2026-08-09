"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Home, Building2, Key, MapPin } from "lucide-react";
import { useLocale } from "./AppShell";
import OptimizedImage from "./OptimizedImage";

const defaultSlides = [
  {
    image: "https://images.pexels.com/photos/29702273/pexels-photo-29702273.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1920",
    alt: "Aerial view of coastal villas with pools",
  },
  {
    image: "https://images.pexels.com/photos/19075385/pexels-photo-19075385.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1920",
    alt: "Luxury villa and infinity pool overlooking the sea",
  },
  {
    image: "https://images.pexels.com/photos/31817167/pexels-photo-31817167.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1920",
    alt: "Poolside relaxation overlooking the Mediterranean",
  },
  {
    image: "https://images.pexels.com/photos/29702291/pexels-photo-29702291.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1920",
    alt: "Villa with infinity pool and Mediterranean Sea view",
  },
  {
    image: "https://images.pexels.com/photos/19075379/pexels-photo-19075379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1920",
    alt: "Luxury villa patio with sea view",
  },
];

interface HeroProps {
  slides?: { image: string; alt: string }[];
  textOverride?: {
    title?: Partial<Record<"en" | "tr" | "fa" | "ru", string>>;
    subtitle?: Partial<Record<"en" | "tr" | "fa" | "ru", string>>;
  };
}

export default function HeroSection({ slides, textOverride }: HeroProps) {
  const heroSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const { dict, locale } = useLocale();
  const heroTitle = textOverride?.title?.[locale] || dict.hero.title;
  const heroSubtitle = textOverride?.subtitle?.[locale] || dict.hero.subtitle;
  const [searchQuery, setSearchQuery] = useState("");
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 700);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % heroSlides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + heroSlides.length) % heroSlides.length);
  }, [current, goTo]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/properties?search=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  return (
    <section className="relative h-[520px] sm:h-[580px] lg:h-[640px] overflow-hidden">
      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-all duration-700 ease-in-out"
          style={{
            opacity: index === current ? 1 : 0,
            transform: index === current ? "scale(1)" : "scale(1.08)",
          }}
        >
          <OptimizedImage
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="w-full h-full"
          />
        </div>
      ))}

      {/* Overlay - شفاف‌تر */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

      {/* Minimal Arrows - no circle, just subtle icons */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 text-white/40 hover:text-white/80 transition-all"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 text-white/40 hover:text-white/80 transition-all"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Content */}
      <div className="absolute inset-0 z-[5] flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
              {heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-white/85 mb-8 leading-relaxed drop-shadow">
              {heroSubtitle}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex bg-white/95 backdrop-blur rounded-xl shadow-2xl overflow-hidden">
                <div className="flex-1 flex items-center px-4">
                  <Search className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={dict.hero.searchPlaceholder}
                    className="flex-1 px-3 py-4 text-sm text-gray-800 placeholder-gray-400 border-0 focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 sm:px-8 py-4 bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  {dict.hero.searchButton}
                </button>
              </div>
            </form>

            {/* Quick filters */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={() =>
                  router.push("/properties?type=sale&category=villa")
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white text-sm rounded-lg border border-white/25 hover:bg-white/25 transition-colors"
              >
                <Home className="w-4 h-4 text-gray-300 fill-gray-300" />
                <span>{dict.property.villa}</span>
              </button>
              <button
                onClick={() =>
                  router.push("/properties?type=sale&category=apartment")
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white text-sm rounded-lg border border-white/25 hover:bg-white/25 transition-colors"
              >
                <Building2 className="w-4 h-4 text-gray-300 fill-gray-300" />
                <span>{dict.property.apartment}</span>
              </button>
              <button
                onClick={() => router.push("/properties?type=rent")}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white text-sm rounded-lg border border-white/25 hover:bg-white/25 transition-colors"
              >
                <Key className="w-4 h-4 text-gray-300 fill-gray-300" />
                <span>{dict.property.forRent}</span>
              </button>
              <button
                onClick={() =>
                  router.push("/properties?type=sale&category=land")
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white text-sm rounded-lg border border-white/25 hover:bg-white/25 transition-colors"
              >
                <MapPin className="w-4 h-4 text-gray-300 fill-gray-300" />
                <span>{dict.property.land}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
