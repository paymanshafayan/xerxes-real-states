import AppShell from "@/components/AppShell";
import AccountContent from "@/components/AccountContent";

export const metadata = {
  title: "My Account",
  description: "Manage your Xerxes account settings",
};

export default function AccountPage() {
  return (
    <AppShell>
      <AccountContent />
    </AppShell>
  );
}
