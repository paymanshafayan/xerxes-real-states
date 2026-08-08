export interface SampleProperty {
  id: number;
  slug: string;
  titleTr: string;
  titleEn: string;
  titleFa: string;
  titleRu: string;
  descriptionTr: string;
  descriptionEn: string;
  descriptionFa: string;
  descriptionRu: string;
  type: "sale" | "rent";
  category: "villa" | "apartment" | "land" | "commercial";
  price: number;
  previousPrice?: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  features: string[];
  isFeatured: boolean;
  agentId: number;
  createdAt: string;
  // Mobile app extensions (optional in sample data)
  panoramas?: string[];
  videos?: string[];
  audioNotes?: string[];
  virtualTourUrl?: string;
}

export interface SampleAgent {
  id: number;
  name: string;
  email: string;
  phone: string;
  photo: string;
  bioTr: string;
  bioEn: string;
  bioFa: string;
  bioRu: string;
}

export interface SampleCity {
  name: string;
  nameTr: string;
  nameEn: string;
  nameFa: string;
  nameRu: string;
  image: string;
  propertyCount: number;
}

export const sampleAgents: SampleAgent[] = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    email: "ahmet@northcyprushomes.com",
    phone: "+90 533 840 1001",
    photo: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=300&w=300",
    bioTr: "Kuzey Kıbrıs gayrimenkul pazarında 15 yıllık deneyim. Villa ve lüks mülkler konusunda uzman.",
    bioEn: "15 years of experience in Northern Cyprus real estate. Specialist in villas and luxury properties.",
    bioFa: "۱۵ سال تجربه در بازار املاک قبرس شمالی. متخصص در ویلا و املاک لوکس.",
    bioRu: "15 лет опыта на рынке недвижимости Северного Кипра. Специалист по виллам и элитной недвижимости.",
  },
  {
    id: 2,
    name: "Elena Petrova",
    email: "elena@northcyprushomes.com",
    phone: "+90 533 840 1002",
    photo: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=300&w=300",
    bioTr: "Rusça ve İngilizce konuşan uluslararası müşteri uzmanı. Daire ve yatırım danışmanı.",
    bioEn: "International client specialist fluent in Russian and English. Apartment and investment consultant.",
    bioFa: "متخصص مشتریان بین‌المللی با تسلط بر زبان‌های روسی و انگلیسی. مشاور آپارتمان و سرمایه‌گذاری.",
    bioRu: "Специалист по международным клиентам, свободно владеющий русским и английским. Консультант по квартирам и инвестициям.",
  },
  {
    id: 3,
    name: "Mehmet Kaya",
    email: "mehmet@northcyprushomes.com",
    phone: "+90 533 840 1003",
    photo: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=300&w=300",
    bioTr: "Arsa ve ticari gayrimenkul uzmanı. Kuzey Kıbrıs'taki en iyi yatırım fırsatlarını sunar.",
    bioEn: "Land and commercial property specialist. Offers the best investment opportunities in Northern Cyprus.",
    bioFa: "متخصص زمین و املاک تجاری. بهترین فرصت‌های سرمایه‌گذاری در قبرس شمالی را ارائه می‌دهد.",
    bioRu: "Специалист по земельным участкам и коммерческой недвижимости. Лучшие инвестиционные возможности Северного Кипра.",
  },
];

