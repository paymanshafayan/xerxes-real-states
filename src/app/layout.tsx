import type { Metadata, Viewport } from "next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getConfigValue } from "@/lib/runtimeConfig";
import { getStaticContentSection } from "@/lib/staticContent";
import { SiteContentProvider } from "@/components/SiteContentProvider";
import SetupGate from "@/components/SetupGate";
import "./globals.css";

const DEFAULT_TITLE = "Xerxes Real Estate | Buy, Rent & Invest in Northern Cyprus";
const DEFAULT_DESCRIPTION =
  "Find your dream property in Northern Cyprus. Luxury villas, modern apartments, land and commercial properties for sale and rent. Multilingual support in English, Turkish, Persian, and Russian.";
const DEFAULT_OG_IMAGE =
  "https://images.pexels.com/photos/29702273/pexels-photo-29702273.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getStaticContentSection("seo");
  const title = (seo.meta_title as string) || DEFAULT_TITLE;
  const description = (seo.meta_description as string) || DEFAULT_DESCRIPTION;
  const ogImage = (seo.og_image as string) || DEFAULT_OG_IMAGE;

  return {
    title: {
      default: title,
      template: "%s | Xerxes Real Estate",
    },
    description,
    keywords: [
      "Northern Cyprus real estate",
      "Cyprus property",
      "buy property Cyprus",
      "rent Cyprus",
      "Kyrenia homes",
      "Famagusta apartments",
      "Nicosia real estate",
      "TRNC property",
      "Mediterranean villa",
      "investment Cyprus",
    ],
    authors: [{ name: "Xerxes Real Estate" }],
    creator: "Xerxes Real Estate",
    publisher: "Xerxes Real Estate",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL("https://xerxes.com"),
    alternates: {
      canonical: "/",
      languages: {
        "en": "/",
        "tr": "/?lang=tr",
        "fa": "/?lang=fa",
        "ru": "/?lang=ru",
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://xerxes.com",
      siteName: "Xerxes Real Estate",
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Xerxes - Northern Cyprus Real Estate",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "google-site-verification-code",
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/logo.png", type: "image/png", sizes: "512x512" },
      ],
      apple: "/icons/icon-192x192.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1a56db",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [gaId, contactInfo, social, footer, about] = await Promise.all([
    getConfigValue("NEXT_PUBLIC_GA_ID"),
    getStaticContentSection("contact_info"),
    getStaticContentSection("social"),
    getStaticContentSection("footer"),
    getStaticContentSection("about"),
  ]);
  const siteContent = {
    contact_info: contactInfo as Record<string, string>,
    social: social as Record<string, string>,
    footer: footer as Record<string, string>,
    about: about as Record<string, string>,
  };
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Xerxes" />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <SetupGate />
        <GoogleAnalytics measurementId={gaId} />
        <SiteContentProvider content={siteContent}>{children}</SiteContentProvider>
      </body>
    </html>
  );
}
