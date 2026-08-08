"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Phone, Mail, Tag, Clock, ChevronDown } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  status: string;
  priority: string;
  propertyInterest: string | null;
  budget: number | null;
  notes: string | null;
  lastContactAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-purple-100 text-purple-700",
  proposal: "bg-indigo-100 text-indigo-700",
  negotiation: "bg-orange-100 text-orange-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

const statusOptions = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

export default function CRMManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<{ total: number; byStatus: Record<string, number> }>({ total: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "website", budget: "", notes: "" });

  const fetchLeads = useCallback(async () => {
    try {
      const res = await adminFetch("/api/crm/leads");
      const data = await res.json();
      setLeads(data.leads || []);
      setSummary(data.summary || { total: 0, byStatus: {} });
    } catch (e) {
      console.error("Failed to fetch leads:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStatus = async (id: number, status: string) => {
    await adminFetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchLeads();
  };

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newLead,
        budget: newLead.budget ? Number(newLead.budget) : undefined,
      }),
    });
    setNewLead({ name: "", email: "", phone: "", source: "website", budget: "", notes: "" });
    setShowAddForm(false);
    fetchLeads();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">CRM - Leads</h2>
            <p className="text-sm text-gray-500">{summary.total} total leads</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
        {statusOptions.map((status) => (
          <div key={status} className="text-center p-2 bg-white border border-gray-200 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{summary.byStatus[status] || 0}</p>
            <p className="text-[10px] text-gray-500 capitalize">{status}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={addLead} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Name" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} required className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
            <input type="email" placeholder="Email" value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})} required className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
            <input type="tel" placeholder="Phone" value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
            <select value={newLead.source} onChange={(e) => setNewLead({...newLead, source: e.target.value})} className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white">
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social">Social Media</option>
              <option value="ad">Advertisement</option>
              <option value="direct">Direct</option>
            </select>
          </div>
          <input type="number" placeholder="Budget (£)" value={newLead.budget} onChange={(e) => setNewLead({...newLead, budget: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
          <div className="flex gap-2">
            <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">Save Lead</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Leads Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Budget</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No leads yet</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${priorityColors[lead.priority]}`} style={{ backgroundColor: "currentColor" }} />
                      <span className="font-medium text-gray-900">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-600"><Mail className="w-3 h-3" />{lead.email}</div>
                      {lead.phone && <div className="flex items-center gap-1 text-gray-500 text-xs"><Phone className="w-3 h-3" />{lead.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500 capitalize"><Tag className="w-3 h-3" />{lead.source}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {lead.budget ? `£${lead.budget.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative group">
                      <button className={`px-2 py-1 rounded text-xs font-medium capitalize flex items-center gap-1 ${statusColors[lead.status] || "bg-gray-100 text-gray-600"}`}>
                        {lead.status}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block w-36">
                        {statusOptions.map((s) => (
                          <button key={s} onClick={() => updateStatus(lead.id, s)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 capitalize">{s}</button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{new Date(lead.createdAt).toLocaleDateString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
