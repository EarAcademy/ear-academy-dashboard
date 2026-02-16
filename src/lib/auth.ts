import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "admin" | "viewer";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default-secret-change-me"
);

export function verifyPassword(password: string): { role: Role } | null {
  if (password === process.env.AUTH_PASSWORD_ADMIN) return { role: "admin" };
  if (password === process.env.AUTH_PASSWORD_VIEWER) return { role: "viewer" };
  return null;
}

export async function createToken(role: Role): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(
  token: string
): Promise<{ role: Role } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ role: Role } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}
