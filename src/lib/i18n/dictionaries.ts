import type { Locale } from "./types";

export interface Dictionary {
  nav: {
    home: string;
    buy: string;
    rent: string;
    about: string;
    contact: string;
    admin: string;
    search: string;
    favorites: string;
    blog: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchButton: string;
  };
  property: {
    bedrooms: string;
    bathrooms: string;
    area: string;
    price: string;
    featured: string;
    details: string;
    viewDetails: string;
    forSale: string;
    forRent: string;
    villa: string;
    apartment: string;
    land: string;
    commercial: string;
    allTypes: string;
    allCategories: string;
    sqm: string;
    perMonth: string;
    noResults: string;
    features: string;
    description: string;
    location: string;
    contactAgent: string;
    similarProperties: string;
  };
  filter: {
    type: string;
    category: string;
    city: string;
    allCities: string;
    minPrice: string;
    maxPrice: string;
    minBedrooms: string;
    applyFilters: string;
    clearFilters: string;
  };
  sections: {
    featuredProperties: string;
    latestProperties: string;
    popularCities: string;
    whyChooseUs: string;
    ourAgents: string;
    getInTouch: string;
  };
  whyUs: {
    reason1Title: string;
    reason1Desc: string;
    reason2Title: string;
    reason2Desc: string;
    reason3Title: string;
    reason3Desc: string;
    reason4Title: string;
    reason4Desc: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    message: string;
    send: string;
    success: string;
    error: string;
    propertyInquiry: string;
  };
  footer: {
    rights: string;
    description: string;
    quickLinks: string;
    contactInfo: string;
    followUs: string;
  };
  admin: {
    dashboard: string;
    properties: string;
    inquiries: string;
    agents: string;
    settings: string;
    dataSource: string;
    sampleData: string;
    database: string;
    login: string;
    logout: string;
    username: string;
    password: string;
    addProperty: string;
    editProperty: string;
    deleteProperty: string;
    confirmDelete: string;
    save: string;
    cancel: string;
    total: string;
    new_: string;
    status: string;
  };
}

const en: Dictionary = {
  nav: {
    home: "Home",
    buy: "Buy",
    rent: "Rent",
    about: "About",
    contact: "Contact",
    admin: "Admin",
    search: "Search",
    favorites: "Favorites",
    blog: "Blog",
  },
  hero: {
    title: "Find Your Dream Home in Northern Cyprus",
    subtitle: "Explore premium properties for sale and rent in the Mediterranean paradise",
    searchPlaceholder: "Search by city, district or property name...",
    searchButton: "Search",
  },
  property: {
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    area: "Area",
    price: "Price",
    featured: "Featured",
    details: "Property Details",
    viewDetails: "View Details",
    forSale: "For Sale",
    forRent: "For Rent",
    villa: "Villa",
    apartment: "Apartment",
    land: "Land",
    commercial: "Commercial",
    allTypes: "All Types",
    allCategories: "All Categories",
    sqm: "m²",
    perMonth: "/month",
    noResults: "No properties found matching your criteria.",
    features: "Features",
    description: "Description",
    location: "Location",
    contactAgent: "Contact Agent",
    similarProperties: "Similar Properties",
  },
  filter: {
    type: "Type",
    category: "Category",
    city: "City",
    allCities: "All Cities",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    minBedrooms: "Min Bedrooms",
    applyFilters: "Apply Filters",
    clearFilters: "Clear Filters",
  },
  sections: {
    featuredProperties: "Featured Properties",
    latestProperties: "Latest Properties",
    popularCities: "Popular Cities in Northern Cyprus",
    whyChooseUs: "Why Choose Us",
    ourAgents: "Our Agents",
    getInTouch: "Get In Touch",
  },
  whyUs: {
    reason1Title: "Local Expertise",
    reason1Desc: "Deep knowledge of Northern Cyprus real estate market with years of experience",
    reason2Title: "Verified Properties",
    reason2Desc: "All properties are verified and inspected for quality assurance",
    reason3Title: "Multilingual Support",
    reason3Desc: "We serve clients in English, Turkish, Persian, and Russian",
    reason4Title: "End-to-End Service",
    reason4Desc: "From property search to legal documentation, we handle everything",
  },
  contact: {
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    message: "Your Message",
    send: "Send Message",
    success: "Your message has been sent successfully!",
    error: "Something went wrong. Please try again.",
    propertyInquiry: "Property Inquiry",
  },
  footer: {
    rights: "All rights reserved",
    description: "Your trusted partner for real estate in Northern Cyprus. We help you find the perfect property for your needs.",
    quickLinks: "Quick Links",
    contactInfo: "Contact Info",
    followUs: "Follow Us",
  },
  admin: {
    dashboard: "Dashboard",
    properties: "Properties",
    inquiries: "Inquiries",
    agents: "Agents",
    settings: "Settings",
    dataSource: "Data Source",
    sampleData: "Sample Data",
    database: "Database",
    login: "Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    addProperty: "Add Property",
    editProperty: "Edit Property",
    deleteProperty: "Delete Property",
    confirmDelete: "Are you sure you want to delete this property?",
    save: "Save",
    cancel: "Cancel",
    total: "Total",
    new_: "New",
    status: "Status",
  },
};

