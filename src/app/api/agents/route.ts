import { NextRequest, NextResponse } from "next/server";
import { getAgents, createAgent, deleteAgent } from "@/lib/data/dataProvider";
import { requireStaff } from "@/lib/auth/session";

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const agent = await createAgent(body);
    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error("Failed to create agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request, ["manager"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    await deleteAgent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
