export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { PushSubscribeSchema } from "@/lib/schemas/push";

export async function POST(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    const userId = session.user.id;

    const rawBody = await req.json();
    const parsed = PushSubscribeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid subscription",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const { endpoint, keys } = parsed.data;

    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (
        ${userId},
        ${endpoint},
        ${keys.p256dh},
        ${keys.auth}
      )
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
