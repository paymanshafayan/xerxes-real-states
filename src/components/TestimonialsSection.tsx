"use client";

import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import OptimizedImage from "./OptimizedImage";

interface Testimonial {
  id: number;
  name: string;
  country: string;
  avatar: string;
  rating: number;
  text: string;
  propertyType: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "James Wilson",
    country: "🇬🇧 United Kingdom",
    avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    rating: 5,
    text: "Xerxes made our dream of owning a villa in Cyprus come true. The team was incredibly helpful throughout the entire process. From initial search to final paperwork, everything was seamless.",
    propertyType: "Villa in Kyrenia",
  },
  {
    id: 2,
    name: "Elena Ivanova",
    country: "🇷🇺 Russia",
    avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    rating: 5,
    text: "Отличная команда профессионалов! Помогли найти идеальную квартиру в Искеле. Весь процесс был прозрачным и простым. Очень рекомендую!",
    propertyType: "Apartment in Iskele",
  },
  {
    id: 3,
    name: "Ali Rezaei",
    country: "🇮🇷 Iran",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    rating: 5,
    text: "تیم Xerxes بسیار حرفه‌ای و قابل اعتماد بودند. از ابتدا تا پایان خرید ویلا در گیرنه ما را راهنمایی کردند. تجربه فوق‌العاده‌ای بود.",
    propertyType: "Villa in Kyrenia",
  },
  {
    id: 4,
    name: "Mehmet Demir",
    country: "🇹🇷 Turkey",
    avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    rating: 5,
    text: "Kuzey Kıbrıs'ta yatırım yapmak için en doğru adres. Profesyonel ekip, şeffaf süreç ve mükemmel sonuç. Herkese tavsiye ederim.",
    propertyType: "Commercial in Famagusta",
  },
  {
    id: 5,
    name: "Sarah Müller",
    country: "🇩🇪 Germany",
    avatar: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    rating: 5,
    text: "We invested in a rental property and the returns have been excellent. The team helped us find the perfect location with great ROI potential.",
    propertyType: "Apartment in Famagusta",
  },
  {
    id: 6,
    name: "Dimitri Papadopoulos",
    country: "🇨🇾 Cyprus",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    rating: 4,
    text: "Very professional service and great selection of properties. The multilingual support made communication easy. Highly recommended for international buyers.",
    propertyType: "Land in Lefke",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoplay]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  // Rotate the order starting at currentIndex. How many are *visible* is
  // decided purely in CSS (1 on mobile / 2 on sm / 3 on lg) so there is no
  // window.innerWidth read during render — that read forced a synchronous
  // layout after hydration mutations (Lighthouse "forced reflow") and caused
  // an SSR/hydration content mismatch, since the server always rendered one
  // card while a wide client re-rendered three.
  const ordered = testimonials
    .slice(currentIndex)
    .concat(testimonials.slice(0, currentIndex));

  // Position 0 shows everywhere; 1 from sm; 2 from lg; the rest stay hidden.
  const visibilityClass = (position: number) =>
    position === 0
      ? ""
      : position === 1
        ? "hidden sm:block"
        : position === 2
          ? "hidden lg:block"
          : "hidden";

  return (
    <section className="bg-white py-14 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            What Our Clients Say
          </h2>
          <p className="text-gray-500">
            Real stories from satisfied property owners
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setAutoplay(false)}
          onMouseLeave={() => setAutoplay(true)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ordered.map((testimonial, position) => (
              <div
                key={testimonial.id}
                className={`bg-gray-50 rounded-xl p-6 border border-gray-100 ${visibilityClass(position)}`}
              >
                  <Quote className="w-6 h-6 text-primary/30 mb-3" />
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-4">
                    {testimonial.text}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < testimonial.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <OptimizedImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {testimonial.country}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? "bg-primary" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
