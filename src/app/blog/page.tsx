import AppShell from "@/components/AppShell";
import BlogContent from "@/components/BlogContent";

export const metadata = {
  title: "Blog | Northern Cyprus Real Estate News & Tips",
  description: "Stay informed about the Northern Cyprus property market. Expert tips, investment guides, market analysis, and lifestyle articles.",
};

export default function BlogPage() {
  return (
    <AppShell>
      <BlogContent />
    </AppShell>
  );
}
