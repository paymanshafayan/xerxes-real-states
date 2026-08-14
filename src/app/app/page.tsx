import AppShell from "@/components/AppShell";
import AppDownloadPage from "@/components/AppDownloadPage";
import { getCustomerDownloadConfig } from "@/lib/appDownloadServer";

// Store links are changed from the admin panel, so never cache this page at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Xerxes App | Northern Cyprus Real Estate",
  description: "Download the Xerxes customer app for Northern Cyprus properties.",
};

export default async function CustomerAppPage() {
  const downloads = await getCustomerDownloadConfig();
  return <AppShell><AppDownloadPage config={downloads} /></AppShell>;
}
