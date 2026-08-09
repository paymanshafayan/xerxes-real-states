"use client";

import {
  Home,
  MessageSquare,
  Users,
  Globe,
  Shield,
  Zap,
  BarChart3,
  Languages,
  Map,
  Heart,
  CreditCard,
  Briefcase,
  Bell,
  Camera,
  Calendar,
  Search,
  FileText,
  Database,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface Props {
  stats: {
    properties: number;
    inquiries: number;
    newInquiries: number;
    agents: number;
    dataSource: string;
  } | null;
  onDataSourceChange?: (source: string) => Promise<void>;
  loading?: boolean;
}

export default function AdminDashboardHome({
  stats,
  onDataSourceChange,
  loading = false,
}: Props) {
  const currentSource = stats?.dataSource || "sample";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to Xerxes Admin Panel</h1>
        <p className="text-white/80 text-sm max-w-2xl">
          Manage your Northern Cyprus real estate platform. Control properties, agents, inquiries, CRM, live chat, analytics and more from this centralized dashboard.
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.properties}</p>
                <p className="text-xs text-gray-500">Properties</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inquiries}</p>
                <p className="text-xs text-gray-500">Inquiries</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.newInquiries}</p>
                <p className="text-xs text-gray-500">New</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.agents}</p>
                <p className="text-xs text-gray-500">Agents</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Switcher Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Data Source Mode</span>
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  currentSource === "database"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentSource === "database" ? "PostgreSQL Database" : "Sample Data"}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Switch whether web and mobile apps read data from static sample data or PostgreSQL database (with auto-fallback to sample data if database is empty).
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => onDataSourceChange?.("sample")}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3.5 ${
              currentSource === "sample"
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                currentSource === "sample"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 text-sm">Sample Data Mode</p>
                {currentSource === "sample" && (
                  <span className="text-xs font-bold text-primary uppercase">Active</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Reads verified sample properties and agent listings directly from file.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onDataSourceChange?.("database")}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3.5 ${
              currentSource === "database"
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                currentSource === "database"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 text-sm">PostgreSQL Database</p>
                {currentSource === "database" && (
                  <span className="text-xs font-bold text-primary uppercase">Active</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Live database storage for properties and agents. Falls back to sample data if empty.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Platform Features Overview */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Platform Features</h2>
        <p className="text-sm text-gray-500 mb-6">Complete overview of Xerxes capabilities</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Languages, title: "4-Language Support", desc: "English, Turkish, Persian (RTL), Russian", color: "blue" },
            { icon: Home, title: "Property Management", desc: "Full CRUD with 4-language content, images, features", color: "green" },
            { icon: Map, title: "Interactive Maps", desc: "Leaflet maps with property markers and city views", color: "indigo" },
            { icon: Search, title: "Advanced Search", desc: "Filter by type, category, city, price, bedrooms", color: "purple" },
            { icon: Heart, title: "Favorites & Compare", desc: "Save properties, compare up to 4 side by side", color: "red" },
            { icon: MessageSquare, title: "Live Chat", desc: "Real-time chat between visitors and agents", color: "sky" },
            { icon: BarChart3, title: "Analytics", desc: "Page views, property stats, visitor tracking", color: "amber" },
            { icon: Briefcase, title: "CRM System", desc: "Lead management with pipeline and status tracking", color: "emerald" },
            { icon: CreditCard, title: "Payment System", desc: "Deposit and booking payments with transaction tracking", color: "violet" },
            { icon: Camera, title: "360° Virtual Tours", desc: "Canvas-based panorama viewer with drag-to-rotate", color: "pink" },
            { icon: Calendar, title: "Appointment Booking", desc: "Schedule property viewings with date/time picker", color: "orange" },
            { icon: Globe, title: "SEO & PWA", desc: "Schema.org, sitemap, offline support, installable app", color: "teal" },
            { icon: Shield, title: "Authentication", desc: "User registration, login, admin panel with bcrypt", color: "gray" },
            { icon: Bell, title: "Notifications", desc: "Email alerts, newsletter, saved search notifications", color: "rose" },
            { icon: Zap, title: "Performance", desc: "In-memory cache, image optimization, smart loading", color: "yellow" },
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className={`w-10 h-10 rounded-lg bg-${feature.color}-50 flex items-center justify-center shrink-0`}>
                <feature.icon className={`w-5 h-5 text-${feature.color}-600`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
