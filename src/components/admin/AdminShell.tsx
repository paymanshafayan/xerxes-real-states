"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  Settings,
  LogIn,
  LogOut,
  Users,
  BarChart3,
  Activity,
  UserCheck,
  Briefcase,
  CreditCard,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Key,
  Palette,
  Pencil,
  Trash2,
  Eye,
  Check,
  FileText,
  Database,
  Smartphone,
} from "lucide-react";
import AdminDashboardHome from "./AdminDashboardHome";
import AdminHelpGuide from "./AdminHelpGuide";
import AdminApiKeys from "./AdminApiKeys";
import AppDownloadsManager from "./AppDownloadsManager";
import type { SampleProperty, SampleAgent } from "@/lib/data/sampleData";

// Lazy imports for tabs
import PropertyForm from "./PropertyForm";
import AgentForm from "./AgentForm";
import AnalyticsDashboard from "./AnalyticsDashboard";
import UsersManager from "./UsersManager";
import ActivityLogComponent from "./ActivityLog";
import CRMManager from "./CRMManager";
import LiveChatAdmin from "./LiveChatAdmin";
import ContentManager from "./ContentManager";

interface Stats {
  properties: number;
  inquiries: number;
  newInquiries: number;
  agents: number;
  dataSource: string;
}

interface Inquiry {
  id: number;
  propertyId: number | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const sidebarItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "content", icon: Palette, label: "Content" },
  { id: "app_downloads", icon: Smartphone, label: "App Downloads" },
  { id: "properties", icon: Home, label: "Properties" },
  { id: "agents", icon: Users, label: "Agents" },
  { id: "inquiries", icon: MessageSquare, label: "Inquiries" },
  { id: "live_chat", icon: MessageSquare, label: "Live Chat" },
  { id: "crm", icon: Briefcase, label: "CRM" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "users", icon: UserCheck, label: "Users" },
  { id: "activity", icon: Activity, label: "Activity Log" },
  { id: "api_keys", icon: Key, label: "API Keys" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function AdminShell() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [properties, setProperties] = useState<SampleProperty[]>([]);
  const [agentsList, setAgentsList] = useState<SampleAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpSection, setHelpSection] = useState<string | null>(null);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<SampleProperty | null>(null);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SampleAgent | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("admin_token");
      if (token) setIsLoggedIn(true);
    }
  }, []);

  // Attaches the staff bearer token (obtained at login) to requests that hit
  // routes protected by requireStaff on the server.
  const authFetch = useCallback((input: string, init: RequestInit = {}) => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;
    const headers = { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(input, { ...init, headers });
  }, []);

  const fetchStats = useCallback(async () => { try { const res = await authFetch("/api/admin/stats"); setStats(await res.json()); } catch {} }, [authFetch]);
  const fetchInquiries = useCallback(async () => { try { const res = await authFetch("/api/inquiries"); const d = await res.json(); setInquiries(d.inquiries || []); } catch {} }, [authFetch]);
  const fetchProperties = useCallback(async () => { try { const res = await fetch("/api/properties"); const d = await res.json(); setProperties(d.properties || []); } catch {} }, []);
  const fetchAgents = useCallback(async () => { try { const res = await fetch("/api/agents"); const d = await res.json(); setAgentsList(d.agents || []); } catch {} }, []);

  useEffect(() => {
    if (isLoggedIn) { fetchStats(); fetchInquiries(); fetchProperties(); fetchAgents(); }
  }, [isLoggedIn, fetchStats, fetchInquiries, fetchProperties, fetchAgents]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm) });
      const data = await res.json();
      if (data.success) { sessionStorage.setItem("admin_token", data.token); setIsLoggedIn(true); }
      else setLoginError(data.error || "Login failed");
    } catch { setLoginError("Network error"); }
  };

  const handleLogout = () => { sessionStorage.removeItem("admin_token"); setIsLoggedIn(false); };

  const handleDataSourceChange = async (source: string) => {
    setLoading(true);
    await authFetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataSource: source }) });
    await fetchStats(); setLoading(false);
  };

  const handleSeedData = async () => {
    setLoading(true);
    await authFetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seedData: true }) });
    await fetchStats(); setLoading(false);
  };

  const handleInquiryStatus = async (id: number, status: string) => {
    await authFetch(`/api/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await fetchInquiries();
  };

  const handleSaveProperty = async (data: Partial<SampleProperty>) => {
    if (editingProperty) await authFetch(`/api/properties/${editingProperty.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    else await authFetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await fetchProperties(); await fetchStats(); setShowPropertyForm(false); setEditingProperty(null);
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    await authFetch(`/api/properties?id=${id}`, { method: "DELETE" });
    await fetchProperties(); await fetchStats();
  };

  const handleSaveAgent = async (data: Partial<SampleAgent>) => {
    if (editingAgent) await authFetch(`/api/agents/${editingAgent.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    else await authFetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await fetchAgents(); await fetchStats(); setShowAgentForm(false); setEditingAgent(null);
  };

  const handleDeleteAgent = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    await authFetch(`/api/agents?id=${id}`, { method: "DELETE" });
    await fetchAgents(); await fetchStats();
  };

  const openSectionHelp = (section: string) => { setHelpSection(section); setShowHelp(true); };

  // ───── LOGIN ─────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Xerxes Management</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
              <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" placeholder="admin" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" placeholder="••••••••" />
            </div>
            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">Sign In</button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">Default: admin / admin123</p>
        </div>
      </div>
    );
  }

  // ───── ADMIN PANEL ─────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} bg-gray-900 text-white flex flex-col transition-all duration-300 sticky top-0 h-screen`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Xerxes" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <span className="font-bold text-sm text-white">Xerxes</span>
                <span className="text-[9px] text-gray-400 block -mt-0.5">Admin Panel</span>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 text-gray-400 hover:text-white rounded">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                activeTab === item.id ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link href="/" className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}>
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Back to Site</span>}
          </Link>
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}>
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-3">
            <h1 className="text-lg font-semibold text-gray-900 capitalize">
              {sidebarItems.find((i) => i.id === activeTab)?.label || "Dashboard"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openSectionHelp(activeTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-primary border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Help for this section"
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "dashboard" && <AdminDashboardHome stats={stats} />}

          {activeTab === "content" && <ContentManager />}
          {activeTab === "app_downloads" && <AppDownloadsManager />}

          {activeTab === "properties" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{properties.length} properties</p>
                <div className="flex gap-2">
                  <button onClick={() => openSectionHelp("properties")} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"><HelpCircle className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingProperty(null); setShowPropertyForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark">+ Add Property</button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left px-4 py-3 font-medium text-gray-600">Image</th><th className="text-left px-4 py-3 font-medium text-gray-600">Title</th><th className="text-left px-4 py-3 font-medium text-gray-600">Type</th><th className="text-left px-4 py-3 font-medium text-gray-600">Price</th><th className="text-left px-4 py-3 font-medium text-gray-600">City</th><th className="text-left px-4 py-3 font-medium text-gray-600"></th></tr></thead>
                  <tbody>{properties.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3"><img src={p.images[0]} alt="" className="w-16 h-10 rounded object-cover" /></td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{p.titleEn}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${p.type === "sale" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{p.type}</span></td>
                      <td className="px-4 py-3 font-semibold">£{p.price.toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize">{p.city}</td>
                      <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => { setEditingProperty(p); setShowPropertyForm(true); }} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Edit"><Pencil className="w-4 h-4 text-gray-400" /></button><button onClick={() => handleDeleteProperty(p.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Delete"><Trash2 className="w-4 h-4 text-gray-400" /></button></div></td>
                    </tr>
                  ))}</tbody></table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "agents" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{agentsList.length} agents</p>
                <div className="flex gap-2">
                  <button onClick={() => openSectionHelp("agents")} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"><HelpCircle className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingAgent(null); setShowAgentForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark">+ Add Agent</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{agentsList.map((a) => (
                <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3"><img src={a.photo} alt={a.name} className="w-14 h-14 rounded-full object-cover" /><div><h3 className="font-semibold text-gray-900">{a.name}</h3><p className="text-xs text-gray-500">{a.email}</p></div></div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{a.bioEn}</p>
                  <div className="flex gap-2"><button onClick={() => { setEditingAgent(a); setShowAgentForm(true); }} className="flex-1 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">Edit</button><button onClick={() => handleDeleteAgent(a.id)} className="flex-1 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button></div>
                </div>
              ))}</div>
            </div>
          )}

          {activeTab === "inquiries" && (
            <div>
              <div className="flex justify-end mb-4"><button onClick={() => openSectionHelp("inquiries")} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"><HelpCircle className="w-4 h-4" /></button></div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left px-4 py-3 font-medium text-gray-600">Name</th><th className="text-left px-4 py-3 font-medium text-gray-600">Email</th><th className="text-left px-4 py-3 font-medium text-gray-600">Message</th><th className="text-left px-4 py-3 font-medium text-gray-600">Status</th><th className="px-4 py-3" /></tr></thead>
                <tbody>{inquiries.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No inquiries yet</td></tr> : inquiries.map((inq) => (
                  <tr key={inq.id} className="border-t border-gray-100"><td className="px-4 py-3 font-medium text-gray-900">{inq.name}</td><td className="px-4 py-3 text-gray-600">{inq.email}</td><td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{inq.message}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${inq.status === "new" ? "bg-amber-50 text-amber-700" : inq.status === "read" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>{inq.status}</span></td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => handleInquiryStatus(inq.id, "read")} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Read"><Eye className="w-4 h-4 text-gray-400" /></button><button onClick={() => handleInquiryStatus(inq.id, "resolved")} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Resolve"><Check className="w-4 h-4 text-gray-400" /></button></div></td></tr>
                ))}</tbody></table></div>
              </div>
            </div>
          )}

          {activeTab === "live_chat" && <LiveChatAdmin />}
          {activeTab === "crm" && <CRMManager />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
          {activeTab === "users" && <UsersManager />}
          {activeTab === "activity" && <ActivityLogComponent />}
          {activeTab === "api_keys" && <AdminApiKeys />}

          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Data Source</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary"><input type="radio" name="ds" checked={stats?.dataSource === "sample"} onChange={() => handleDataSourceChange("sample")} className="w-4 h-4 text-primary" /><div><p className="font-medium text-gray-900 flex items-center gap-1.5"><FileText className="w-4 h-4 text-gray-400 fill-gray-400" /><span>Sample Data</span></p><p className="text-xs text-gray-500">Load from sample data file</p></div></label>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary"><input type="radio" name="ds" checked={stats?.dataSource === "database"} onChange={() => handleDataSourceChange("database")} className="w-4 h-4 text-primary" /><div><p className="font-medium text-gray-900 flex items-center gap-1.5"><Database className="w-4 h-4 text-gray-400 fill-gray-400" /><span>Database</span></p><p className="text-xs text-gray-500">Load from PostgreSQL</p></div></label>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Seed Database</h3>
                <p className="text-sm text-gray-500 mb-4">Import sample data into the database.</p>
                <button onClick={handleSeedData} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50">{loading ? "Seeding..." : "Seed Database"}</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && <AdminHelpGuide section={helpSection} onClose={() => { setShowHelp(false); setHelpSection(null); }} />}

      {/* Property Form Modal */}
      {showPropertyForm && <PropertyForm property={editingProperty} onSave={handleSaveProperty} onCancel={() => { setShowPropertyForm(false); setEditingProperty(null); }} />}

      {/* Agent Form Modal */}
      {showAgentForm && <AgentForm agent={editingAgent} onSave={handleSaveAgent} onCancel={() => { setShowAgentForm(false); setEditingAgent(null); }} />}
    </div>
  );
}
