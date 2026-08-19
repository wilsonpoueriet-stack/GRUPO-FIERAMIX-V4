import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "fieramix_admin_session";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

type AdminSession = {
  username: string;
  expiresAt: number;
};

function getSessionSecret(): string {
  return process.env.FIERAMIX_SESSION_SECRET?.trim() || "";
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminAuthConfigured(): boolean {
  const username = process.env.FIERAMIX_ADMIN_USER?.trim() || "";
  const password = process.env.FIERAMIX_ADMIN_PASSWORD || "";
  const secret = getSessionSecret();

  return Boolean(username && password && secret.length >= 32);
}

export function verifyAdminCredentials(
  username: string,
  password: string,
): boolean {
  if (!isAdminAuthConfigured()) {
    return false;
  }

  const expectedUsername = process.env.FIERAMIX_ADMIN_USER?.trim() || "";
  const expectedPassword = process.env.FIERAMIX_ADMIN_PASSWORD || "";

  return (
    safeEqual(username.trim(), expectedUsername) &&
    safeEqual(password, expectedPassword)
  );
}

export function createAdminSessionToken(username: string): string {
  const session: AdminSession = {
    username,
    expiresAt: Date.now() + ADMIN_SESSION_SECONDS * 1000,
  };

  const payload = encode(JSON.stringify(session));
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
): AdminSession | null {
  if (!token || !isAdminAuthConfigured()) {
    return null;
  }

  const [payload, signature, ...extra] = token.split(".");

  if (!payload || !signature || extra.length > 0) {
    return null;
  }

  const expectedSignature = sign(payload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const session = JSON.parse(decode(payload)) as Partial<AdminSession>;

    if (
      typeof session.username !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      username: session.username,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return verifyAdminSessionToken(token);
}
