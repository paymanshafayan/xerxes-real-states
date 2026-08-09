import AdminPageLayout from "@/components/admin/AdminPageLayout";
import UserListingsManager from "@/components/admin/UserListingsManager";

export const metadata = {
  title: "آگهی‌های کاربران | پنل مدیریت Xerxes",
};

export default function AdminUserListingsPage() {
  return (
    <AdminPageLayout title="آگهی‌های کاربران" backHref="/admin">
      <UserListingsManager />
    </AdminPageLayout>
  );
}
