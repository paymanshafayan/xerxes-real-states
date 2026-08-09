"use client";

import type { Locale } from "@/lib/i18n/types";

interface FlagIconProps {
  locale: Locale | string;
  className?: string;
}

export default function FlagIcon({ locale, className = "w-5 h-3.5" }: FlagIconProps) {
  const code = (locale || "en").toLowerCase();

  if (code === "en") {
    return (
      <svg
        className={`${className} inline-block shrink-0 rounded-xs shadow-xs`}
        viewBox="0 0 640 480"
        aria-hidden="true"
      >
        <clipPath id="flag-en-clip">
          <rect width="640" height="480" rx="4" />
        </clipPath>
        <g clipPath="url(#flag-en-clip)">
          <path fill="#012169" d="M0 0h640v480H0z" />
          <path
            fill="#FFF"
            d="m75 0 245 180L565 0h75v60L435 240l205 180v60h-75L320 300 75 480H0v-60l205-180L0 60V0h75z"
          />
          <path
            fill="#C8102E"
            d="m424 288 216 162v30h-40L384 318zM640 30v30L440 210h40L640 60zM0 450v-30l200-150h-40L0 420zM216 192 0 30V0h40l216 162z"
          />
          <path fill="#FFF" d="M240 0h160v480H240zM0 160h640v160H0z" />
          <path fill="#C8102E" d="M267 0h106v480H267zM0 187h640v106H0z" />
        </g>
      </svg>
    );
  }

  if (code === "tr") {
    return (
      <svg
        className={`${className} inline-block shrink-0 rounded-xs shadow-xs`}
        viewBox="0 0 1200 800"
        aria-hidden="true"
      >
        <clipPath id="flag-tr-clip">
          <rect width="1200" height="800" rx="8" />
        </clipPath>
        <g clipPath="url(#flag-tr-clip)">
          <rect width="1200" height="800" fill="#E30A17" />
          <circle cx="425" cy="400" r="200" fill="#ffffff" />
          <circle cx="475" cy="400" r="160" fill="#E30A17" />
          <polygon
            fill="#ffffff"
            points="583.33,400 706.35,439.97 630.31,335.37 630.31,464.63 706.35,360.03"
          />
        </g>
      </svg>
    );
  }

  if (code === "fa") {
    return (
      <svg
        className={`${className} inline-block shrink-0 rounded-xs shadow-xs`}
        viewBox="0 0 640 480"
        aria-hidden="true"
      >
        <clipPath id="flag-fa-clip">
          <rect width="640" height="480" rx="4" />
        </clipPath>
        <g clipPath="url(#flag-fa-clip)">
          <path fill="#239f40" d="M0 0h640v160H0z" />
          <path fill="#fff" d="M0 160h640v160H0z" />
          <path fill="#da0000" d="M0 320h640v160H0z" />
          <g fill="#da0000" transform="translate(320 240) scale(1.6)">
            <path d="M0-18c-3 6-3 12 0 18 3-6 3-12 0-18z" />
            <path d="M-6-14c-4 5-5 13 0 20-2-6-1-14 0-20z" />
            <path d="M6-14c4 5 5 13 0 20 2-6 1-14 0-20z" />
            <path d="M-13-8c-5 6-5 15 0 22-2-7 0-15 0-22z" />
            <path d="M13-8c5 6 5 15 0 22 2-7 0-15 0-22z" />
            <rect x="-1" y="-22" width="2" height="4" rx="1" />
          </g>
        </g>
      </svg>
    );
  }

  if (code === "ru") {
    return (
      <svg
        className={`${className} inline-block shrink-0 rounded-xs shadow-xs`}
        viewBox="0 0 640 480"
        aria-hidden="true"
      >
        <clipPath id="flag-ru-clip">
          <rect width="640" height="480" rx="4" />
        </clipPath>
        <g clipPath="url(#flag-ru-clip)">
          <path fill="#fff" d="M0 0h640v160H0z" />
          <path fill="#0039a6" d="M0 160h640v160H0z" />
          <path fill="#d52b1e" d="M0 320h640v160H0z" />
        </g>
      </svg>
    );
  }

  return null;
}
