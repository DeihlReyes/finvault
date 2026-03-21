"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NotificationPreferences() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator && "PushManager" in window)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSupported(true);
        setSubscribed(!!sub);
      })
      .catch(() => {});
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      setSubscribed(true);
      toast.success("Budget alerts enabled");
    } catch {
      toast.error("Could not enable notifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Notifications disabled");
    } catch {
      toast.error("Could not disable notifications");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">Budget alerts</p>
        <p className="text-xs text-muted-foreground">
          Get notified when you reach 80% or 100% of a budget
        </p>
      </div>
      <Button
        variant={subscribed ? "destructive" : "outline"}
        size="sm"
        disabled={loading}
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
      >
        {loading ? "…" : subscribed ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
