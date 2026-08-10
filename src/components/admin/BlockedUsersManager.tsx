"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { Lock, Unlock, X } from "lucide-react";

interface BlockedUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  blockedByStaffId: number | null;
  createdAt: string;
}

export default function BlockedUsersManager() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<number | null>(null);
  const [unblockReason, setUnblockReason] = useState("");
  const [showModal, setShowModal] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/users?isBlocked=true&limit=100");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUnblock = async (id: number) => {
    if (unblockReason.length < 5) {
      alert("دلیل رفع بلاک باید حداقل ۵ کاراکتر باشد");
      return;
    }
    try {
      setUnblocking(id);
      const res = await adminFetch(`/api/admin/users/${id}/unblock`, {
        method: "POST",
        body: JSON.stringify({ reason: unblockReason }),
      });
      if (res.ok) {
        alert("حساب کاربر رفع بلاک شد");
        setShowModal(null);
        setUnblockReason("");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "خطا");
      }
    } catch (err: any) {
      alert(err?.message);
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Lock className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">کاربران بلاک‌شده</h2>
          <p className="text-sm text-gray-500">{users.length} کاربر</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Lock className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">کاربر بلاک‌شده‌ای نیست</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">کاربر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">دلیل بلاک</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">تاریخ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-700 max-w-md">
                    {u.blockedReason || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.blockedAt ? new Date(u.blockedAt).toLocaleString("en-US") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setShowModal(u.id)}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" />
                      رفع بلاک
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">رفع بلاک کاربر</h3>
              <button onClick={() => setShowModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              ⚠️ آگهی‌های قبلی کاربر به طور خودکار بازنمی‌گردند. کاربر باید دوباره
              آن‌ها را ثبت کند.
            </p>
            <textarea
              value={unblockReason}
              onChange={(e) => setUnblockReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
              placeholder="دلیل رفع بلاک..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
              >
                انصراف
              </button>
              <button
                onClick={() => handleUnblock(showModal)}
                disabled={unblocking === showModal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {unblocking === showModal ? "در حال پردازش..." : "تأیید رفع بلاک"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
