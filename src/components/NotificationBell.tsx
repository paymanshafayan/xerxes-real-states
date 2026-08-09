"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = "" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      setLoading(true);
      const res = await fetch("/api/user/notifications?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      await fetch(`/api/user/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return "همین الان";
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} روز پیش`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label="نوتیفیکیشن‌ها"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-h-[480px] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">نوتیفیکیشن‌ها</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500">{unreadCount} خوانده نشده</span>
            )}
          </div>

          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-pulse">در حال بارگذاری...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">نوتیفیکیشنی ندارید</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition ${
                    !n.readAt ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => !n.readAt && markAsRead(n.id)}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                    {!n.readAt && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                        className="text-gray-400 hover:text-blue-500"
                        title="علامت‌گذاری به‌خوانده‌شده"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center">
            <a
              href="/account/notifications"
              className="text-sm text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              مشاهده همه
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
