import AdminPageLayout from "@/components/admin/AdminPageLayout";
import ListingReviewContent from "@/components/admin/ListingReviewContent";

export const metadata = {
  title: "بررسی آگهی | پنل مدیریت",
};

export default function AdminListingReviewPage() {
  return (
    <AdminPageLayout title="بررسی آگهی" backHref="/admin/user-listings">
      <ListingReviewContent />
    </AdminPageLayout>
  );
}
