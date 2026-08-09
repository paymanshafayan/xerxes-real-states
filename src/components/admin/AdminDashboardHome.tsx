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
} from "lucide-react";

interface Props {
  stats: {
    properties: number;
    inquiries: number;
    newInquiries: number;
    agents: number;
    dataSource: string;
  } | null;
}

export default function AdminDashboardHome({ stats }: Props) {
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
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><Home className="w-6 h-6 text-blue-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.properties}</p><p className="text-xs text-gray-500">Properties</p></div></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-green-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.inquiries}</p><p className="text-xs text-gray-500">Inquiries</p></div></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><Bell className="w-6 h-6 text-amber-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.newInquiries}</p><p className="text-xs text-gray-500">New</p></div></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center"><Users className="w-6 h-6 text-purple-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.agents}</p><p className="text-xs text-gray-500">Agents</p></div></div>
          </div>
        </div>
      )}

      {/* Platform Features Overview */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
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

      {/* Data Source */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">Data Source:</span>
            {stats.dataSource === "sample" ? (
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-gray-400 fill-gray-400" />
                <span>Sample Data File</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4 text-gray-400 fill-gray-400" />
                <span>PostgreSQL Database</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
