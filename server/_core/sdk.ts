import * as jose from "jose";
import axios from "axios";
import * as db from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long-secured";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function createSessionToken(openId: string, options?: { name?: string; expiresInMs?: number }) {
  const isCron = openId.startsWith("cron:") || openId === "cron";
  const taskUid = isCron ? openId.split(":")[1] || "cron_task" : undefined;

  const jwt = await new jose.SignJWT({
    openId,
    name: options?.name,
    isCron,
    taskUid,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(options?.expiresInMs ? `${Math.floor(options.expiresInMs / 1000)}s` : "365d")
    .sign(secret);
  return jwt;
}

export async function authenticateRequest(req: any) {
  let token: string | undefined;
  
  // 1. Check authorization header
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7);
  }
  
  // 2. Check cookies
  if (!token && req.headers?.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc: Record<string, string>, c: string) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    token = cookies["session"];
  }

  // 3. Check for specific cron signature headers or custom fallback for local development/testing
  if (!token && req.headers?.["x-cron-authorization"]) {
    token = req.headers["x-cron-authorization"];
  }

  if (!token) {
    throw new Error("No authentication token provided");
  }

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const openId = payload.openId as string;
    const isCron = payload.isCron as boolean;
    const taskUid = payload.taskUid as string;

    if (isCron || openId?.startsWith("cron:")) {
      return {
        id: -1,
        openId: openId || "cron",
        name: "Cron Task",
        email: "cron@bilc.my",
        role: "user",
        isActive: true,
        isCron: true,
        taskUid: taskUid || openId?.split(":")[1] || "cron_audit_rotation",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as any;
    }

    const user = await db.getUserByOpenId(openId);
    if (!user) {
      throw new Error(`User not found for openId: ${openId}`);
    }
    return user;
  } catch (error: any) {
    // If it's a verification error of an invalid token or parsing error
    throw new Error(error.message || "Failed to authenticate request");
  }
}

export async function exchangeCodeForToken(code: string, state: string) {
  const serverUrl = process.env.OAUTH_SERVER_URL || "https://oauth.bilc.my";
  const res = await axios.post(`${serverUrl}/token`, {
    code,
    state,
    client_id: process.env.OAUTH_CLIENT_ID || "client",
    client_secret: process.env.OAUTH_CLIENT_SECRET || "secret",
  });
  return res.data;
}

export async function getUserInfo(accessToken: string) {
  const serverUrl = process.env.OAUTH_SERVER_URL || "https://oauth.bilc.my";
  const res = await axios.get(`${serverUrl}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data;
}

export const sdk = {
  createSessionToken,
  authenticateRequest,
  exchangeCodeForToken,
  getUserInfo,
};
