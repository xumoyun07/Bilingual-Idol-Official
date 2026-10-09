import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { sdk } from "./sdk";
import type { User } from "../../drizzle/schema";

export interface TrpcContext {
  user: User | null;
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(req);
  } catch (err) {
    // Silent catch, user remains unauthenticated (null)
  }
  return {
    user,
    req,
    res,
  };
}
