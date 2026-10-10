import "server-only";
import { ActivityModel, connectDB } from "./db";

export async function recordAudit(entry: { userId: string | null; cashbookId?: string | null; action: string; description: string }) {
  try {
    await connectDB();
    await ActivityModel.create({ userId: entry.userId, cashbookId: entry.cashbookId ?? null, action: entry.action, description: entry.description });
  } catch (err) {
    console.error("[audit] failed to record activity", err); // never block the real action
  }
}
