import AppShell from "@/components/AppShell";
import SavedSearchesContent from "@/components/SavedSearchesContent";

export const metadata = {
  title: "Saved Searches",
  description: "Your saved property searches and alerts",
};

export default function SavedSearchesPage() {
  return (
    <AppShell>
      <SavedSearchesContent />
    </AppShell>
  );
}
