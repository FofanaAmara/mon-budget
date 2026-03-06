export const runtime = "nodejs";

import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { sql } from "@/lib/db";

const NOTIFICATION_PAYLOAD = JSON.stringify({
  title: "Mes Finances",
  body: "N'oubliez pas de noter vos depenses du jour !",
  url: "/depenses",
});

export async function GET(req: NextRequest) {
  // Timing-safe CRON_SECRET verification
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";
  const expected = Buffer.from(cronSecret, "utf-8");
  const received = Buffer.from(token, "utf-8");
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Runtime checks for VAPID env vars
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL;
  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    return NextResponse.json(
      { error: "VAPID configuration missing" },
      { status: 500 },
    );
  }

  // Initialize VAPID inside the handler — env vars are not available at module eval time during Vercel builds
  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey,
  );

  try {
    // Send the same daily reminder to ALL subscribers (not per-user).
    // This is intentional: the cron delivers a generic reminder, not user-specific data.
    const subscriptions =
      await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`;

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No subscriptions",
      });
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          NOTIFICATION_PAYLOAD,
        ),
      ),
    );

    // Clean up stale subscriptions (410 Gone = browser unsubscribed)
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (
        r.status === "rejected" &&
        (r.reason as { statusCode?: number })?.statusCode === 410
      ) {
        await sql`DELETE FROM push_subscriptions WHERE endpoint = ${subscriptions[i].endpoint}`;
      }
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error("Cron push error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 },
    );
  }
}
