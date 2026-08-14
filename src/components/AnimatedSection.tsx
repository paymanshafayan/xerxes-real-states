"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" | "scaleIn" | "stagger";
  delay?: number;
  duration?: number;
  once?: boolean;
}

type Variant = NonNullable<AnimatedSectionProps["variant"]>;

// Same hidden states and easing as the previous framer-motion
// implementation: ease [0.25, 0.46, 0.45, 0.94], rootMargin "-50px".
const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const hiddenStyles: Record<Variant, React.CSSProperties> = {
  fadeUp: { opacity: 0, transform: "translateY(40px)" },
  fadeIn: { opacity: 0 },
  slideLeft: { opacity: 0, transform: "translateX(-60px)" },
  slideRight: { opacity: 0, transform: "translateX(60px)" },
  scaleIn: { opacity: 0, transform: "scale(0.8)" },
  stagger: { opacity: 0 },
};

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

export default function AnimatedSection({
  children,
  className = "",
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  once = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer support — reveal on the next frame without animating.
      const id = requestAnimationFrame(() => setIsInView(true));
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reducedMotion]);

  const visible = isInView || reducedMotion;
  const style: React.CSSProperties = visible
    ? {
        opacity: 1,
        transform: "none",
        transition: reducedMotion
          ? "none"
          : `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`,
      }
    : hiddenStyles[variant];

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