const tr: Dictionary = {
  nav: {
    home: "Ana Sayfa",
    buy: "Satılık",
    rent: "Kiralık",
    about: "Hakkımızda",
    contact: "İletişim",
    admin: "Yönetim",
    search: "Ara",
    favorites: "Favoriler",
    blog: "Blog",
  },
  hero: {
    title: "Kuzey Kıbrıs'ta Hayalinizdeki Evi Bulun",
    subtitle: "Akdeniz cennetinde satılık ve kiralık premium mülkleri keşfedin",
    searchPlaceholder: "Şehir, ilçe veya mülk adıyla arayın...",
    searchButton: "Ara",
  },
  property: {
    bedrooms: "Yatak Odası",
    bathrooms: "Banyo",
    area: "Alan",
    price: "Fiyat",
    featured: "Öne Çıkan",
    details: "Mülk Detayları",
    viewDetails: "Detayları Gör",
    forSale: "Satılık",
    forRent: "Kiralık",
    villa: "Villa",
    apartment: "Daire",
    land: "Arsa",
    commercial: "Ticari",
    allTypes: "Tüm Türler",
    allCategories: "Tüm Kategoriler",
    sqm: "m²",
    perMonth: "/ay",
    noResults: "Kriterlerinize uygun mülk bulunamadı.",
    features: "Özellikler",
    description: "Açıklama",
    location: "Konum",
    contactAgent: "Danışmanla İletişime Geç",
    similarProperties: "Benzer Mülkler",
  },
  filter: {
    type: "Tür",
    category: "Kategori",
    city: "Şehir",
    allCities: "Tüm Şehirler",
    minPrice: "Min Fiyat",
    maxPrice: "Max Fiyat",
    minBedrooms: "Min Yatak Odası",
    applyFilters: "Filtreleri Uygula",
    clearFilters: "Filtreleri Temizle",
  },
  sections: {
    featuredProperties: "Öne Çıkan Mülkler",
    latestProperties: "En Son Mülkler",
    popularCities: "Kuzey Kıbrıs'ın Popüler Şehirleri",
    whyChooseUs: "Neden Bizi Seçmelisiniz",
    ourAgents: "Danışmanlarımız",
    getInTouch: "Bize Ulaşın",
  },
  whyUs: {
    reason1Title: "Yerel Uzmanlık",
    reason1Desc: "Yılların deneyimiyle Kuzey Kıbrıs gayrimenkul pazarında derin bilgi",
    reason2Title: "Doğrulanmış Mülkler",
    reason2Desc: "Tüm mülkler kalite güvencesi için doğrulanmış ve incelenmiştir",
    reason3Title: "Çok Dilli Destek",
    reason3Desc: "İngilizce, Türkçe, Farsça ve Rusça müşteri hizmeti sunuyoruz",
    reason4Title: "Uçtan Uca Hizmet",
    reason4Desc: "Mülk aramasından yasal belgelere kadar her şeyi biz hallederiz",
  },
  contact: {
    name: "Ad Soyad",
    email: "E-posta Adresi",
    phone: "Telefon Numarası",
    message: "Mesajınız",
    send: "Mesaj Gönder",
    success: "Mesajınız başarıyla gönderildi!",
    error: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
    propertyInquiry: "Mülk Sorgusu",
  },
  footer: {
    rights: "Tüm hakları saklıdır",
    description: "Kuzey Kıbrıs'ta gayrimenkul konusunda güvenilir ortağınız. İhtiyaçlarınıza uygun mükemmel mülkü bulmanıza yardımcı oluyoruz.",
    quickLinks: "Hızlı Bağlantılar",
    contactInfo: "İletişim Bilgileri",
    followUs: "Bizi Takip Edin",
  },
  admin: {
    dashboard: "Panel",
    properties: "Mülkler",
    inquiries: "Sorgular",
    agents: "Danışmanlar",
    settings: "Ayarlar",
    dataSource: "Veri Kaynağı",
    sampleData: "Örnek Veri",
    database: "Veritabanı",
    login: "Giriş",
    logout: "Çıkış",
    username: "Kullanıcı Adı",
    password: "Şifre",
    addProperty: "Mülk Ekle",
    editProperty: "Mülk Düzenle",
    deleteProperty: "Mülk Sil",
    confirmDelete: "Bu mülkü silmek istediğinizden emin misiniz?",
    save: "Kaydet",
    cancel: "İptal",
    total: "Toplam",
    new_: "Yeni",
    status: "Durum",
  },
};

