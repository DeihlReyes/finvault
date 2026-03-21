import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_CATEGORIES = [
  { name: "Food", emoji: "🍔", color: "#F97316" },
  { name: "Transport", emoji: "🚌", color: "#6C47FF" },
  { name: "Housing", emoji: "🏠", color: "#10B981" },
  { name: "Entertainment", emoji: "🎮", color: "#EC4899" },
  { name: "Health", emoji: "❤️", color: "#EF4444" },
  { name: "Shopping", emoji: "🛍️", color: "#F59E0B" },
  { name: "Savings", emoji: "💰", color: "#22C55E" },
  { name: "Salary", emoji: "💼", color: "#6366F1" },
  { name: "Freelance", emoji: "💻", color: "#8B5CF6" },
  { name: "Other", emoji: "📦", color: "#6B7280" },
];

async function seedDefaultCategories(userId: string) {
  await db.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      userId,
      ...c,
      isDefault: true,
    })),
    skipDuplicates: true,
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

  // Verify webhook secret
  const authHeader = request.headers.get("authorization");
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.type as string;
  const record = body.record as {
    id: string;
    email: string;
    raw_user_meta_data?: { display_name?: string };
  };

  if (event === "INSERT" && record?.id && record?.email) {
    try {
      await db.user.upsert({
        where: { id: record.id },
        create: {
          id: record.id,
          email: record.email,
          displayName: record.raw_user_meta_data?.display_name ?? null,
        },
        update: {},
      });
      await seedDefaultCategories(record.id);
    } catch (err) {
      console.error("Webhook user creation failed:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
