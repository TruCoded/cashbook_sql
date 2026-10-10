import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireUser, toSessionUser } from "@/server/auth";
import { User, connectDB } from "@/server/db";
import { updateProfileSchema } from "@/validations/profile";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    return NextResponse.json({ user: await getCurrentUser() });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = updateProfileSchema.parse(await req.json());
    await connectDB();
    const updated = await User.findOneAndUpdate(
      { id: user.id },
      { name: input.name, ...(input.businessName !== undefined ? { businessName: input.businessName } : {}) },
      { new: true }
    ).lean();
    return NextResponse.json({ user: updated ? toSessionUser(updated) : user });
  } catch (err) {
    return handleApiError(err);
  }
}
