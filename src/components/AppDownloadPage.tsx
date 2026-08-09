"use client";

import { useEffect, useState } from "react";
import { Apple, BellRing, Download, ExternalLink, MessageCircle, Play, Smartphone, View } from "lucide-react";
import { AppDownloadConfig } from "@/lib/appDownloads";
import { useLocale } from "./AppShell";

export default function AppDownloadPage({ config }: { config: AppDownloadConfig }) {
  const { locale, dict } = useLocale();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const copy = {
    en: { eyebrow: "Xerxes for customers", title: "Find your next property, wherever you are.", description: "Browse verified homes in Northern Cyprus, save the ones you love and talk to an expert when you are ready.", apk: "Direct Android download", unavailable: "Download links will appear here as soon as the app is released.", scan: "Scan to open the download page", features: [["360° virtual tours", "Explore supported properties before travelling."], ["Price-drop alerts", "Keep up with genuine reductions on saved homes."], ["Expert live chat", "Speak to a consultant in English, Turkish, Persian or Russian."]] },
    tr: { eyebrow: "Müşteriler için Xerxes", title: "Nerede olursanız olun yeni evinizi bulun.", description: "Kuzey Kıbrıs'taki doğrulanmış evleri inceleyin, beğendiklerinizi kaydedin ve hazır olduğunuzda bir uzmanla konuşun.", apk: "Android'i doğrudan indir", unavailable: "Uygulama yayınlandığında indirme bağlantıları burada görünecek.", scan: "İndirme sayfasını açmak için tarayın", features: [["360° sanal turlar", "Desteklenen mülkleri seyahat etmeden önce keşfedin."], ["Fiyat düşüşü uyarıları", "Kaydedilen evlerdeki gerçek indirimleri takip edin."], ["Uzman canlı sohbet", "İngilizce, Türkçe, Farsça veya Rusça danışmanla konuşun."]] },
    fa: { eyebrow: "Xerxes برای مشتریان", title: "خانه بعدی‌تان را از هر جا پیدا کنید.", description: "خانه‌های تأییدشده در قبرس شمالی را ببینید، موارد دلخواه را ذخیره کنید و در زمان مناسب با کارشناس گفت‌وگو کنید.", apk: "دانلود مستقیم اندروید", unavailable: "لینک‌های دانلود پس از انتشار اپلیکیشن در این بخش نمایش داده می‌شوند.", scan: "برای باز کردن صفحه دانلود اسکن کنید", features: [["تورهای مجازی ۳۶۰ درجه", "پیش از سفر، املاک پشتیبانی‌شده را بررسی کنید."], ["هشدار کاهش قیمت", "کاهش قیمت‌های واقعی املاک ذخیره‌شده را پیگیری کنید."], ["چت زنده با کارشناس", "با مشاور به فارسی، انگلیسی، ترکی یا روسی گفت‌وگو کنید."]] },
    ru: { eyebrow: "Xerxes для клиентов", title: "Найдите новый дом, где бы вы ни были.", description: "Изучайте проверенные объекты на Северном Кипре, сохраняйте понравившиеся и общайтесь с экспертом, когда будете готовы.", apk: "Скачать Android напрямую", unavailable: "Ссылки на скачивание появятся здесь после выпуска приложения.", scan: "Отсканируйте, чтобы открыть страницу скачивания", features: [["Виртуальные туры 360°", "Осматривайте поддерживаемые объекты до поездки."], ["Уведомления о снижении цены", "Следите за реальными снижениями по сохранённым объектам."], ["Чат с экспертом", "Общайтесь с консультантом на английском, турецком, персидском или русском."]] },
  }[locale];
  // The QR intentionally opens the multilingual download page, not a binary.
  // Visitors can then choose a store, platform, or direct APK intentionally.
  const appDownloadUrl = origin ? `${origin}/app` : "";
  const icons = [View, BellRing, MessageCircle];
  const storeIcon = (platform: string) => platform === "app_store" ? Apple : platform === "google_play" ? Play : ExternalLink;
  const hasDownloads = Boolean(config.apkUrl || config.stores.length);

  return <section className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-slate-50 to-white py-12 sm:py-16"><div className="max-w-6xl mx-auto px-4 sm:px-6">
    <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8 items-stretch">
      <div className="rounded-3xl bg-[#0d2340] text-white p-7 sm:p-10 overflow-hidden relative"><div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative"><p className="text-primary-light text-sm font-semibold uppercase tracking-[.16em]">{copy.eyebrow}</p><h1 className="mt-4 text-3xl sm:text-5xl font-bold leading-tight max-w-xl">{copy.title}</h1><p className="mt-5 text-white/75 max-w-xl leading-relaxed">{copy.description}</p>
          <div className="mt-9 grid gap-4">{copy.features.map(([title, description], index) => { const Icon = icons[index]; return <div key={title} className="flex gap-4 rounded-2xl bg-white/10 p-4 border border-white/10"><div className="w-10 h-10 rounded-xl bg-white/10 shrink-0 flex items-center justify-center"><Icon className="w-5 h-5 text-white" /></div><div><h2 className="font-semibold">{title}</h2><p className="text-sm text-white/70 mt-1">{description}</p></div></div>; })}</div>
        </div>
      </div>
      <aside className="rounded-3xl bg-white border border-gray-200 shadow-xl shadow-slate-200/40 p-7 sm:p-8 flex flex-col">
        <div className="flex items-start justify-between gap-4"><div><div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center"><Smartphone className="w-6 h-6 text-primary" /></div><h2 className="text-xl font-bold text-gray-900 mt-4">{dict.nav.app}</h2></div>{appDownloadUrl && <div className="text-center"><img className="w-24 h-24 rounded-lg border border-gray-100" alt={copy.scan} src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(appDownloadUrl)}`} /><p className="text-[10px] text-gray-500 mt-1 max-w-24">{copy.scan}</p></div>}</div>
        <div className="mt-8 space-y-3">{config.apkUrl && <a href={config.apkUrl} className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3.5 text-white font-semibold hover:bg-primary-dark transition-colors"><Download className="w-5 h-5" />{copy.apk}</a>}{config.stores.map((store) => { const Icon = storeIcon(store.platform); return <a key={store.id} href={store.url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 text-gray-800 font-semibold hover:border-primary hover:text-primary transition-colors"><Icon className="w-5 h-5" />{store.label}</a>; })}{!hasDownloads && <p className="rounded-xl bg-gray-50 px-4 py-5 text-sm text-gray-600 text-center">{copy.unavailable}</p>}</div>
        <div className="mt-auto pt-6"><img src="/mobile_listing_preview.png" alt="Xerxes customer mobile application" className="w-full max-h-52 object-cover object-top rounded-xl border border-gray-100" /></div>
      </aside>
    </div>
  </div></section>;
}
