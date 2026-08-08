"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, TrendingUp } from "lucide-react";
import { useLocale } from "./AppShell";
import PropertyCard from "./PropertyCard";
import type { SampleCity, SampleProperty } from "@/lib/data/sampleData";
import { getCityName } from "@/lib/utils";

interface CityContentProps {
  cityData: SampleCity;
  properties: SampleProperty[];
}

export default function CityContent({ cityData, properties }: CityContentProps) {
  const { locale, dict } = useLocale();
  const cityName = getCityName(cityData, locale);
  const cityDescriptions: Record<string, Record<string, string>> = {
    kyrenia: {
      en: "Kyrenia (Girne) is the jewel of Northern Cyprus, famous for its historic harbor, medieval castle, and stunning coastline.",
      tr: "Girne, tarihi limanı, ortaçağ kalesi ve muhteşem sahil şeridiyle Kuzey Kıbrıs'ın incisi.",
      fa: "گیرنه جواهر قبرس شمالی است که به بندر تاریخی، قلعه قرون وسطایی و خط ساحلی خیره‌کننده مشهور است.",
      ru: "Кирения - жемчужина Северного Кипра, знаменитая исторической гаванью и потрясающей береговой линией.",
    },
    famagusta: {
      en: "Famagusta (Gazimağusa) is a historic port city with a vibrant university atmosphere and beautiful beaches like Salamis.",
      tr: "Gazimağusa, canlı üniversite atmosferine sahip tarihi bir liman şehri. Salamis gibi güzel plajları ile tanınır.",
      fa: "فاماگوستا یک شهر بندری تاریخی با فضای دانشگاهی پویا و سواحل زیبا مانند سلامیس است.",
      ru: "Фамагуста - исторический портовый город с яркой университетской атмосферой и прекрасными пляжами.",
    },
    nicosia: {
      en: "Nicosia (Lefkoşa) is the capital and largest city of Northern Cyprus with urban convenience and diverse property market.",
      tr: "Lefkoşa, Kuzey Kıbrıs'ın başkenti ve en büyük şehri. Çeşitli bir mülk piyasası sunar.",
      fa: "نیکوزیا پایتخت و بزرگ‌ترین شهر قبرس شمالی با بازار املاک متنوع است.",
      ru: "Никосия - столица и крупнейший город Северного Кипра с разнообразным рынком недвижимости.",
    },
    iskele: {
      en: "Iskele is Northern Cyprus's fastest-growing resort area, known for Long Beach and stunning beachfront properties.",
      tr: "İskele, Long Beach ile bilinen Kuzey Kıbrıs'ın en hızlı büyüyen tatil bölgesi.",
      fa: "ایسکله سریع‌ترین منطقه تفریحی در حال رشد قبرس شمالی است.",
      ru: "Искеле - самый быстрорастущий курортный район Северного Кипра.",
    },
    guzelyurt: {
      en: "Guzelyurt is a green oasis famous for citrus groves, agricultural land, peaceful living and affordable investments.",
      tr: "Güzelyurt, narenciye bahçeleri ve tarım arazileriyle ünlü Kuzey Kıbrıs'ın yeşil vahesi.",
      fa: "گوزلیورت یک واحه سرسبز معروف به باغ‌های مرکبات و زمین‌های کشاورزی است.",
      ru: "Гюзельюрт - зелёный оазис, знаменитый цитрусовыми рощами и сельскохозяйственными землями.",
    },
    lefke: {
      en: "Lefke is a charming town with rich history, mineral springs, traditional architecture and proximity to Morphou Bay.",
      tr: "Lefke, zengin tarihi, geleneksel mimarisi ve Güzelyurt Körfezi'ne yakınlığıyla büyüleyici bir kasaba.",
      fa: "لفکه یک شهر جذاب با تاریخ غنی، معماری سنتی و نزدیکی به خلیج مورفو است.",
      ru: "Лефке - очаровательный город с богатой историей и традиционной архитектурой.",
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const descObj = cityDescriptions[cityData.name] as Record<string, string> | undefined;
  const cityDesc = descObj?.[locale] || descObj?.en || "";
  const propertyCount = properties.length;
  const forSale = properties.filter((p) => p.type === "sale").length;
  const forRent = properties.filter((p) => p.type === "rent").length;

  return (
    <div>
      {/* City Hero */}
      <section className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={cityData.image}
          alt={cityName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl-flip" />
            {dict.nav.home}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{cityName}</h1>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {propertyCount} {dict.admin.properties.toLowerCase()}
            </span>
            <span className="text-green-400">{forSale} {dict.property.forSale.toLowerCase()}</span>
            <span className="text-amber-400">{forRent} {dict.property.forRent.toLowerCase()}</span>
          </div>
        </div>
      </section>

      {/* City Description */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-gray-600 leading-relaxed max-w-3xl">{cityDesc}</p>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{propertyCount}</p>
              <p className="text-xs text-gray-500">{dict.admin.properties}</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-success">{forSale}</p>
              <p className="text-xs text-gray-500">{dict.property.forSale}</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">{forRent}</p>
              <p className="text-xs text-gray-500">{dict.property.forRent}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {dict.sections.latestProperties}
        </h2>
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{dict.property.noResults}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                dict={dict}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