export const sampleCities: SampleCity[] = [
  {
    name: "kyrenia",
    nameTr: "Girne",
    nameEn: "Kyrenia",
    nameFa: "گیرنه",
    nameRu: "Кирения",
    image: "https://images.pexels.com/photos/29702273/pexels-photo-29702273.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600",
    propertyCount: 45,
  },
  {
    name: "famagusta",
    nameTr: "Gazimağusa",
    nameEn: "Famagusta",
    nameFa: "فاماگوستا",
    nameRu: "Фамагуста",
    image: "https://images.pexels.com/photos/19075379/pexels-photo-19075379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600",
    propertyCount: 32,
  },
  {
    name: "nicosia",
    nameTr: "Lefkoşa",
    nameEn: "Nicosia",
    nameFa: "نیکوزیا",
    nameRu: "Никосия",
    image: "https://images.pexels.com/photos/8146332/pexels-photo-8146332.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600",
    propertyCount: 28,
  },
  {
    name: "iskele",
    nameTr: "İskele",
    nameEn: "Iskele",
    nameFa: "ایسکله",
    nameRu: "Искеле",
    image: "https://images.pexels.com/photos/20975729/pexels-photo-20975729.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600",
    propertyCount: 38,
  },
  {
    name: "guzelyurt",
    nameTr: "Güzelyurt",
    nameEn: "Guzelyurt",
    nameFa: "گوزلیورت",
    nameRu: "Гюзельюрт",
    image: "https://images.pexels.com/photos/29702291/pexels-photo-29702291.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600",
    propertyCount: 15,
  },
  {
    name: "lefke",
    nameTr: "Lefke",
    nameEn: "Lefke",
    nameFa: "لفکه",
    nameRu: "Лефке",
    image: "https://images.pexels.com/photos/35069530/pexels-photo-35069530.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600",
    propertyCount: 10,
  },
];