const fa: Dictionary = {
  nav: {
    home: "صفحه اصلی",
    buy: "خرید",
    rent: "اجاره",
    about: "درباره ما",
    contact: "تماس",
    admin: "مدیریت",
    search: "جستجو",
    favorites: "علاقه‌مندی‌ها",
    blog: "بلاگ",
  },
  hero: {
    title: "خانه رویایی خود را در قبرس شمالی پیدا کنید",
    subtitle: "املاک لوکس برای فروش و اجاره در بهشت مدیترانه را کشف کنید",
    searchPlaceholder: "جستجو بر اساس شهر، منطقه یا نام ملک...",
    searchButton: "جستجو",
  },
  property: {
    bedrooms: "اتاق خواب",
    bathrooms: "حمام",
    area: "مساحت",
    price: "قیمت",
    featured: "ویژه",
    details: "جزئیات ملک",
    viewDetails: "مشاهده جزئیات",
    forSale: "فروشی",
    forRent: "اجاره‌ای",
    villa: "ویلا",
    apartment: "آپارتمان",
    land: "زمین",
    commercial: "تجاری",
    allTypes: "همه انواع",
    allCategories: "همه دسته‌ها",
    sqm: "متر مربع",
    perMonth: "/ماهانه",
    noResults: "هیچ ملکی مطابق با معیارهای شما یافت نشد.",
    features: "امکانات",
    description: "توضیحات",
    location: "موقعیت",
    contactAgent: "تماس با مشاور",
    similarProperties: "املاک مشابه",
  },
  filter: {
    type: "نوع",
    category: "دسته‌بندی",
    city: "شهر",
    allCities: "همه شهرها",
    minPrice: "حداقل قیمت",
    maxPrice: "حداکثر قیمت",
    minBedrooms: "حداقل اتاق خواب",
    applyFilters: "اعمال فیلتر",
    clearFilters: "پاک کردن فیلترها",
  },
  sections: {
    featuredProperties: "املاک ویژه",
    latestProperties: "جدیدترین املاک",
    popularCities: "شهرهای محبوب قبرس شمالی",
    whyChooseUs: "چرا ما را انتخاب کنید",
    ourAgents: "مشاوران ما",
    getInTouch: "با ما در تماس باشید",
  },
  whyUs: {
    reason1Title: "تخصص محلی",
    reason1Desc: "دانش عمیق از بازار املاک قبرس شمالی با سال‌ها تجربه",
    reason2Title: "املاک تایید شده",
    reason2Desc: "تمامی املاک برای تضمین کیفیت بررسی و تایید شده‌اند",
    reason3Title: "پشتیبانی چندزبانه",
    reason3Desc: "ما به مشتریان به زبان‌های انگلیسی، ترکی، فارسی و روسی خدمت می‌دهیم",
    reason4Title: "خدمات جامع",
    reason4Desc: "از جستجوی ملک تا مدارک حقوقی، ما همه چیز را مدیریت می‌کنیم",
  },
  contact: {
    name: "نام کامل",
    email: "آدرس ایمیل",
    phone: "شماره تلفن",
    message: "پیام شما",
    send: "ارسال پیام",
    success: "پیام شما با موفقیت ارسال شد!",
    error: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    propertyInquiry: "استعلام ملک",
  },
  footer: {
    rights: "تمامی حقوق محفوظ است",
    description: "شریک مورد اعتماد شما در املاک قبرس شمالی. ما به شما کمک می‌کنیم ملک مناسب نیازهایتان را پیدا کنید.",
    quickLinks: "لینک‌های سریع",
    contactInfo: "اطلاعات تماس",
    followUs: "ما را دنبال کنید",
  },
  admin: {
    dashboard: "داشبورد",
    properties: "املاک",
    inquiries: "استعلام‌ها",
    agents: "مشاوران",
    settings: "تنظیمات",
    dataSource: "منبع داده",
    sampleData: "داده نمونه",
    database: "پایگاه داده",
    login: "ورود",
    logout: "خروج",
    username: "نام کاربری",
    password: "رمز عبور",
    addProperty: "افزودن ملک",
    editProperty: "ویرایش ملک",
    deleteProperty: "حذف ملک",
    confirmDelete: "آیا مطمئن هستید که می‌خواهید این ملک را حذف کنید؟",
    save: "ذخیره",
    cancel: "لغو",
    total: "مجموع",
    new_: "جدید",
    status: "وضعیت",
  },
};

