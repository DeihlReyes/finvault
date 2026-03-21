import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await getUser();
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new NextResponse("Invalid subscription", { status: 400 });
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: auth.supabaseId,
      endpoint,
      keys,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
    update: { userId: auth.supabaseId, keys },
  });

  return new NextResponse(null, { status: 201 });
}
