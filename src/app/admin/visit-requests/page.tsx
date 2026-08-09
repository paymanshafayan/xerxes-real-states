import AdminShell from "@/components/admin/AdminShell";
import StaffVisitRequestsManager from "@/components/admin/StaffVisitRequestsManager";

export const metadata = {
  title: "درخواست‌های بازدید | پنل مدیریت",
};

export default function AdminVisitRequestsPage() {
  return (
    <AdminShell>
      <StaffVisitRequestsManager />
    </AdminShell>
  );
}
