import "server-only";
import { RateLimitModel, connectDB } from "./db";

/** Returns false when `key` has already been used `limit` times in the last `windowSeconds`. */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  await connectDB();
  const since = new Date(Date.now() - windowSeconds * 1000);
  const count = await RateLimitModel.countDocuments({ key, createdAt: { $gt: since } });
  if (count >= limit) return false;
  await RateLimitModel.create({ key });
  return true;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "unknown";
}
