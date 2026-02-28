export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { sql } from '@/lib/db';
import { auth } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  // Initialize VAPID inside the handler — env vars are not available at module eval time during Vercel builds
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const userId = session.user.id;

    const { title, body, url } = await req.json();

    // Only send to THIS user's subscriptions
    const subscriptions = await sql`SELECT * FROM push_subscriptions WHERE user_id = ${userId}`;

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions' });
    }

    const payload = JSON.stringify({ title: title ?? 'Mes Finances', body, url: url ?? '/' });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