export const sampleProperties: SampleProperty[] = [
  {
    id: 1,
    slug: "luxury-sea-view-villa-kyrenia",
    titleTr: "Girne'de Deniz Manzaralı Lüks Villa",
    titleEn: "Luxury Sea View Villa in Kyrenia",
    titleFa: "ویلای لوکس با منظره دریا در گیرنه",
    titleRu: "Роскошная вилла с видом на море в Кирении",
    descriptionTr: "Akdeniz'in muhteşem manzarasına sahip bu lüks villa, 4 yatak odası, özel havuz, modern mutfak ve geniş bahçe ile benzersiz bir yaşam sunuyor. Premium malzemelerle inşa edilmiş olup, Girne şehir merkezine sadece 5 dakika uzaklıktadır.",
    descriptionEn: "This luxury villa with stunning Mediterranean views offers unique living with 4 bedrooms, private pool, modern kitchen and spacious garden. Built with premium materials, it is only 5 minutes from Kyrenia city center.",
    descriptionFa: "این ویلای لوکس با منظره خیره‌کننده مدیترانه، زندگی منحصر به فردی با ۴ اتاق خواب، استخر خصوصی، آشپزخانه مدرن و باغ بزرگ ارائه می‌دهد. با مصالح درجه یک ساخته شده و تنها ۵ دقیقه از مرکز شهر گیرنه فاصله دارد.",
    descriptionRu: "Эта роскошная вилла с потрясающим видом на Средиземное море предлагает уникальную жизнь с 4 спальнями, частным бассейном, современной кухней и просторным садом. Построена из премиальных материалов, всего в 5 минутах от центра Кирении.",
    type: "sale",
    category: "villa",
    price: 450000,
    previousPrice: 495000,
    currency: "GBP",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    city: "kyrenia",
    district: "Bellapais",
    address: "Bellapais Road, Kyrenia",
    lat: 35.3117,
    lng: 33.3589,
    images: [
      "https://images.pexels.com/photos/19075379/pexels-photo-19075379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/8089172/pexels-photo-8089172.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/8146332/pexels-photo-8146332.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["pool", "garden", "parking", "security", "sea_view", "central_heating", "air_conditioning"],
    isFeatured: true,
    agentId: 1,
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    slug: "modern-apartment-famagusta",
    titleTr: "Gazimağusa'da Modern 2+1 Daire",
    titleEn: "Modern 2+1 Apartment in Famagusta",
    titleFa: "آپارتمان مدرن ۲+۱ در فاماگوستا",
    titleRu: "Современная квартира 2+1 в Фамагусте",
    descriptionTr: "Gazimağusa'nın en gözde bölgesinde yer alan bu modern daire, açık plan yaşam alanı, balkon ve yeraltı otoparkı sunuyor. Üniversiteye ve plaja yakın konumda, yatırım için mükemmel bir fırsat.",
    descriptionEn: "Located in the most sought-after area of Famagusta, this modern apartment features open plan living, balcony and underground parking. Close to university and beach, perfect investment opportunity.",
    descriptionFa: "این آپارتمان مدرن در بهترین منطقه فاماگوستا واقع شده و دارای فضای زندگی پلان باز، بالکن و پارکینگ زیرزمینی است. نزدیک به دانشگاه و ساحل، فرصت سرمایه‌گذاری عالی.",
    descriptionRu: "Расположена в самом востребованном районе Фамагусты, эта современная квартира имеет открытую планировку, балкон и подземную парковку. Рядом с университетом и пляжем, отличная инвестиция.",
    type: "sale",
    category: "apartment",
    price: 85000,
    currency: "GBP",
    bedrooms: 2,
    bathrooms: 1,
    area: 95,
    city: "famagusta",
    district: "Sakarya",
    address: "Sakarya District, Famagusta",
    lat: 35.1257,
    lng: 33.9444,
    images: [
      "https://images.pexels.com/photos/8146330/pexels-photo-8146330.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/7173666/pexels-photo-7173666.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/5998063/pexels-photo-5998063.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["balcony", "parking", "elevator", "air_conditioning", "furnished"],
    isFeatured: true,
    agentId: 2,
    createdAt: "2025-01-20T10:00:00Z",
  },
  {
    id: 3,
    slug: "penthouse-iskele-long-beach",
    titleTr: "İskele Long Beach'te Çatı Katı Penthouse",
    titleEn: "Penthouse at Iskele Long Beach",
    titleFa: "پنت‌هاوس در ساحل لانگ بیچ ایسکله",
    titleRu: "Пентхаус на Лонг Бич в Искеле",
    descriptionTr: "Long Beach'te eşsiz konumda yer alan bu penthouse, 180 derece deniz manzarası, geniş teras, jakuzi ve lüks iç tasarımı ile dikkat çekiyor. Tatil veya kalıcı yaşam için ideal.",
    descriptionEn: "This penthouse at a unique location on Long Beach features 180-degree sea view, spacious terrace, jacuzzi and luxury interior design. Ideal for holiday or permanent living.",
    descriptionFa: "این پنت‌هاوس در موقعیت منحصر به فرد ساحل لانگ بیچ با منظره ۱۸۰ درجه دریا، تراس بزرگ، جکوزی و طراحی داخلی لوکس متمایز است. ایده‌آل برای تعطیلات یا زندگی دائمی.",
    descriptionRu: "Пентхаус в уникальном месте на Лонг Бич с панорамным видом на море 180°, просторной террасой, джакузи и роскошным дизайном интерьера. Идеально для отдыха или постоянного проживания.",
    type: "sale",
    category: "apartment",
    price: 320000,
    currency: "GBP",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    city: "iskele",
    district: "Long Beach",
    address: "Long Beach Road, Iskele",
    lat: 35.2882,
    lng: 33.8958,
    images: [
      "https://images.pexels.com/photos/20975729/pexels-photo-20975729.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/8146214/pexels-photo-8146214.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/8089172/pexels-photo-8089172.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["sea_view", "terrace", "jacuzzi", "furnished", "air_conditioning", "gym", "pool"],
    isFeatured: true,
    agentId: 1,
    createdAt: "2025-02-01T10:00:00Z",
  },
  {
    id: 4,
    slug: "rental-studio-nicosia",
    titleTr: "Lefkoşa Merkezde Kiralık Stüdyo Daire",
    titleEn: "Studio Apartment for Rent in Nicosia Center",
    titleFa: "آپارتمان استودیو اجاره‌ای در مرکز نیکوزیا",
    titleRu: "Студия в аренду в центре Никосии",
    descriptionTr: "Lefkoşa'nın kalbinde, tüm olanaklara yakın konumda bulunan tam mobilyalı stüdyo daire. Öğrenciler ve genç profesyoneller için ideal. Aylık kiralık.",
    descriptionEn: "Fully furnished studio apartment in the heart of Nicosia, close to all amenities. Ideal for students and young professionals. Monthly rental.",
    descriptionFa: "آپارتمان استودیو کاملاً مبله در قلب نیکوزیا، نزدیک به تمام امکانات. ایده‌آل برای دانشجویان و حرفه‌ای‌های جوان. اجاره ماهانه.",
    descriptionRu: "Полностью меблированная студия в самом центре Никосии, рядом со всеми удобствами. Идеально для студентов и молодых специалистов. Помесячная аренда.",
    type: "rent",
    category: "apartment",
    price: 500,
    currency: "GBP",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    city: "nicosia",
    district: "Gönyeli",
    address: "Gönyeli Main Street, Nicosia",
    lat: 35.2043,
    lng: 33.3478,
    images: [
      "https://images.pexels.com/photos/7173666/pexels-photo-7173666.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/5998063/pexels-photo-5998063.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["furnished", "air_conditioning", "internet", "elevator"],
    isFeatured: false,
    agentId: 2,
    createdAt: "2025-02-10T10:00:00Z",
  },
  {
    id: 5,
    slug: "investment-land-guzelyurt",
    titleTr: "Güzelyurt'ta Yatırımlık Arsa",
    titleEn: "Investment Land in Guzelyurt",
    titleFa: "زمین سرمایه‌گذاری در گوزلیورت",
    titleRu: "Инвестиционный участок в Гюзельюрте",
    descriptionTr: "Güzelyurt'un gelişen bölgesinde 2 dönüm yatırımlık arsa. İmar izni mevcut, altyapı hazır. Konut veya ticari proje için uygundur.",
    descriptionEn: "2 donum investment land in the developing area of Guzelyurt. Planning permission available, infrastructure ready. Suitable for residential or commercial project.",
    descriptionFa: "۲ دونوم زمین سرمایه‌گذاری در منطقه در حال توسعه گوزلیورت. مجوز ساخت موجود، زیرساخت آماده. مناسب برای پروژه مسکونی یا تجاری.",
    descriptionRu: "2 донума инвестиционной земли в развивающемся районе Гюзельюрта. Разрешение на строительство имеется, инфраструктура готова. Подходит для жилого или коммерческого проекта.",
    type: "sale",
    category: "land",
    price: 120000,
    currency: "GBP",
    bedrooms: 0,
    bathrooms: 0,
    area: 2680,
    city: "guzelyurt",
    district: "Merkez",
    address: "Guzelyurt Merkez",
    lat: 35.1989,
    lng: 32.9938,
    images: [
      "https://images.pexels.com/photos/29702273/pexels-photo-29702273.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["road_access", "water", "electricity", "planning_permission"],
    isFeatured: false,
    agentId: 3,
    createdAt: "2025-02-15T10:00:00Z",
  },
  {
    id: 6,
    slug: "beachfront-villa-iskele",
    titleTr: "İskele'de Sahile Sıfır Villa",
    titleEn: "Beachfront Villa in Iskele",
    titleFa: "ویلای ساحلی در ایسکله",
    titleRu: "Вилла на берегу моря в Искеле",
    descriptionTr: "Sahile sıfır konumda, 5 yatak odalı lüks villa. Özel plaj erişimi, infinity havuz, BBQ alanı ve tam teşekküllü akıllı ev sistemi ile donatılmıştır.",
    descriptionEn: "Beachfront 5-bedroom luxury villa. Equipped with private beach access, infinity pool, BBQ area and full smart home system.",
    descriptionFa: "ویلای لوکس ۵ خوابه در لب ساحل. مجهز به دسترسی خصوصی به ساحل، استخر بی‌نهایت، فضای باربیکیو و سیستم خانه هوشمند کامل.",
    descriptionRu: "Роскошная 5-спальная вилла на первой линии. Частный пляж, бассейн инфинити, зона барбекю и полная система умного дома.",
    type: "sale",
    category: "villa",
    price: 750000,
    currency: "GBP",
    bedrooms: 5,
    bathrooms: 4,
    area: 380,
    city: "iskele",
    district: "Bafra",
    address: "Bafra Beach Road, Iskele",
    lat: 35.3154,
    lng: 33.9567,
    images: [
      "https://images.pexels.com/photos/29702291/pexels-photo-29702291.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/29702290/pexels-photo-29702290.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/35069530/pexels-photo-35069530.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["pool", "garden", "parking", "security", "sea_view", "smart_home", "bbq", "beach_access"],
    isFeatured: true,
    agentId: 1,
    createdAt: "2025-03-01T10:00:00Z",
  },
  {
    id: 7,
    slug: "commercial-shop-kyrenia-harbor",
    titleTr: "Girne Limanı'nda Ticari Dükkan",
    titleEn: "Commercial Shop at Kyrenia Harbor",
    titleFa: "مغازه تجاری در بندر گیرنه",
    titleRu: "Коммерческий магазин в порту Кирении",
    descriptionTr: "Girne'nin tarihi limanında bulunan bu ticari mülk, restorana, kafeye veya perakende mağazasına dönüştürülebilir. Yüksek yaya trafiği ve turist akını ile mükemmel gelir potansiyeli.",
    descriptionEn: "This commercial property at Kyrenia's historic harbor can be converted to restaurant, cafe or retail store. Excellent income potential with high foot traffic and tourist flow.",
    descriptionFa: "این ملک تجاری در بندر تاریخی گیرنه قابل تبدیل به رستوران، کافه یا فروشگاه خرده‌فروشی است. پتانسیل درآمد عالی با ترافیک بالای عابر پیاده و جریان گردشگر.",
    descriptionRu: "Коммерческая недвижимость в историческом порту Кирении может быть переоборудована в ресторан, кафе или магазин. Отличный потенциал дохода благодаря высокому пешеходному и туристическому потоку.",
    type: "sale",
    category: "commercial",
    price: 280000,
    currency: "GBP",
    bedrooms: 0,
    bathrooms: 1,
    area: 120,
    city: "kyrenia",
    district: "Harbor",
    address: "Kyrenia Old Harbor",
    lat: 35.3408,
    lng: 33.3183,
    images: [
      "https://images.pexels.com/photos/8146214/pexels-photo-8146214.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["road_access", "parking", "high_ceiling", "storage"],
    isFeatured: false,
    agentId: 3,
    createdAt: "2025-03-05T10:00:00Z",
  },
  {
    id: 8,
    slug: "3-bedroom-rental-kyrenia",
    titleTr: "Girne'de Kiralık 3+1 Daire",
    titleEn: "3+1 Apartment for Rent in Kyrenia",
    titleFa: "آپارتمان ۳+۱ اجاره‌ای در گیرنه",
    titleRu: "Квартира 3+1 в аренду в Кирении",
    descriptionTr: "Girne merkezde tam mobilyalı 3+1 daire. Deniz manzaralı, klimalı, kapalı otoparklı. Ailelere uygun, uzun dönem kiralık.",
    descriptionEn: "Fully furnished 3+1 apartment in Kyrenia center. Sea view, air conditioning, covered parking. Family-friendly, long-term rental.",
    descriptionFa: "آپارتمان ۳+۱ کاملاً مبله در مرکز گیرنه. منظره دریا، تهویه مطبوع، پارکینگ سرپوشیده. مناسب خانواده، اجاره بلندمدت.",
    descriptionRu: "Полностью меблированная квартира 3+1 в центре Кирении. Вид на море, кондиционер, крытая парковка. Подходит для семей, долгосрочная аренда.",
    type: "rent",
    category: "apartment",
    price: 1200,
    currency: "GBP",
    bedrooms: 3,
    bathrooms: 2,
    area: 130,
    city: "kyrenia",
    district: "Center",
    address: "Kyrenia Center",
    lat: 35.3366,
    lng: 33.3178,
    images: [
      "https://images.pexels.com/photos/8089172/pexels-photo-8089172.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/7173666/pexels-photo-7173666.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    features: ["sea_view", "furnished", "air_conditioning", "parking", "elevator"],
    isFeatured: true,
    agentId: 2,
    createdAt: "2025-03-10T10:00:00Z",
  },
];

// Feature labels in all 4 languages
export const featureLabels: Record<string, { en: string; tr: string; fa: string; ru: string }> = {
  pool: { en: "Swimming Pool", tr: "Yüzme Havuzu", fa: "استخر شنا", ru: "Бассейн" },
  garden: { en: "Garden", tr: "Bahçe", fa: "باغ", ru: "Сад" },
  parking: { en: "Parking", tr: "Otopark", fa: "پارکینگ", ru: "Парковка" },
  security: { en: "24/7 Security", tr: "7/24 Güvenlik", fa: "امنیت ۲۴/۷", ru: "Охрана 24/7" },
  sea_view: { en: "Sea View", tr: "Deniz Manzarası", fa: "منظره دریا", ru: "Вид на море" },
  central_heating: { en: "Central Heating", tr: "Merkezi Isıtma", fa: "گرمایش مرکزی", ru: "Центральное отопление" },
  air_conditioning: { en: "Air Conditioning", tr: "Klima", fa: "تهویه مطبوع", ru: "Кондиционер" },
  balcony: { en: "Balcony", tr: "Balkon", fa: "بالکن", ru: "Балкон" },
  elevator: { en: "Elevator", tr: "Asansör", fa: "آسانسور", ru: "Лифт" },
  furnished: { en: "Furnished", tr: "Mobilyalı", fa: "مبله", ru: "Меблированная" },
  internet: { en: "Internet", tr: "İnternet", fa: "اینترنت", ru: "Интернет" },
  terrace: { en: "Terrace", tr: "Teras", fa: "تراس", ru: "Терраса" },
  jacuzzi: { en: "Jacuzzi", tr: "Jakuzi", fa: "جکوزی", ru: "Джакузи" },
  gym: { en: "Gym", tr: "Spor Salonu", fa: "سالن ورزش", ru: "Спортзал" },
  smart_home: { en: "Smart Home", tr: "Akıllı Ev", fa: "خانه هوشمند", ru: "Умный дом" },
  bbq: { en: "BBQ Area", tr: "BBQ Alanı", fa: "فضای باربیکیو", ru: "Зона барбекю" },
  beach_access: { en: "Beach Access", tr: "Plaj Erişimi", fa: "دسترسی به ساحل", ru: "Доступ к пляжу" },
  road_access: { en: "Road Access", tr: "Yol Erişimi", fa: "دسترسی به جاده", ru: "Подъезд" },
  water: { en: "Water Supply", tr: "Su Bağlantısı", fa: "آبرسانی", ru: "Водоснабжение" },
  electricity: { en: "Electricity", tr: "Elektrik", fa: "برق", ru: "Электричество" },
  planning_permission: { en: "Planning Permission", tr: "İmar İzni", fa: "مجوز ساخت", ru: "Разрешение на стройку" },
  high_ceiling: { en: "High Ceiling", tr: "Yüksek Tavan", fa: "سقف بلند", ru: "Высокие потолки" },
  storage: { en: "Storage", tr: "Depo", fa: "انبار", ru: "Кладовая" },
};
