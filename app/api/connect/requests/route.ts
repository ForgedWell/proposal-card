import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/jwt";
import { getAllRequests, approveRequest, declineRequest } from "@/lib/connect/requests";
import { z } from "zod";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

// GET /api/connect/requests — list all requests for the logged-in owner
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await getAllRequests(user.id);
  return NextResponse.json({ requests });
}

// PATCH /api/connect/requests — approve or decline a request
const actionSchema = z.object({
  requestId: z.string(),
  action:    z.enum(["approve", "decline"]),
});

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { requestId, action } = parsed.data;
    const updated = action === "approve"
      ? await approveRequest(requestId, user.id)
      : await declineRequest(requestId, user.id);

    return NextResponse.json({ request: updated });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err.message === "ALREADY_DECIDED") return NextResponse.json({ error: "Already decided" }, { status: 409 });
    console.error("[connect/requests PATCH]", err);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
