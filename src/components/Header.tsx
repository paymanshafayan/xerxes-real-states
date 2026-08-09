"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Globe, Heart } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/types";
import { locales } from "@/lib/i18n/types";
import { getFavorites } from "@/lib/favorites";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import CurrencySelector from "./CurrencyConverter";

interface HeaderProps {
  dict: Dictionary;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export default function Header({ dict, locale, onLocaleChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const currentLocale = locales.find((l) => l.code === locale)!;

  useEffect(() => {
    const updateCount = () => {
      setFavoriteCount(getFavorites().length);
    };
    updateCount();
    // Listen for storage changes
    window.addEventListener("storage", updateCount);
    // Check periodically for same-tab updates
    const interval = setInterval(updateCount, 1000);
    return () => {
      window.removeEventListener("storage", updateCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Xerxes" className="w-9 h-9 rounded-lg object-contain" />
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-900 tracking-tight">Xerxes</span>
              <span className="text-[10px] text-gray-500 block -mt-1 tracking-wider uppercase">Real Estate</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              {dict.nav.home}
            </Link>
            <Link
              href="/properties?type=sale"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              {dict.nav.buy}
            </Link>
            <Link
              href="/properties?type=rent"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              {dict.nav.rent}
            </Link>
            <Link
              href="/blog"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              {dict.nav.contact}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {/* Currency Selector */}
            <div className="hidden md:block">
              <CurrencySelector />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Favorites */}
            <Link
              href="/favorites"
              className="relative p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Heart className="w-5 h-5" />
              {favoriteCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favoriteCount > 9 ? "9+" : favoriteCount}
                </span>
              )}
            </Link>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{currentLocale.flag} {currentLocale.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                    {locales.map((loc) => (
                      <button
                        key={loc.code}
                        onClick={() => {
                          onLocaleChange(loc.code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                          locale === loc.code
                            ? "text-primary font-semibold bg-primary-light"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="text-base">{loc.flag}</span>
                        <span className="font-medium uppercase">{loc.code.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-1 pt-3">
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50"
              >
                {dict.nav.home}
              </Link>
              <Link
                href="/properties?type=sale"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50"
              >
                {dict.nav.buy}
              </Link>
              <Link
                href="/properties?type=rent"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50"
              >
                {dict.nav.rent}
              </Link>
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50"
              >
                {dict.nav.contact}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
