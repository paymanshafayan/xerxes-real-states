import AdminShell from "@/components/admin/AdminShell";
import BlockedUsersManager from "@/components/admin/BlockedUsersManager";

export const metadata = {
  title: "کاربران بلاک‌شده | پنل مدیریت",
};

export default function AdminBlockedUsersPage() {
  return (
    <AdminShell>
      <BlockedUsersManager />
    </AdminShell>
  );
}
