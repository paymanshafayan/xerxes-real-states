import AdminPageLayout from "@/components/admin/AdminPageLayout";
import BlockedUsersManager from "@/components/admin/BlockedUsersManager";

export const metadata = {
  title: "کاربران بلاک‌شده | پنل مدیریت",
};

export default function AdminBlockedUsersPage() {
  return (
    <AdminPageLayout title="کاربران بلاک‌شده" backHref="/admin">
      <BlockedUsersManager />
    </AdminPageLayout>
  );
}
