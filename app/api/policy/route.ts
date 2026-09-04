import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_POLICY, type PolicyConfig } from "@/lib/engine";

// Server-side policy mirror so dashboard can POST live edits and sweetdrip
// can poll / receive them. Survives across client refreshes within the same
// Next.js process (perfect for hackathon demo).

let livePolicy: PolicyConfig = { ...DEFAULT_POLICY };
let updatedAt = new Date().toISOString();

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  return withCors(
    NextResponse.json({
      success: true,
      policy: livePolicy,
      updatedAt,
    })
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patch = (body.policy || body) as Partial<PolicyConfig>;
    livePolicy = { ...livePolicy, ...patch };
    updatedAt = new Date().toISOString();
    return withCors(
      NextResponse.json({
        success: true,
        policy: livePolicy,
        updatedAt,
      })
    );
  } catch (error: any) {
    return withCors(
      NextResponse.json(
        { success: false, error: error.message || "Invalid policy" },
        { status: 400 }
      )
    );
  }
}
