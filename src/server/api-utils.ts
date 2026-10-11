import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this cashbook") {
    super(message);
    this.name = "ForbiddenError";
  }
}
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) return jsonError(err.issues[0]?.message ?? "Invalid input", 400);
  if (err instanceof NotFoundError) return jsonError(err.message, 404);
  if (err instanceof ForbiddenError) return jsonError(err.message, 403);
  if (err instanceof UnauthorizedError) return jsonError("Unauthorized", 401);
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("Missing environment variable")) return jsonError(`${msg} (set it in Vercel > Settings > Environment Variables)`, 500);
  if (err instanceof Error && /Mongo|ECONNREFUSED|ENOTFOUND|ETIMEOUT|buffering timed out|querySrv|Authentication failed|bad auth/i.test(err.name + msg)) {
    console.error("[api] database error", err);
    if (/querySrv|ENOTFOUND|ETIMEOUT/i.test(msg)) return jsonError("Could not look up the MongoDB host (DNS problem on this network). Switch your DNS to 8.8.8.8 / 1.1.1.1 or use Atlas's non-SRV connection string.", 500);
    if (/Authentication failed|bad auth/i.test(msg)) return jsonError("MongoDB rejected the username or password in MONGODB_URI.", 500);
    return jsonError("Could not reach the database (check MONGODB_URI, MONGODB_DB_NAME and Atlas Network Access: allow your IP).", 500);
  }
  console.error("[api] unhandled error", err);
  return jsonError("Something went wrong. Please try again.", 500);
}