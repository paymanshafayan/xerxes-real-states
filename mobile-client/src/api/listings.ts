import { http } from "./client";

/**
 * Phase 8: User listings API (client app).
 */

export interface Listing {
  id: number;
  slug: string;
  title: string;
  description: string;
  city: string;
  category: string;
  images: string[];
  videos: string[];
  panoramas: string[];
  approvalStatus: string;
  rejectionReason?: string | null;
  price: number | null;
  rentDeposit: number | null;
  monthlyRent: number | null;
  currency: string;
  listingKinds: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
  reviewedAt: string | null;
  history: any[];
  assignedStaff: { id: number; name: string; username: string } | null;
}

export interface ListingsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  removed: number;
  unavailable_reported: number;
}

export async function fetchMyListings(status?: string): Promise<{
  listings: Listing[];
  summary: ListingsSummary;
}> {
  const url = status ? `/api/listings/mine?status=${status}` : "/api/listings/mine";
  const res = await http.get<{ listings: Listing[]; summary: ListingsSummary }>(url);
  return res.data;
}

export async function fetchListingDetail(id: number): Promise<Listing> {
  const res = await http.get<{ listing: Listing }>(`/api/listings/mine/${id}`);
  return res.data.listing;
}

export async function deleteListing(id: number): Promise<void> {
  await http.delete(`/api/listings/mine/${id}`);
}

export async function createListing(payload: {
  profile: any;
  listingKinds: string[];
  category: string;
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  address: string;
  city: string;
  district?: string;
  country: string;
  lat?: number | null;
  lng?: number | null;
  price?: number | null;
  rentDeposit?: number | null;
  monthlyRent?: number | null;
  currency: string;
  commitmentAccepted: true;
}): Promise<{ success: boolean; listing: Listing; assignedStaffId: number | null }> {
  const res = await http.post("/api/listings", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

export async function uploadPanoramas(
  listingId: number,
  uris: string[]
): Promise<{ panoramas: string[]; total: number }> {
  // For mobile, we send URLs (already uploaded) - in production use multipart
  // For simplicity in this version, we just pass URLs
  // A real implementation would use FormData with RN file URIs
  const res = await http.post(`/api/listings/mine/${listingId}/panoramas`, {
    panoramas: uris,
  });
  return res.data;
}

export async function removePanorama(
  listingId: number,
  panoramaUrl: string
): Promise<{ panoramas: string[]; total: number }> {
  const encoded = encodeURIComponent(panoramaUrl);
  const res = await http.delete(`/api/listings/mine/${listingId}/panoramas/${encoded}`);
  return res.data;
}

// User profile
export interface UserProfile {
  id: number;
  userId: number;
  lastName: string | null;
  nationalId: string | null;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  profileCompleted: boolean;
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await http.get<{ profile: UserProfile }>("/api/user/profile");
  return res.data.profile;
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await http.put<{ profile: UserProfile }>("/api/user/profile", data);
  return res.data.profile;
}

// Notifications
export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

export async function fetchNotifications(): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  const res = await http.get<{ notifications: Notification[]; unreadCount: number }>(
    "/api/user/notifications"
  );
  return res.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await http.post(`/api/user/notifications/${id}/read`);
}

// Visit requests
export interface VisitRequest {
  visitRequest: any;
  listing: {
    id: number;
    title: string;
    city: string;
    slug: string;
    images: string[];
  };
}

export async function createVisitRequest(payload: {
  listingId: number;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  preferredDate?: string;
  note?: string;
}): Promise<any> {
  const res = await http.post("/api/visit-requests", payload);
  return res.data;
}

export async function fetchMyVisitRequests(): Promise<VisitRequest[]> {
  const res = await http.get<{ visitRequests: VisitRequest[] }>("/api/visit-requests/mine");
  return res.data.visitRequests;
}
