"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "oklch(0.14 0.018 274)",
          border: "1px solid oklch(1 0 0 / 10%)",
          color: "oklch(0.95 0.005 274)",
        },
      }}
    />
  );
}

export { toast } from "sonner";
