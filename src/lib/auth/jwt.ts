import { SignJWT, jwtVerify } from "jose";

export interface StaffJwtPayload {
  id: number;
  username: string;
  role: "manager" | "consultant";
  name: string;
  agentId?: number | null;
  exp?: number;
}

// AUTH_SECRET is mandatory in production: signing/verifying staff sessions
// with a hardcoded fallback would let anyone forge a manager token.
if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "AUTH_SECRET environment variable is required in production. " +
      "Generate one with `openssl rand -base64 48` and set it before starting the app."
  );
}

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "AUTH_SECRET environment variable must be set in production. Refusing to start with an insecure default JWT signing secret."
  );
}

const secret = new TextEncoder().encode(
  // Fallback only ever applies outside production (local dev with no .env set up yet).
  process.env.AUTH_SECRET || "xerxes-dev-secret-change-me-in-production"
);

const ISSUER = "xerxes-realty";
const AUDIENCE = "xerxes-mobile";

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
    .sign(secret);
}

export async function verifyStaffToken(
  token: string
): Promise<StaffJwtPayload | null> {
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

const USER_AUDIENCE = "xerxes-web-user";

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
    .sign(secret);
}

export async function verifyUserToken(
  token: string
): Promise<UserJwtPayload | null> {
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
