import AppShell from "@/components/AppShell";
import MyListingDetailContent from "@/components/MyListingDetailContent";

export const metadata = {
  title: "جزئیات آگهی | Xerxes",
};

export default function MyListingDetailPage() {
  return (
    <AppShell>
      <MyListingDetailContent />
    </AppShell>
  );
}
