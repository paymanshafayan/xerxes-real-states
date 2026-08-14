"use client";

import { useEffect, useState } from "react";
import { X, HelpCircle, BookOpen, ChevronRight, ArrowLeft } from "lucide-react";

interface Props {
  section: string | null;
  onClose: () => void;
}

const helpContent: Record<string, { title: string; steps: { title: string; desc: string }[] }> = {
  dashboard: {
    title: "Dashboard",
    steps: [
      { title: "Overview", desc: "The dashboard shows key statistics including total properties, inquiries, agents and current data source." },
      { title: "Platform Features", desc: "A complete overview of all Xerxes capabilities including 4-language support, maps, chat, CRM, payments and more." },
      { title: "Data Source", desc: "Shows whether the site is reading from sample data file or the PostgreSQL database." },
    ],
  },
  properties: {
    title: "Property Management",
    steps: [
      { title: "View Properties", desc: "See all properties in a table with image, title, type, price and city." },
      { title: "Add Property", desc: "Click '+ Add Property' to open the form. Fill in titles and descriptions in all 4 languages (EN, TR, FA, RU)." },
      { title: "Upload Images", desc: "Use the drag & drop uploader or paste image URLs. First image becomes the cover photo. Drag to reorder." },
      { title: "Select Features", desc: "Click feature tags (Pool, Garden, etc.) to toggle them on/off for the property." },
      { title: "Generate Slug", desc: "Click 'Generate' to auto-create a URL-friendly slug from the English title." },
      { title: "Edit / Delete", desc: "Use the edit and delete icon buttons in the table to modify or remove properties." },
    ],
  },
  user_listings: {
    title: "User Property Listings",
    steps: [
      { title: "Review Submissions", desc: "View property listings submitted by website users and customers awaiting approval." },
      { title: "Approve or Reject", desc: "Open any listing to review all details, photos, and location, then approve to publish or reject with a reason." },
      { title: "Staff Reassignment", desc: "Manage staff assignment and reassign requests for user-submitted listings." },
    ],
  },
  visit_requests: {
    title: "Visit Requests",
    steps: [
      { title: "Kanban Board", desc: "Track customer visit requests across stages: Pending, Under Review, Owner Contacted, Scheduled, Completed." },
      { title: "Schedule Appointments", desc: "Set visit date/time and notify the customer and property owner." },
      { title: "Block Spam/Unavailable", desc: "If an owner is unavailable or spamming, report and manage blocked accounts." },
    ],
  },
  blocked_users: {
    title: "Blocked Users",
    steps: [
      { title: "View Blocked Accounts", desc: "See users blocked for spam, fake listings, or repeated unavailability." },
      { title: "Reason & History", desc: "Check why and when an account was blocked and which staff member reported it." },
      { title: "Unblock Accounts", desc: "Managers can unblock accounts and restore access with an administrative note." },
    ],
  },
  app_downloads: {
    title: "App Downloads & APK Distribution",
    steps: [
      { title: "Customer & Staff Apps", desc: "Manage download links and APK files for both Customer App and Staff App." },
      { title: "Direct APK Upload", desc: "Upload a signed Android APK up to 200MB. It is stored in Cloudflare R2 or on the server's persistent download volume (survives redeploys) and served directly." },
      { title: "Store Links", desc: "Add Google Play, Apple App Store, or direct download buttons shown on the public app download page." },
    ],
  },
  agents: {
    title: "Agent Management",
    steps: [
      { title: "View Agents", desc: "See all agents with photo, name, email and bio." },
      { title: "Add Agent", desc: "Click '+ Add Agent' and fill in contact details and bio in all 4 languages." },
      { title: "Photo", desc: "Enter an image URL for the agent's profile photo." },
      { title: "Edit / Delete", desc: "Use Edit and Delete buttons on each agent card." },
    ],
  },
  inquiries: {
    title: "Inquiry Management",
    steps: [
      { title: "View Inquiries", desc: "See all contact form submissions and appointment requests." },
      { title: "Status Tracking", desc: "Each inquiry has a status: New (yellow), Read (blue), Resolved (green)." },
      { title: "Update Status", desc: "Click the eye icon to mark as read, check icon to mark as resolved." },
      { title: "Appointment Requests", desc: "Viewing appointment requests appear with 'VIEWING APPOINTMENT REQUEST' prefix in the message." },
    ],
  },
  live_chat: {
    title: "Live Chat",
    steps: [
      { title: "View Conversations", desc: "Left panel shows all active chat sessions with visitor name, email and last message." },
      { title: "Select a Chat", desc: "Click on a session to see the full conversation." },
      { title: "Reply to Visitors", desc: "Type your message in the reply box and press Enter or click Send. The visitor sees your reply in real-time (3-second polling)." },
      { title: "Bot Messages", desc: "The bot automatically sends welcome messages and basic responses when no agent has replied yet." },
      { title: "How it works", desc: "Visitors start a chat from the floating chat bubble on the website. They enter their name and email first. Messages are stored in the database and both sides poll every 3 seconds for updates." },
    ],
  },
  crm: {
    title: "CRM - Lead Management",
    steps: [
      { title: "Pipeline View", desc: "Top bar shows lead counts by status: New → Contacted → Qualified → Proposal → Negotiation → Won/Lost." },
      { title: "Add Lead", desc: "Click '+ Add Lead' to create a new lead with name, email, phone, source and budget." },
      { title: "Update Status", desc: "Hover over a lead's status badge and click to change it through the pipeline stages." },
      { title: "Sources", desc: "Track where leads come from: Website, Referral, Social Media, Advertisement, Direct." },
    ],
  },
  analytics: {
    title: "Analytics Dashboard",
    steps: [
      { title: "Property Stats", desc: "See total properties, for sale, for rent, and featured counts." },
      { title: "Price Analysis", desc: "View minimum, average and maximum property prices." },
      { title: "By Category", desc: "Bar chart showing property distribution: Villa, Apartment, Land, Commercial." },
      { title: "By City", desc: "Bar chart showing properties per city in Northern Cyprus." },
    ],
  },
  users: {
    title: "User Management",
    steps: [
      { title: "Registered Users", desc: "View all users who have registered on the website." },
      { title: "User Details", desc: "See name, email, phone and registration date for each user." },
    ],
  },
  activity: {
    title: "Activity Log",
    steps: [
      { title: "All Events", desc: "Chronological log of all system actions: logins, property changes, inquiries, etc." },
      { title: "Event Types", desc: "Color-coded icons: Green (create), Blue (update), Red (delete), Purple (login)." },
      { title: "Details", desc: "Each entry shows the action, entity, description and timestamp." },
    ],
  },
  api_keys: {
    title: "API Keys & Integrations",
    steps: [
      { title: "Google Analytics", desc: "Enter your GA Measurement ID (G-XXXXXXXXXX) to enable visitor tracking." },
      { title: "SMTP Email", desc: "Configure SMTP settings for sending real emails (newsletters, confirmations)." },
      { title: "Stripe Payments", desc: "Add your Stripe API keys to enable real payment processing." },
      { title: "Matterport", desc: "Enter Matterport API key for embedded 3D property tours." },
      { title: "Security", desc: "All API keys are stored securely. Never share them publicly." },
    ],
  },
  content: {
    title: "Content Manager",
    steps: [
      { title: "Hero Slider", desc: "Add, remove and reorder homepage slider images. Paste image URLs and alt texts. First image shows first." },
      { title: "Hero Text", desc: "Change the main title and subtitle on the homepage in all 4 languages." },
      { title: "About Section", desc: "Edit 'Why Choose Us' reasons with titles and descriptions." },
      { title: "Contact Information", desc: "Update office address, phone numbers, email addresses, office hours and WhatsApp number." },
      { title: "Social Media", desc: "Add or update links to your social media profiles shown in the footer." },
      { title: "SEO Settings", desc: "Set default meta title, description and social sharing image for the whole site." },
      { title: "Footer Content", desc: "Edit the footer description text and copyright line." },
      { title: "Saving", desc: "Each section has its own Save button. Changes are saved to the database and reflect on the site immediately." },
    ],
  },
  settings: {
    title: "Settings",
    steps: [
      { title: "Data Source", desc: "Toggle between Sample Data (file) and Database (PostgreSQL)." },
      { title: "Seed Database", desc: "Click 'Seed Database' to import all sample properties and agents into PostgreSQL. This won't overwrite existing records." },
    ],
  },
};

export default function AdminHelpGuide({ section, onClose }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(section || null);

  useEffect(() => {
    setActiveSection(section || null);
  }, [section]);

  const content = activeSection ? helpContent[activeSection] : null;
  const allSections = Object.entries(helpContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {content ? `Help: ${content.title}` : "Admin Help Guide"}
              </h2>
              <p className="text-xs text-gray-500">Step-by-step instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          {content ? (
            /* Section-specific help */
            <div className="space-y-4">
              <button
                onClick={() => setActiveSection(null)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all topics
              </button>
              <div className="space-y-4 pt-2">
                {content.steps.map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Full guide - all sections */
            <div className="space-y-3">
              {allSections.map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{val.title}</h3>
                      <p className="text-xs text-gray-500">{val.steps.length} steps</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
