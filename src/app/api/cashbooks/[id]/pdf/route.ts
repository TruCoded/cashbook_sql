import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { getAuthorizedCashbook } from "@/server/permissions";
import { loadStatement } from "@/server/notify";
import { buildStatementPdf } from "@/server/pdf";
import { NotFoundError, handleApiError } from "@/server/api-utils";

type Params = { params: Promise<{ id: string }> };

// Download the current statement as a PDF (owner or any partner).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireUser();
    await getAuthorizedCashbook(id, user.id);

    const data = await loadStatement(id);
    if (!data) throw new NotFoundError("Cashbook not found");
    const pdf = await buildStatementPdf(data.input);
    const name = data.cashbook.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cashbook";

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cashbook-${name}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
