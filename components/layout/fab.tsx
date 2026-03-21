"use client";

import { useState } from "react";

export function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center text-2xl hover:opacity-90 active:scale-95 transition-all"
        aria-label="Add transaction"
      >
        +
      </button>

      {/* Sheet placeholder — wired up in Phase 2 */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-0 inset-x-0 bg-card rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <p className="text-center text-muted-foreground text-sm">
              Transaction form coming in Phase 2
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full py-2 text-sm text-muted-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
