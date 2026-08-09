"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Check,
  CreditCard,
  Calendar,
} from "lucide-react";
import { useLocale } from "./AppShell";
import PropertyCard from "./PropertyCard";
import FavoriteButton from "./FavoriteButton";
import ShareButtons from "./ShareButtons";
import MortgageCalculator from "./MortgageCalculator";
import ROICalculator from "./ROICalculator";
import AppointmentBooking from "./AppointmentBooking";
import VirtualTour, { demo360Tours, demo360Images } from "./VirtualTour";
import PaymentForm from "./PaymentForm";
import VisitRequestModal from "./VisitRequestModal";
import OptimizedImage from "./OptimizedImage";
import type { SampleProperty, SampleAgent } from "@/lib/data/sampleData";
import { featureLabels, sampleCities } from "@/lib/data/sampleData";
import {
  getPropertyTitle,
  getPropertyDescription,
  formatPrice,
  getAgentBio,
  getCityName,
} from "@/lib/utils";

// Dynamic import for map (SSR disabled)
const PropertyMap = dynamic(() => import("./PropertyMap"), { 
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse" />
});

interface PropertyDetailProps {
  property: SampleProperty;
  agent: SampleAgent | null;
  similarProperties: SampleProperty[];
}

export default function PropertyDetail({
  property,
  agent,
  similarProperties,
}: PropertyDetailProps) {
  const { locale, dict } = useLocale();
  const [currentImage, setCurrentImage] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showPayment, setShowPayment] = useState(false);
  const [showVisitRequest, setShowVisitRequest] = useState(false);

  const title = getPropertyTitle(property, locale);
  const description = getPropertyDescription(property, locale);
  const price = formatPrice(property.price, property.currency, property.type, locale);
  const cityData = sampleCities.find((c) => c.name === property.city);
  const cityLabel = cityData ? getCityName(cityData, locale) : property.city;

  const typeLabel = property.type === "sale" ? dict.property.forSale : dict.property.forRent;

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % property.images.length);
  };
  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("loading");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          ...contactForm,
        }),
      });
      if (res.ok) {
        setSubmitStatus("success");
        setContactForm({ name: "", email: "", phone: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button */}
      <Link
        href="/properties"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        {dict.admin.properties}
      </Link>

      {/* Image Gallery */}
      <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-100 aspect-[16/8]">
        <OptimizedImage
          src={property.images[currentImage]}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="w-full h-full"
        />
        {property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {property.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    idx === currentImage ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {/* Type badge */}
        <span
          className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm font-semibold text-white ${
            property.type === "sale" ? "bg-primary" : "bg-accent"
          }`}
        >
          {typeLabel}
        </span>
        {/* Favorite button */}
        <div className="absolute top-4 right-4">
          <FavoriteButton propertyId={property.id} size="lg" />
        </div>
        {/* Virtual Tour button */}
        {(property.virtualTourUrl || demo360Tours[property.slug] || demo360Images[property.slug]) && (
          <div className="absolute bottom-4 right-4">
            <VirtualTour
              tourUrl={property.virtualTourUrl || demo360Tours[property.slug]}
              images360={demo360Images[property.slug]}
              propertyTitle={title}
            />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {property.images.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {property.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImage(idx)}
              className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                idx === currentImage ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Title & Price */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
              <MapPin className="w-4 h-4" />
              <span>
                {cityLabel}
                {property.district ? `, ${property.district}` : ""}
              </span>
            </div>
            <p className="text-3xl font-bold text-primary">{price}</p>
          </div>

          {/* Stats */}
          {property.category !== "land" && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Bed className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-gray-900">{property.bedrooms}</p>
                <p className="text-xs text-gray-500">{dict.property.bedrooms}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Bath className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-gray-900">{property.bathrooms}</p>
                <p className="text-xs text-gray-500">{dict.property.bathrooms}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Maximize className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-gray-900">{property.area}</p>
                <p className="text-xs text-gray-500">{dict.property.sqm}</p>
              </div>
            </div>
          )}
          {property.category === "land" && (
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-8 max-w-[200px]">
              <Maximize className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-gray-900">{property.area}</p>
              <p className="text-xs text-gray-500">{dict.property.sqm}</p>
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {dict.property.description}
            </h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>

          {/* Features */}
          {property.features.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {dict.property.features}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.features.map((feature) => {
                  const label = featureLabels[feature];
                  const text = label
                    ? label[locale as keyof typeof label]
                    : feature;
                  return (
                    <div
                      key={feature}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700"
                    >
                      <Check className="w-4 h-4 text-success shrink-0" />
                      {text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Map */}
          {property.lat && property.lng && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {dict.property.location}
              </h2>
              <PropertyMap
                lat={property.lat}
                lng={property.lng}
                title={title}
                zoom={14}
                height="300px"
              />
            </div>
          )}

          {/* Share Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <ShareButtons
              url={typeof window !== "undefined" ? window.location.href : `/property/${property.slug}`}
              title={title}
              description={description}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Agent Card */}
          {agent && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={agent.photo}
                  alt={agent.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-xs text-gray-500">{agent.phone}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {getAgentBio(agent, locale)}
              </p>
              <div className="flex gap-2">
                <a
                  href={`tel:${agent.phone}`}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {dict.nav.contact}
                </a>
                <a
                  href={`mailto:${agent.email}`}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </div>
            </div>
          )}

          {/* Payment / Deposit */}
          {property.type === "sale" && (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
            >
              <CreditCard className="w-5 h-5 text-gray-200 fill-gray-200" />
              <span>Pay Deposit / Book Now</span>
            </button>
          )}

          {/* Appointment Booking */}
          {agent && (
            <div className="mb-4">
              <AppointmentBooking
                propertyTitle={title}
                propertyId={property.id}
                agentName={agent.name}
                agentPhone={agent.phone}
              />
            </div>
          )}

          {/* Visit Request (Phase 8) */}
          <button
            onClick={() => setShowVisitRequest(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-primary/10 text-primary border border-primary/20 font-semibold rounded-lg hover:bg-primary/20 transition-all"
          >
            <Calendar className="w-5 h-5" />
            <span>درخواست بازدید</span>
          </button>

          {/* Calculators (for sale properties) */}
          {property.type === "sale" && (
            <div className="space-y-3 mb-4">
              <MortgageCalculator
                propertyPrice={property.price}
                currency={property.currency}
              />
              <ROICalculator
                propertyPrice={property.price}
                currency={property.currency}
              />
            </div>
          )}

          {/* Contact Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              {dict.contact.propertyInquiry}
            </h3>
            <form onSubmit={handleContact} className="space-y-3">
              <input
                type="text"
                placeholder={dict.contact.name}
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <input
                type="email"
                placeholder={dict.contact.email}
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <input
                type="tel"
                placeholder={dict.contact.phone}
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm({ ...contactForm, phone: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <textarea
                placeholder={dict.contact.message}
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                required
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
              />
              <button
                type="submit"
                disabled={submitStatus === "loading"}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {submitStatus === "loading" ? "..." : dict.contact.send}
              </button>
              {submitStatus === "success" && (
                <p className="text-sm text-success text-center">{dict.contact.success}</p>
              )}
              {submitStatus === "error" && (
                <p className="text-sm text-danger text-center">{dict.contact.error}</p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {dict.property.similarProperties}
            </h2>
            <Link
              href="/properties"
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              {dict.property.viewDetails}
              <ArrowRight className="w-4 h-4 rtl-flip" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {similarProperties.map((p) => (
              <PropertyCard key={p.id} property={p} dict={dict} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Payment Form Modal */}
      {showPayment && (
        <PaymentForm
          propertyId={property.id}
          propertyTitle={title}
          type="deposit"
          defaultAmount={Math.round(property.price * 0.1)}
          onSuccess={() => {}}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Visit Request Modal (Phase 8) */}
      {showVisitRequest && (
        <VisitRequestModal
          isOpen={showVisitRequest}
          onClose={() => setShowVisitRequest(false)}
          listingId={property.id}
          listingTitle={title}
        />
      )}
    </div>
  );
}
