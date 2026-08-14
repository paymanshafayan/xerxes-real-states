"use client";

import Link from "next/link";
import { ArrowRight, Shield, CheckCircle, Globe, Headphones } from "lucide-react";
import { useLocale } from "./AppShell";
import { useSiteContent } from "./SiteContentProvider";
import PropertyCard from "./PropertyCard";
import AnimatedSection from "./AnimatedSection";
import OptimizedImage from "./OptimizedImage";
import type { SampleProperty, SampleAgent } from "@/lib/data/sampleData";
import { sampleCities } from "@/lib/data/sampleData";
import { getCityName, getAgentBio } from "@/lib/utils";

interface HomeContentProps {
  featuredProperties: SampleProperty[];
  latestProperties: SampleProperty[];
  agents: SampleAgent[];
}

export default function HomeContent({
  featuredProperties,
  latestProperties,
  agents,
}: HomeContentProps) {
  const { locale, dict } = useLocale();
  const { about } = useSiteContent();
  // Content Manager's "about" section only has English fields, so the
  // override applies for the English locale only; other locales keep the
  // translated dictionary copy.
  const isEnglish = locale === "en";

  return (
    <>
      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {dict.sections.featuredProperties}
          </h2>
          <Link
            href="/properties"
            className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
          >
            {dict.property.viewDetails}
            <ArrowRight className="w-4 h-4 rtl-flip" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              dict={dict}
              locale={locale}
            />
          ))}
        </div>
      </section>

      {/* Popular Cities */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {dict.sections.popularCities}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sampleCities.map((city) => (
              <Link
                key={city.name}
                href={`/properties?city=${city.name}`}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] shadow-sm hover:shadow-lg transition-shadow"
              >
                <OptimizedImage
                  src={city.image}
                  alt={getCityName(city, locale)}
                  fill
                  quality={70}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 190px"
                  className="group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-sm">
                    {getCityName(city, locale)}
                  </h3>
                  <p className="text-gray-300 text-xs">
                    {city.propertyCount} {dict.admin.properties.toLowerCase()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {dict.sections.latestProperties}
          </h2>
          <Link
            href="/properties"
            className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
          >
            {dict.property.viewDetails}
            <ArrowRight className="w-4 h-4 rtl-flip" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {latestProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              dict={dict}
              locale={locale}
            />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-14 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection variant="fadeUp">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">
              {dict.sections.whyChooseUs}
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: (isEnglish && about.reason1_title_en) || dict.whyUs.reason1Title,
                desc: (isEnglish && about.reason1_desc_en) || dict.whyUs.reason1Desc,
              },
              {
                icon: CheckCircle,
                title: (isEnglish && about.reason2_title_en) || dict.whyUs.reason2Title,
                desc: (isEnglish && about.reason2_desc_en) || dict.whyUs.reason2Desc,
              },
              {
                icon: Globe,
                title: (isEnglish && about.reason3_title_en) || dict.whyUs.reason3Title,
                desc: (isEnglish && about.reason3_desc_en) || dict.whyUs.reason3Desc,
              },
              {
                icon: Headphones,
                title: (isEnglish && about.reason4_title_en) || dict.whyUs.reason4Title,
                desc: (isEnglish && about.reason4_desc_en) || dict.whyUs.reason4Desc,
              },
            ].map((item, index) => (
              <AnimatedSection
                key={index}
                variant="scaleIn"
                delay={index * 0.1}
              >
                <div className="text-center p-6 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-light flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Our Agents */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {dict.sections.ourAgents}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden">
                  <OptimizedImage
                    src={agent.photo}
                    alt={agent.name}
                    width={80}
                    height={80}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{agent.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{agent.phone}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {getAgentBio(agent, locale)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
