"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  Settings,
  LogIn,
  LogOut,
  Database,
  FileText,
  RefreshCw,
  Eye,
  CheckCircle,
  Users,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  Activity,
  UserCheck,
  Briefcase,
  CreditCard,
} from "lucide-react";
import { useLocale } from "./AppShell";
import type { SampleProperty, SampleAgent } from "@/lib/data/sampleData";
import PropertyForm from "./admin/PropertyForm";
import AgentForm from "./admin/AgentForm";
import AnalyticsDashboard from "./admin/AnalyticsDashboard";
import UsersManager from "./admin/UsersManager";
import ActivityLogComponent from "./admin/ActivityLog";
import CRMManager from "./admin/CRMManager";
import LiveChatAdmin from "./admin/LiveChatAdmin";

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

export default function AdminPanel() {
  const { dict } = useLocale();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<SampleProperty[]>([]);
  const [agentsList, setAgentsList] = useState<SampleAgent[]>([]);
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

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await fetch("/api/inquiries");
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgentsList(data.agents || []);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchInquiries();
      fetchProperties();
      fetchAgents();
    }
  }, [isLoggedIn, fetchStats, fetchInquiries, fetchProperties, fetchAgents]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("admin_token", data.token);
        setIsLoggedIn(true);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Network error");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setIsLoggedIn(false);
  };

  const handleDataSourceChange = async (source: string) => {
    setLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataSource: source }),
      });
      await fetchStats();
    } catch (error) {
      console.error("Failed to change data source:", error);
    }
    setLoading(false);
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedData: true }),
      });
      await fetchStats();
    } catch (error) {
      console.error("Failed to seed data:", error);
    }
    setLoading(false);
  };

  const handleInquiryStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchInquiries();
    } catch (error) {
      console.error("Failed to update inquiry:", error);
    }
  };

  const handleSaveProperty = async (data: Partial<SampleProperty>) => {
    try {
      if (editingProperty) {
        await fetch(`/api/properties/${editingProperty.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      await fetchProperties();
      await fetchStats();
      setShowPropertyForm(false);
      setEditingProperty(null);
    } catch (error) {
      console.error("Failed to save property:", error);
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    try {
      await fetch(`/api/properties?id=${id}`, { method: "DELETE" });
      await fetchProperties();
      await fetchStats();
    } catch (error) {
      console.error("Failed to delete property:", error);
    }
  };

  const handleSaveAgent = async (data: Partial<SampleAgent>) => {
    try {
      if (editingAgent) {
        await fetch(`/api/agents/${editingAgent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      await fetchAgents();
      await fetchStats();
      setShowAgentForm(false);
      setEditingAgent(null);
    } catch (error) {
      console.error("Failed to save agent:", error);
    }
  };

  const handleDeleteAgent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
      await fetchAgents();
      await fetchStats();
    } catch (error) {
      console.error("Failed to delete agent:", error);
    }
  };

  // Login Form
  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{dict.admin.login}</h1>
            <p className="text-sm text-gray-500 mt-1">admin / admin123</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {dict.admin.username}
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {dict.admin.password}
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            {loginError && (
              <p className="text-sm text-danger">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              {dict.admin.login}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{dict.admin.dashboard}</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4" />
          {dict.admin.logout}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: dict.admin.dashboard },
          { id: "properties", icon: Home, label: dict.admin.properties },
          { id: "agents", icon: Users, label: dict.admin.agents },
          { id: "inquiries", icon: MessageSquare, label: dict.admin.inquiries },
          { id: "analytics", icon: BarChart3, label: "Analytics" },
          { id: "live_chat", icon: MessageSquare, label: "Live Chat" },
          { id: "crm", icon: Briefcase, label: "CRM" },
          { id: "users", icon: UserCheck, label: "Users" },
          { id: "activity", icon: Activity, label: "Activity Log" },
          { id: "settings", icon: Settings, label: dict.admin.settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && stats && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.properties}</p>
                  <p className="text-xs text-gray-500">{dict.admin.properties}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.inquiries}</p>
                  <p className="text-xs text-gray-500">{dict.admin.inquiries}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.newInquiries}</p>
                  <p className="text-xs text-gray-500">{dict.admin.new_}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.agents}</p>
                  <p className="text-xs text-gray-500">{dict.admin.agents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Source Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              {dict.admin.dataSource}
            </h3>
            <p className="text-sm text-gray-500">
              {stats.dataSource === "sample"
                ? `📄 ${dict.admin.sampleData}`
                : `🗄️ ${dict.admin.database}`}
            </p>
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{properties.length} properties</p>
            <button
              onClick={() => {
                setEditingProperty(null);
                setShowPropertyForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Image</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600" />
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop) => (
                    <tr key={prop.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <img
                          src={prop.images[0]}
                          alt=""
                          className="w-16 h-10 rounded object-cover"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        {prop.titleEn}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          prop.type === "sale" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {prop.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">£{prop.price.toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize">{prop.city}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingProperty(prop);
                              setShowPropertyForm(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(prop.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Agents Tab */}
      {activeTab === "agents" && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{agentsList.length} agents</p>
            <button
              onClick={() => {
                setEditingAgent(null);
                setShowAgentForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark"
            >
              <Plus className="w-4 h-4" />
              Add Agent
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agentsList.map((agent) => (
              <div key={agent.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={agent.photo}
                    alt={agent.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-xs text-gray-500">{agent.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{agent.bioEn}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingAgent(agent);
                      setShowAgentForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inquiries Tab */}
      {activeTab === "inquiries" && (
        <div className="animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {dict.contact.name}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {dict.contact.email}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {dict.contact.message}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {dict.admin.status}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600" />
                  </tr>
                </thead>
                <tbody>
                  {inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        {dict.property.noResults}
                      </td>
                    </tr>
                  ) : (
                    inquiries.map((inq) => (
                      <tr key={inq.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {inq.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{inq.email}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                          {inq.message}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              inq.status === "new"
                                ? "bg-amber-50 text-amber-700"
                                : inq.status === "read"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {inq.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleInquiryStatus(inq.id, "read")}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleInquiryStatus(inq.id, "resolved")}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Mark as resolved"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="animate-fade-in">
          <AnalyticsDashboard />
        </div>
      )}

      {/* Live Chat Tab */}
      {activeTab === "live_chat" && (
        <div className="animate-fade-in">
          <LiveChatAdmin />
        </div>
      )}

      {/* CRM Tab */}
      {activeTab === "crm" && (
        <div className="animate-fade-in">
          <CRMManager />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="animate-fade-in">
          <UsersManager />
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === "activity" && (
        <div className="animate-fade-in">
          <ActivityLogComponent />
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="animate-fade-in space-y-6 max-w-2xl">
          {/* Data Source Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              {dict.admin.dataSource}
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="dataSource"
                  checked={stats?.dataSource === "sample"}
                  onChange={() => handleDataSourceChange("sample")}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {dict.admin.sampleData}
                    </p>
                    <p className="text-xs text-gray-500">
                      Load data from the sample data file
                    </p>
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="dataSource"
                  checked={stats?.dataSource === "database"}
                  onChange={() => handleDataSourceChange("database")}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {dict.admin.database}
                    </p>
                    <p className="text-xs text-gray-500">
                      Load data from PostgreSQL database
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Seed Database */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Seed Database
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Import sample data into the database. This will not overwrite existing records.
            </p>
            <button
              onClick={handleSeedData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Seeding..." : "Seed Database"}
            </button>
          </div>
        </div>
      )}

      {/* Property Form Modal */}
      {showPropertyForm && (
        <PropertyForm
          property={editingProperty}
          onSave={handleSaveProperty}
          onCancel={() => {
            setShowPropertyForm(false);
            setEditingProperty(null);
          }}
        />
      )}

      {/* Agent Form Modal */}
      {showAgentForm && (
        <AgentForm
          agent={editingAgent}
          onSave={handleSaveAgent}
          onCancel={() => {
            setShowAgentForm(false);
            setEditingAgent(null);
          }}
        />
      )}
    </div>
  );
}
