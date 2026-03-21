"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-xs font-medium text-center py-1.5 px-4">
      You are offline — changes will sync when you reconnect
    </div>
  );
}
