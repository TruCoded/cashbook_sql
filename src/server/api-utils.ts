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

function describeDbError(text: string): string {
  if (/bad auth|authentication failed|auth failed/i.test(text))
    return "Database login failed: wrong username or password in MONGODB_URI (special characters in the password must be URL-encoded, e.g. @ becomes %40)";
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(text))
    return "Database host not found: MONGODB_URI looks wrong, or this machine has no internet/DNS access";
  if (/ReplicaSetNoPrimary|Server selection timed out|serverSelectionTimeout|whitelist|ETIMEDOUT|ECONNREFUSED|MongooseServerSelectionError/i.test(text))
    return "Database unreachable: add your current IP (or 0.0.0.0/0 for testing) in Atlas > Network Access, and make sure the cluster is not paused";
  if (/Invalid scheme|Invalid connection string|URI must/i.test(text))
    return "MONGODB_URI is malformed: it must start with mongodb+srv:// or mongodb://";
  return "Could not reach the database (check MONGODB_URI, MONGODB_DB_NAME and the Atlas IP access list)";
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) return jsonError(err.issues[0]?.message ?? "Invalid input", 400);
  if (err instanceof NotFoundError) return jsonError(err.message, 404);
  if (err instanceof ForbiddenError) return jsonError(err.message, 403);
  if (err instanceof UnauthorizedError) return jsonError("Unauthorized", 401);
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("Missing environment variable")) return jsonError(`${msg} (set it in Vercel > Settings > Environment Variables)`, 500);
  if (err instanceof Error && /Mongo|ECONNREFUSED|ENOTFOUND|buffering timed out/i.test(err.name + msg)) {
    console.error("[api] database error", err);
    return jsonError(`${describeDbError(err.name + " " + msg)}${process.env.NODE_ENV !== "production" ? ` [${msg.slice(0, 200)}]` : ""}`, 500);
  }
  console.error("[api] unhandled error", err);
  return jsonError("Something went wrong. Please try again.", 500);
}