const ru: Dictionary = {
  nav: {
    home: "Главная",
    buy: "Купить",
    rent: "Аренда",
    about: "О нас",
    contact: "Контакты",
    admin: "Админ",
    search: "Поиск",
    favorites: "Избранное",
    blog: "Блог",
  },
  hero: {
    title: "Найдите дом мечты в Северном Кипре",
    subtitle: "Откройте для себя премиальную недвижимость на продажу и аренду в средиземноморском раю",
    searchPlaceholder: "Поиск по городу, району или названию...",
    searchButton: "Поиск",
  },
  property: {
    bedrooms: "Спальни",
    bathrooms: "Ванные",
    area: "Площадь",
    price: "Цена",
    featured: "Рекомендуемые",
    details: "Детали недвижимости",
    viewDetails: "Подробнее",
    forSale: "Продажа",
    forRent: "Аренда",
    villa: "Вилла",
    apartment: "Квартира",
    land: "Земля",
    commercial: "Коммерческая",
    allTypes: "Все типы",
    allCategories: "Все категории",
    sqm: "м²",
    perMonth: "/месяц",
    noResults: "Не найдено объектов, соответствующих вашим критериям.",
    features: "Характеристики",
    description: "Описание",
    location: "Расположение",
    contactAgent: "Связаться с агентом",
    similarProperties: "Похожие объекты",
  },
  filter: {
    type: "Тип",
    category: "Категория",
    city: "Город",
    allCities: "Все города",
    minPrice: "Мин. цена",
    maxPrice: "Макс. цена",
    minBedrooms: "Мин. спален",
    applyFilters: "Применить",
    clearFilters: "Сбросить",
  },
  sections: {
    featuredProperties: "Рекомендуемые объекты",
    latestProperties: "Новые объекты",
    popularCities: "Популярные города Северного Кипра",
    whyChooseUs: "Почему мы",
    ourAgents: "Наши агенты",
    getInTouch: "Свяжитесь с нами",
  },
  whyUs: {
    reason1Title: "Местная экспертиза",
    reason1Desc: "Глубокие знания рынка недвижимости Северного Кипра с многолетним опытом",
    reason2Title: "Проверенная недвижимость",
    reason2Desc: "Все объекты проверены и осмотрены для гарантии качества",
    reason3Title: "Многоязычная поддержка",
    reason3Desc: "Мы обслуживаем клиентов на английском, турецком, фарси и русском языках",
    reason4Title: "Полный сервис",
    reason4Desc: "От поиска недвижимости до юридических документов — мы берём всё на себя",
  },
  contact: {
    name: "Полное имя",
    email: "Электронная почта",
    phone: "Телефон",
    message: "Ваше сообщение",
    send: "Отправить",
    success: "Ваше сообщение успешно отправлено!",
    error: "Что-то пошло не так. Попробуйте ещё раз.",
    propertyInquiry: "Запрос о недвижимости",
  },
  footer: {
    rights: "Все права защищены",
    description: "Ваш надежный партнёр по недвижимости в Северном Кипре. Мы поможем найти идеальный объект для ваших потребностей.",
    quickLinks: "Быстрые ссылки",
    contactInfo: "Контактная информация",
    followUs: "Подписывайтесь",
  },
  admin: {
    dashboard: "Панель",
    properties: "Объекты",
    inquiries: "Запросы",
    agents: "Агенты",
    settings: "Настройки",
    dataSource: "Источник данных",
    sampleData: "Примеры",
    database: "База данных",
    login: "Вход",
    logout: "Выход",
    username: "Логин",
    password: "Пароль",
    addProperty: "Добавить объект",
    editProperty: "Редактировать",
    deleteProperty: "Удалить",
    confirmDelete: "Вы уверены, что хотите удалить этот объект?",
    save: "Сохранить",
    cancel: "Отмена",
    total: "Всего",
    new_: "Новые",
    status: "Статус",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, tr, fa, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}
