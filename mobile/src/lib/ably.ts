import { http } from "../api/client";
import { useAuthStore } from "../store/auth";
import { getQueryClient } from "../store/queryClient";

/**
 * Mobile Ably realtime manager.
 * - The Ably API key is never shipped to the client. We fetch a scoped token
 *   request from the backend (`/api/realtime/token`) and let Ably exchange it.
 * - Falls back to HTTP polling in the screens when Ably is not configured.
 */

// Minimal shape to avoid a hard dependency on Ably types at compile time.
type AblyRealtime = any;
let client: AblyRealtime | null = null;
let connected = false;

export async function connectAbly(): Promise<boolean> {
  const token = useAuthStore.getState().token;
  const staffId = useAuthStore.getState().staff?.id;
  if (!token || !staffId) return false;
  if (client && connected) return true;

  try {
    // @ts-ignore - optional dependency
    const { Ably } = await import("ably");
    client = new Ably.Realtime({
      clientId: `staff-${staffId}`,
      authCallback: async (_tokenParams: any, callback: any) => {
        try {
          const { data } = await http.post("/api/realtime/token");
          callback(null, data.tokenRequest);
        } catch (e) {
          callback(e as any, null);
        }
      },
    });

    client.connection.once("connected", () => {
      connected = true;
      subscribeStaffChannel(staffId);
    });
    return true;
  } catch (e) {
    console.warn("Ably connect failed, falling back to polling", e);
    return false;
  }
}

function subscribeStaffChannel(staffId: number) {
  if (!client) return;
  const channel = client.channels.get(`staff:${staffId}`);
  channel.subscribe((msg: any) => {
    const qc = getQueryClient();
    if (qc) qc.invalidateQueries({ queryKey: ["chat-sessions"] });
  });
}

/** Subscribe to a chat session channel and invoke onMessage on new events. */
export function subscribeChatSession(
  sessionId: string,
  onMessage: () => void,
  onTyping?: () => void
): () => void {
  if (!client || !connected) {
    return () => {};
  }
  const channel = client.channels.get(`chat:${sessionId}`);
  const handler = () => onMessage();
  channel.subscribe("message", handler);
  let typingHandler: ((msg: any) => void) | undefined;
  if (onTyping) {
    typingHandler = () => onTyping();
    channel.subscribe("typing", typingHandler);
  }
  return () => {
    try {
      channel.unsubscribe("message", handler);
      if (typingHandler) channel.unsubscribe("typing", typingHandler);
    } catch {
      /* ignore */
    }
  };
}

/** Publish a typing indicator on the session channel. */
export function publishTyping(sessionId: string) {
  if (!client || !connected) return;
  try {
    client.channels.get(`chat:${sessionId}`).publish("typing", { at: Date.now() });
  } catch {
    /* ignore */
  }
}

export function disconnectAbly() {
  if (client) {
    try {
      client.close();
    } catch {
      /* ignore */
    }
  }
  client = null;
  connected = false;
}

export function isRealtimeConnected() {
  return connected;
}
