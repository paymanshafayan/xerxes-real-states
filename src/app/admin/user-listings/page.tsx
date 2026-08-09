import AdminShell from "@/components/admin/AdminShell";
import UserListingsManager from "@/components/admin/UserListingsManager";

export const metadata = {
  title: "آگهی‌های کاربران | پنل مدیریت Xerxes",
};

export default function AdminUserListingsPage() {
  return (
    <AdminShell>
      <UserListingsManager />
    </AdminShell>
  );
}
