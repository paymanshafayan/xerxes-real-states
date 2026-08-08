/**
 * Realtime provider abstraction for chat + notifications.
 *
 * - When ABLY_API_KEY is configured, events are published to Ably channels so
 *   the mobile app can subscribe for instant updates.
 * - When not configured, the app gracefully falls back to HTTP polling
 *   (every few seconds) + Expo Push Notifications.
 */

let ablyClient: any | null = null;
let ablyTried = false;

export function isRealtimeEnabled(): boolean {
  return Boolean(process.env.ABLY_API_KEY);
}

async function getClient(): Promise<any | null> {
  if (ablyTried) return ablyClient;
  ablyTried = true;
  if (!process.env.ABLY_API_KEY) return null;
  try {
    // @ts-ignore - optional dependency, only needed when Ably is configured
    const { Realtime } = await import("ably");
    ablyClient = new Realtime({ key: process.env.ABLY_API_KEY });
    return ablyClient;
  } catch (err) {
    console.error("Ably init failed:", err);
    return null;
  }
}

export interface ChatEvent {
  type: "message" | "typing" | "read" | "assign";
  sessionId: string;
  data?: unknown;
}

export async function publishChatEvent(event: ChatEvent): Promise<void> {
  const client = await getClient();
  if (!client) return; // polling fallback handles it
  try {
    const channel = client.channels.get(`chat:${event.sessionId}`);
    await channel.publish(event.type, event.data ?? {});
  } catch (err) {
    console.error("Ably publish failed:", err);
  }
}

export async function publishStaffEvent(
  staffId: number,
  event: string,
  data?: unknown
): Promise<void> {
  const client = await getClient();
  if (!client) return;
  try {
    const channel = client.channels.get(`staff:${staffId}`);
    await channel.publish(event, data ?? {});
  } catch (err) {
    console.error("Ably publish failed:", err);
  }
}
