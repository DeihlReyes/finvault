import webpush from "web-push";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  "mailto:" + process.env.VAPID_CONTACT_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushPayload = {
  title: string;
  body: string;
  tag?: string;
  url?: string;
};

export async function notifyUser(userId: string, payload: PushPayload) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  const json = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const keys = sub.keys as { p256dh: string; auth: string };
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys },
          json
        );
      } catch (err: unknown) {
        // 410 Gone = subscription expired; clean it up
        if ((err as { statusCode?: number }).statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}
