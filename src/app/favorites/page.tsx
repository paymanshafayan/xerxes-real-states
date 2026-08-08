import AppShell from "@/components/AppShell";
import FavoritesContent from "@/components/FavoritesContent";

export const metadata = {
  title: "My Favorites",
  description: "Your saved properties in Northern Cyprus",
};

export default function FavoritesPage() {
  return (
    <AppShell>
      <FavoritesContent />
    </AppShell>
  );
}
