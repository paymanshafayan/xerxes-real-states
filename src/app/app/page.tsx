import AppShell from "@/components/AppShell";
import AppDownloadPage from "@/components/AppDownloadPage";
import { getStaticContentSection } from "@/lib/staticContent";
import { parseAppDownloadConfig } from "@/lib/appDownloads";

// Store links are changed from the admin panel, so never cache this page at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Xerxes App | Northern Cyprus Real Estate",
  description: "Download the Xerxes customer app for Northern Cyprus properties.",
};

export default async function CustomerAppPage() {
  const downloads = await getStaticContentSection("app_downloads");
  return <AppShell><AppDownloadPage config={parseAppDownloadConfig(downloads.client)} /></AppShell>;
}
