import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "timeoff_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  id: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export async function createSession(email: string) {
  const user = await prisma.employee.findUnique({ where: { email } });
  if (!user) {
    return null;
  }
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    role: (user.role as SessionPayload["role"]) || "EMPLOYEE"
  };
  const token = jwt.sign(payload, getSecret(), { expiresIn: SESSION_MAX_AGE });
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return payload;
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export function readSessionFromRequest(req?: NextRequest): SessionPayload | null {
  const secret = getSecret();
  try {
    const token = req
      ? req.cookies.get(SESSION_COOKIE_NAME)?.value
      : cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return jwt.verify(token, secret) as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(req?: NextRequest) {
  const session = readSessionFromRequest(req);
  if (!session) {
    return null;
  }
  const user = await prisma.employee.findUnique({ where: { id: session.id } });
  if (!user) {
    return null;
  }
  return { ...session, name: user.name };
}

export async function requireUser(req?: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(req?: NextRequest) {
  const user = await requireUser(req);
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function getSchedulerToken(req?: NextRequest) {
  const headerToken = req ? req.headers.get("authorization") : headers().get("authorization");
  if (!headerToken) return null;
  const [type, value] = headerToken.split(" ");
  if (type !== "Bearer" || !value) return null;
  return value;
}
