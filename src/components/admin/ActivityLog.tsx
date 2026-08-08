"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  UserPlus,
  Settings,
  Eye,
  Bell,
} from "lucide-react";

interface LogEntry {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  details: string | null;
  userId: number | null;
  userName: string | null;
  ip: string | null;
  createdAt: string;
}

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  login: LogIn,
  register: UserPlus,
  view: Eye,
  seed: Settings,
  setting_change: Settings,
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-600",
  update: "bg-blue-100 text-blue-600",
  delete: "bg-red-100 text-red-600",
  login: "bg-purple-100 text-purple-600",
  register: "bg-indigo-100 text-indigo-600",
  view: "bg-gray-100 text-gray-600",
  seed: "bg-amber-100 text-amber-600",
  setting_change: "bg-amber-100 text-amber-600",
};

export default function ActivityLogComponent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/admin/activity?limit=50")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      })
      .catch((e) => console.error("Failed to fetch logs:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Activity className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Activity Log</h2>
          <p className="text-sm text-gray-500">{total} total events</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No activity recorded yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Actions like login, create, update, delete will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = actionIcons[log.action] || Activity;
            const colorClass = actionColors[log.action] || "bg-gray-100 text-gray-600";

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {log.action}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded capitalize">
                      {log.entity}
                    </span>
                    {log.entityId && (
                      <span className="text-xs text-gray-400">
                        #{log.entityId}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {log.details}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    {log.userName && <span>by {log.userName}</span>}
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
