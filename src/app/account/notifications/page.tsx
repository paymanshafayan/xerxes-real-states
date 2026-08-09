import AppShell from "@/components/AppShell";
import UserNotificationsContent from "@/components/UserNotificationsContent";

export const metadata = {
  title: "نوتیفیکیشن‌ها | Xerxes",
};

export default function UserNotificationsPage() {
  return (
    <AppShell>
      <UserNotificationsContent />
    </AppShell>
  );
}
