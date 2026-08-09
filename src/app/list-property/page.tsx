import AppShell from "@/components/AppShell";
import ListPropertyContent from "@/components/ListPropertyContent";

export const metadata = {
  title: "ثبت ملک | Xerxes",
  description: "ملک خود را برای فروش یا اجاره ثبت کنید",
};

export default function ListPropertyPage() {
  return (
    <AppShell>
      <ListPropertyContent />
    </AppShell>
  );
}
