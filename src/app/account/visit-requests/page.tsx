import AppShell from "@/components/AppShell";
import MyVisitRequestsContent from "@/components/MyVisitRequestsContent";

export const metadata = {
  title: "درخواست‌های بازدید من | Xerxes",
};

export default function MyVisitRequestsPage() {
  return (
    <AppShell>
      <MyVisitRequestsContent />
    </AppShell>
  );
}
