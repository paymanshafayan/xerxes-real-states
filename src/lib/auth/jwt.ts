import { SignJWT, jwtVerify } from "jose";

export interface StaffJwtPayload {
  id: number;
  username: string;
  role: "manager" | "consultant";
  name: string;
  agentId?: number | null;
  exp?: number;
}

const ISSUER = "xerxes-realty";
const AUDIENCE = "xerxes-mobile";
const USER_AUDIENCE = "xerxes-web-user";

/**
 * Resolves the signing key only when an auth operation is performed.
 *
 * Route modules are evaluated by `next build` while collecting route metadata.
 * Validating this at module scope makes a production build depend on a runtime
 * secret, even though that secret is normally injected only when the app starts.
 */
function getSecret(): Uint8Array {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret && process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET environment variable is required in production. " +
        "Generate one with `openssl rand -base64 48` and set it before starting the app."
    );
  }

  // The fallback is deliberately limited to non-production environments.
  return new TextEncoder().encode(
    authSecret || "xerxes-dev-secret-change-me-in-production"
  );
}

export async function signStaffToken(
  payload: Omit<StaffJwtPayload, "exp">,
  expiresInSeconds = 60 * 60 * 8 // 8h
): Promise<string> {
  return new SignJWT({
    username: payload.username,
    role: payload.role,
    name: payload.name,
    agentId: payload.agentId ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.id))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSecret());
}

export async function verifyStaffToken(
  token: string
): Promise<StaffJwtPayload | null> {
  // Resolve outside the try block so a missing production secret is never
  // mistaken for an invalid token.
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return {
      id: Number(payload.sub),
      username: payload.username as string,
      role: payload.role as "manager" | "consultant",
      name: payload.name as string,
      agentId: payload.agentId as number | null | undefined,
    };
  } catch {
    return null;
  }
}

// --- Regular (customer) user tokens ---

export interface UserJwtPayload {
  id: number;
  email: string;
}

export async function signUserToken(
  payload: UserJwtPayload,
  expiresInSeconds = 60 * 60 * 24 * 7 // 7 days
): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.id))
    .setIssuer(ISSUER)
    .setAudience(USER_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSecret());
}

export async function verifyUserToken(
  token: string
): Promise<UserJwtPayload | null> {
  // Resolve outside the try block so a missing production secret is never
  // mistaken for an invalid token.
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: USER_AUDIENCE,
    });
    return {
      id: Number(payload.sub),
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}
