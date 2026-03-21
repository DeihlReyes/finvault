"use client";

import { useEffect, useCallback } from "react";
import { useOnlineStatus } from "./use-online-status";

const DB_NAME = "finvault-offline";
const STORE_NAME = "transaction-queue";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(data: FormData | Record<string, unknown>) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).add({ data, timestamp: Date.now() });
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

async function dequeueAll(): Promise<Array<{ id: number; data: Record<string, unknown>; timestamp: number }>> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const items = await new Promise<Array<{ id: number; data: Record<string, unknown>; timestamp: number }>>((res, rej) => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  store.clear();
  db.close();
  return items;
}

export function useIndexedDBQueue(
  onDrain: (item: Record<string, unknown>) => Promise<void>
) {
  const isOnline = useOnlineStatus();

  const drain = useCallback(async () => {
    try {
      const items = await dequeueAll();
      for (const item of items) {
        await onDrain(item.data);
      }
    } catch {
      // IndexedDB not available (SSR) or drain failed
    }
  }, [onDrain]);

  useEffect(() => {
    if (isOnline) {
      drain();
    }
  }, [isOnline, drain]);

  return { enqueue };
}
