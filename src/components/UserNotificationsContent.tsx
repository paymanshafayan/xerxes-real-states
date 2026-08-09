"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ArrowRight, Check, CheckCheck } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

export default function UserNotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/");
        return;
      }
      setLoading(true);
      const res = await fetch("/api/user/notifications?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`/api/user/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.readAt);
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">نوتیفیکیشن‌ها</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} خوانده نشده از {notifications.length}
            </p>
          </div>
        </div>
        <Link href="/account" className="flex items-center gap-1 text-gray-600 hover:text-primary text-sm">
          <ArrowRight className="w-4 h-4" />
          بازگشت
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === "all" ? "bg-primary text-white" : "bg-white dark:bg-gray-800"
          }`}
        >
          همه
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === "unread" ? "bg-primary text-white" : "bg-white dark:bg-gray-800"
          }`}
        >
          خوانده نشده ({unreadCount})
        </button>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            علامت‌گذاری همه
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
          <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">نوتیفیکیشنی ندارید</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.readAt && markAsRead(n.id)}
              className={`p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition ${
                !n.readAt ? "border-r-4 border-primary" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString("en-US")}
                  </p>
                </div>
                {!n.readAt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    className="text-gray-400 hover:text-primary"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
