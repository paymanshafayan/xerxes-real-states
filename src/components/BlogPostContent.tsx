"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag, User, Share2 } from "lucide-react";
import type { BlogPost } from "@/lib/data/blogData";
import ShareButtons from "./ShareButtons";

interface BlogPostContentProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogPostContent({ post, relatedPosts }: BlogPostContentProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        Back to Blog
      </Link>

      {/* Hero Image */}
      <div className="rounded-xl overflow-hidden mb-8 aspect-[16/8]">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
        <span className="px-2.5 py-1 bg-primary-light text-primary rounded-md font-medium text-xs">
          {post.category}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-4 h-4" />
          {post.author}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {post.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {post.readTime}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{post.title}</h1>

      {/* Content */}
      <article
        className="prose prose-gray max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t border-gray-200">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm"
          >
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
      </div>

      {/* Share */}
      <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 mb-10">
        <span className="font-semibold text-gray-900">Share this article</span>
        <ShareButtons
          url={typeof window !== "undefined" ? window.location.href : `/blog/${post.slug}`}
          title={post.title}
          description={post.excerpt}
        />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="group"
              >
                <div className="rounded-lg overflow-hidden mb-2 h-32">
                  <img
                    src={related.image}
                    alt={related.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                  {related.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{related.readTime}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
