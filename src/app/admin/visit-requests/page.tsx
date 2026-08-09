import AdminPageLayout from "@/components/admin/AdminPageLayout";
import StaffVisitRequestsManager from "@/components/admin/StaffVisitRequestsManager";

export const metadata = {
  title: "درخواست‌های بازدید | پنل مدیریت",
};

export default function AdminVisitRequestsPage() {
  return (
    <AdminPageLayout title="درخواست‌های بازدید" backHref="/admin">
      <StaffVisitRequestsManager />
    </AdminPageLayout>
  );
}
