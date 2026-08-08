"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Tag, ArrowRight, Search } from "lucide-react";
import { useLocale } from "./AppShell";
import { blogPosts, blogCategories } from "@/lib/data/blogData";

export default function BlogContent() {
  const { dict, locale } = useLocale();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {locale === "fa" ? "بلاگ" : locale === "tr" ? "Blog" : locale === "ru" ? "Блог" : "Blog"}
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          {locale === "fa"
            ? "آخرین اخبار، راهنماها و تحلیل‌های بازار مسکن قبرس شمالی"
            : locale === "tr"
            ? "Kuzey Kıbrıs emlak piyasası hakkında son haberler, rehberler ve analizler"
            : locale === "ru"
            ? "Последние новости, руководства и аналитика рынка недвижимости Северного Кипра"
            : "Latest news, guides, and analysis from the Northern Cyprus property market"}
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Search className="w-4 h-4 mx-3 my-auto text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 py-2.5 text-sm border-0 focus:outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {blogCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeCategory === cat
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="px-2 py-1 bg-primary-light text-primary rounded-md font-medium">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
