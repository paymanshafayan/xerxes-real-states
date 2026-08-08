import { http } from "./client";
import { persistAuth, clearAuth, type Staff } from "../store/auth";

export type { Staff };

export interface PropertyMedia {
  images: string[];
  panoramas: string[];
  videos: string[];
  audioNotes: string[];
  documents: string[];
  virtualTourUrl?: string | null;
}

export interface Property extends PropertyMedia {
  id: number;
  slug: string;
  titleEn: string;
  titleFa: string;
  titleTr: string;
  titleRu: string;
  descriptionEn?: string;
  descriptionFa?: string;
  descriptionTr?: string;
  descriptionRu?: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  district?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  features: string[];
  isFeatured: boolean;
  agentId?: number | null;
  createdAt?: string;
}

export interface ChatSession {
  id: number;
  sessionId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  status: string;
  assignedStaffId?: number | null;
  unreadCount?: number;
  lastMessage?: string | null;
  messageCount?: number;
  lastMessageAt?: string | null;
  createdAt?: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  sender: string;
  senderId?: number | null;
  senderName?: string | null;
  message: string;
  type?: string;
  mediaUrl?: string | null;
  durationSec?: number | null;
  readAt?: string | null;
  createdAt: string;
}

// ---------- Auth ----------
export async function login(username: string, password: string) {
  const { data } = await http.post("/api/staff/login", { username, password });
  if (data?.success && data?.token) {
    persistAuth(data.token, data.staff as Staff);
  }
  return data;
}

export function logout() {
  clearAuth();
}

// ---------- Staff ----------
export async function getMe() {
  const { data } = await http.get("/api/staff/me");
  return data.staff as Staff;
}

export async function listStaff() {
  const { data } = await http.get("/api/staff");
  return (data.staff ?? []) as Staff[];
}

export async function createStaff(payload: Record<string, unknown> & { password: string }) {
  const { data } = await http.post("/api/staff", payload);
  return data;
}

export async function updateStaff(
  id: number,
  payload: Record<string, unknown>
) {
  const { data } = await http.put(`/api/staff?id=${id}`, payload);
  return data;
}

export async function deleteStaff(id: number) {
  const { data } = await http.delete(`/api/staff?id=${id}`);
  return data;
}

// ---------- Properties ----------
export async function listProperties(params: Record<string, any> = {}) {
  const { data } = await http.get("/api/staff/properties", { params });
  return (data.properties ?? []) as Property[];
}

export async function getProperty(id: number) {
  const { data } = await http.get(`/api/staff/properties/${id}`);
  return data.property as Property;
}

export async function createProperty(payload: Partial<Property>) {
  const { data } = await http.post("/api/staff/properties", payload);
  return data;
}

export async function updateProperty(id: number, payload: Partial<Property>) {
  const { data } = await http.put(`/api/staff/properties/${id}`, payload);
  return data;
}

export async function deleteProperty(id: number) {
  const { data } = await http.delete(`/api/staff/properties/${id}`);
  return data;
}

// ---------- Media upload ----------
export async function uploadFiles(
  files: FormData,
  onProgress?: (pct: number) => void
) {
  const { data } = await http.post("/api/upload", files, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e: any) => {
      if (onProgress && e.total)
        onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

export async function requestPresign(
  filename: string,
  contentType: string,
  type: string
) {
  try {
    const { data } = await http.post("/api/media/presign", {
      filename,
      contentType,
      type,
    });
    return data;
  } catch {
    return null;
  }
}

// ---------- Chat ----------
export async function listChatSessions() {
  const { data } = await http.get("/api/staff/chat/sessions");
  return (data.sessions ?? []) as ChatSession[];
}

export async function getChatMessages(sessionId: string, after?: number) {
  const { data } = await http.get(
    `/api/staff/chat/sessions/${sessionId}/messages`,
    { params: after ? { after } : {} }
  );
  return (data.messages ?? []) as ChatMessage[];
}

export async function sendChatMessage(
  sessionId: string,
  payload: {
    message?: string;
    type?: string;
    mediaUrl?: string;
    durationSec?: number;
  }
) {
  const { data } = await http.post(
    `/api/staff/chat/sessions/${sessionId}/messages`,
    payload
  );
  return data;
}

export async function chatSessionAction(
  sessionId: string,
  action: "open" | "close" | "assign",
  assignedStaffId?: number
) {
  const { data } = await http.post("/api/staff/chat/sessions", {
    sessionId,
    action,
    assignedStaffId,
  });
  return data;
}

// ---------- Translate / Transcribe ----------
export async function translateAll(text: string, from = "fa") {
  const { data } = await http.post("/api/translate", { text, from });
  return data.translations as Record<string, string>;
}

export async function transcribeAudio(form: FormData) {
  const { data } = await http.post("/api/transcribe", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (data.text ?? "") as string;
}

// ---------- CRM / Appointments (existing endpoints) ----------
export async function listLeads() {
  try {
    const { data } = await http.get("/api/crm/leads");
    return (data.leads ?? []) as any[];
  } catch {
    return [];
  }
}

export async function listAppointments() {
  try {
    const { data } = await http.get("/api/appointments");
    return (data.appointments ?? data.bookings ?? []) as any[];
  } catch {
    return [];
  }
}

export async function listInquiries() {
  try {
    const { data } = await http.get("/api/inquiries");
    return (data.inquiries ?? []) as any[];
  } catch {
    return [];
  }
}

export async function getStats() {
  try {
    const { data } = await http.get("/api/admin/stats");
    return data;
  } catch {
    return null;
  }
}

// ---------- Staff self-service ----------
export async function updateMe(payload: Record<string, unknown>) {
  const { data } = await http.put("/api/staff/me", payload);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await http.post("/api/staff/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
}

// ---------- Inquiries ----------
export async function updateInquiryStatus(id: number, status: string) {
  const { data } = await http.patch(`/api/inquiries/${id}`, { status });
  return data;
}

// ---------- CRM Leads ----------
export async function createLead(payload: Record<string, unknown>) {
  const { data } = await http.post("/api/crm/leads", payload);
  return data;
}

export async function updateLead(id: number, payload: Record<string, unknown>) {
  const { data } = await http.patch(`/api/crm/leads/${id}`, payload);
  return data;
}

// ---------- Appointments ----------
export async function createAppointment(payload: Record<string, unknown>) {
  const { data } = await http.post("/api/appointments", payload);
  return data;
}

export async function updateAppointment(id: number, status: string) {
  const { data } = await http.patch(`/api/appointments/${id}`, { status });
  return data;
}

export async function deleteAppointment(id: number) {
  const { data } = await http.delete(`/api/appointments/${id}`);
  return data;
}

// ---------- Property delete (wrapper) ----------
export async function deleteExistingProperty(id: number) {
  return deleteProperty(id);
}

// ---------- Activity log (manager) ----------
export async function listActivity() {
  try {
    const { data } = await http.get("/api/admin/activity");
    return (data.activities ?? []) as any[];
  } catch {
    return [];
  }
}

// ---------- Agents directory ----------
export async function listAgents() {
  try {
    const { data } = await http.get("/api/agents");
    return (data.agents ?? []) as any[];
  } catch {
    return [];
  }
}
