import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { User, connectDB } from "@/server/db";
import { hashPassword } from "@/server/password";
import { setPasswordSchema } from "@/validations/auth";
import { handleApiError } from "@/server/api-utils";

// Set or change the password for the signed-in account (accounts made with an OTP have none yet).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { password } = setPasswordSchema.parse(await req.json());
    await connectDB();
    await User.updateOne({ id: user.id }, { password: hashPassword(password) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
