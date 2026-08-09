import AdminShell from "@/components/admin/AdminShell";
import ListingReviewContent from "@/components/admin/ListingReviewContent";

export const metadata = {
  title: "بررسی آگهی | پنل مدیریت",
};

export default function AdminListingReviewPage() {
  return (
    <AdminShell>
      <ListingReviewContent />
    </AdminShell>
  );
}
