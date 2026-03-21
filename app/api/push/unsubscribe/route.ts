import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await getUser();
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return new NextResponse("Missing endpoint", { status: 400 });

  await db.pushSubscription.deleteMany({
    where: { userId: auth.supabaseId, endpoint },
  });

  return new NextResponse(null, { status: 200 });
}
