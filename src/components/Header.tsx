"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, ChevronDown, Heart } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/types";
import { locales } from "@/lib/i18n/types";
import { getFavorites } from "@/lib/favorites";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import CurrencySelector from "./CurrencyConverter";
import FlagIcon from "./FlagIcon";

interface HeaderProps {
  dict: Dictionary;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

interface NavItem {
  key: string;
  href: string;
  label: string;
  isActive: (pathname: string, searchType: string | null) => boolean;
}

function NavLinksDesktop({
  dict,
  pathname,
  searchType,
}: {
  dict: Dictionary;
  pathname: string;
  searchType: string | null;
}) {
  const items: NavItem[] = [
    {
      key: "home",
      href: "/",
      label: dict.nav.home,
      isActive: (p) => p === "/",
    },
    {
      key: "buy",
      href: "/properties?type=sale",
      label: dict.nav.buy,
      isActive: (p, s) => p.startsWith("/properties") && s === "sale",
    },
    {
      key: "rent",
      href: "/properties?type=rent",
      label: dict.nav.rent,
      isActive: (p, s) => p.startsWith("/properties") && s === "rent",
    },
    {
      key: "blog",
      href: "/blog",
      label: "Blog",
      isActive: (p) => p === "/blog" || p.startsWith("/blog/"),
    },
    {
      key: "contact",
      href: "/contact",
      label: dict.nav.contact,
      isActive: (p) => p === "/contact" || p.startsWith("/contact/"),
    },
  ];

  return (
    <nav className="hidden md:flex items-center gap-2">
      {items.map((item) => {
        const active = item.isActive(pathname, searchType);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`px-3 py-2 text-sm transition-colors ${
              active
                ? "text-primary font-semibold"
                : "text-gray-700 hover:text-primary font-medium"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavLinks({
  dict,
  pathname,
  searchType,
  onClose,
}: {
  dict: Dictionary;
  pathname: string;
  searchType: string | null;
  onClose: () => void;
}) {
  const items: NavItem[] = [
    {
      key: "home",
      href: "/",
      label: dict.nav.home,
      isActive: (p) => p === "/",
    },
    {
      key: "buy",
      href: "/properties?type=sale",
      label: dict.nav.buy,
      isActive: (p, s) => p.startsWith("/properties") && s === "sale",
    },
    {
      key: "rent",
      href: "/properties?type=rent",
      label: dict.nav.rent,
      isActive: (p, s) => p.startsWith("/properties") && s === "rent",
    },
    {
      key: "blog",
      href: "/blog",
      label: "Blog",
      isActive: (p) => p === "/blog" || p.startsWith("/blog/"),
    },
    {
      key: "contact",
      href: "/contact",
      label: dict.nav.contact,
      isActive: (p) => p === "/contact" || p.startsWith("/contact/"),
    },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.isActive(pathname, searchType);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClose}
            className={`px-3 py-2.5 text-sm transition-colors ${
              active
                ? "text-primary font-semibold"
                : "text-gray-700 hover:text-primary font-medium"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderNavWrapper({
  dict,
  menuOpen,
  setMenuOpen,
}: {
  dict: Dictionary;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const searchType = searchParams?.get("type") || null;

  return (
    <>
      <NavLinksDesktop
        dict={dict}
        pathname={pathname}
        searchType={searchType}
      />
      {menuOpen && (
        <div className="md:hidden pb-4 border-t border-gray-100 mt-1 pt-3">
          <MobileNavLinks
            dict={dict}
            pathname={pathname}
            searchType={searchType}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
}

export default function Header({ dict, locale, onLocaleChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setFavoriteCount(getFavorites().length);
    };
    updateCount();
    window.addEventListener("storage", updateCount);
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
          <Suspense
            fallback={
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/" className="px-3 py-2 text-sm text-gray-700 hover:text-primary font-medium">
                  {dict.nav.home}
                </Link>
                <Link href="/properties?type=sale" className="px-3 py-2 text-sm text-gray-700 hover:text-primary font-medium">
                  {dict.nav.buy}
                </Link>
                <Link href="/properties?type=rent" className="px-3 py-2 text-sm text-gray-700 hover:text-primary font-medium">
                  {dict.nav.rent}
                </Link>
                <Link href="/blog" className="px-3 py-2 text-sm text-gray-700 hover:text-primary font-medium">
                  Blog
                </Link>
                <Link href="/contact" className="px-3 py-2 text-sm text-gray-700 hover:text-primary font-medium">
                  {dict.nav.contact}
                </Link>
              </nav>
            }
          >
            <HeaderNavWrapper dict={dict} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          </Suspense>

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

            {/* Language Switcher - Flag and Abbreviation ONLY */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Change language"
              >
                <FlagIcon locale={locale} className="w-5 h-3.5" />
                <span className="font-semibold text-xs tracking-wider uppercase">
                  {locale.toUpperCase()}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangOpen(false)}
                  />
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-1 w-24 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 overflow-hidden">
                    {locales.map((loc) => (
                      <button
                        key={loc.code}
                        type="button"
                        onClick={() => {
                          onLocaleChange(loc.code);
                          setLangOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-start gap-2.5 transition-colors ${
                          locale === loc.code
                            ? "text-primary font-bold bg-primary-light"
                            : "text-gray-700 font-medium"
                        }`}
                      >
                        <FlagIcon locale={loc.code} className="w-5 h-3.5" />
                        <span className="font-semibold text-xs uppercase tracking-wider">
                          {loc.code.toUpperCase()}
                        </span>
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
      </div>
    </header>
  );
}
