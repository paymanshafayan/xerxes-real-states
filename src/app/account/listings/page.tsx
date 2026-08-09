import AppShell from "@/components/AppShell";
import MyListingsContent from "@/components/MyListingsContent";

export const metadata = {
  title: "آگهی‌های من | Xerxes",
  description: "آگهی‌های ملک ثبت‌شده توسط شما",
};

export default function MyListingsPage() {
  return (
    <AppShell>
      <MyListingsContent />
    </AppShell>
  );
}
