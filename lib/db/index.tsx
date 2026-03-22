"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { INIT_SQL } from "./init.sql";
import { seedLocalUser } from "./seed";
export { LOCAL_USER_ID } from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// ─── Module-level singleton ───────────────────────────────────────────────────
// Set once by DbProvider after initialization. Allows non-hook code (query
// functions) to access the db instance without needing React hooks.

let _db: DrizzleDb | null = null;
let _pg: PGlite | null = null;

export function getDb(): DrizzleDb {
  if (!_db) throw new Error("Database not initialized yet");
  return _db;
}

const DROP_ALL = `
  DROP TABLE IF EXISTS xp_logs CASCADE;
  DROP TABLE IF EXISTS achievements CASCADE;
  DROP TABLE IF EXISTS monthly_challenges CASCADE;
  DROP TABLE IF EXISTS net_worth_snapshots CASCADE;
  DROP TABLE IF EXISTS budgets CASCADE;
  DROP TABLE IF EXISTS transactions CASCADE;
  DROP TABLE IF EXISTS wallets CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`;

/**
 * Drops all tables in the database, then forces a hard page reload to
 * /onboarding so DbProvider reinitializes completely from scratch.
 * Uses DROP TABLE rather than indexedDB.deleteDatabase so it works
 * regardless of PGlite's internal IDB naming scheme.
 */
export async function resetDatabase(): Promise<void> {
  if (_pg) await _pg.exec(DROP_ALL);
  _db = null;
  _pg = null;
  window.location.replace("/onboarding");
}

type ImportPayload = {
  users?: Record<string, unknown>[];
  wallets?: Record<string, unknown>[];
  categories?: Record<string, unknown>[];
  transactions?: Record<string, unknown>[];
  budgets?: Record<string, unknown>[];
  achievements?: Record<string, unknown>[];
  monthlyChallenges?: Record<string, unknown>[];
  xpLogs?: Record<string, unknown>[];
  netWorthSnapshots?: Record<string, unknown>[];
};

/** Converts an ISO string (or null/undefined) to a Date, or returns null. */
function toDate(v: unknown): Date | null {
  return v ? new Date(v as string) : null;
}

/**
 * Wipes the database, restores it from a previously exported JSON payload,
 * then hard-reloads to /dashboard.
 */
export async function importDatabase(payload: ImportPayload): Promise<void> {
  if (!_pg || !_db) throw new Error("Database not initialized yet");

  const db = _db;

  // 1. Drop everything and recreate schema
  await _pg.exec(DROP_ALL);
  await _pg.exec(INIT_SQL);

  // 2. Insert in FK-dependency order
  if (payload.users?.length) {
    await db.insert(schema.users).values(
      payload.users.map((u) => ({
        ...(u as typeof schema.users.$inferInsert),
        lastTransactionDate: toDate(u.lastTransactionDate),
        lastFreezeGrantedAt: toDate(u.lastFreezeGrantedAt),
        createdAt: toDate(u.createdAt) ?? new Date(),
        updatedAt: toDate(u.updatedAt) ?? new Date(),
      }))
    );
  }

  if (payload.wallets?.length) {
    await db.insert(schema.wallets).values(
      payload.wallets.map((w) => ({
        ...(w as typeof schema.wallets.$inferInsert),
        createdAt: toDate(w.createdAt) ?? new Date(),
        updatedAt: toDate(w.updatedAt) ?? new Date(),
      }))
    );
  }

  if (payload.categories?.length) {
    await db.insert(schema.categories).values(
      payload.categories.map((c) => ({
        ...(c as typeof schema.categories.$inferInsert),
        createdAt: toDate(c.createdAt) ?? new Date(),
        updatedAt: toDate(c.updatedAt) ?? new Date(),
      }))
    );
  }

  if (payload.transactions?.length) {
    await db.insert(schema.transactions).values(
      payload.transactions.map((t) => ({
        ...(t as typeof schema.transactions.$inferInsert),
        date: toDate(t.date) ?? new Date(),
        createdAt: toDate(t.createdAt) ?? new Date(),
        updatedAt: toDate(t.updatedAt) ?? new Date(),
      }))
    );
  }

  if (payload.budgets?.length) {
    await db.insert(schema.budgets).values(
      payload.budgets.map((b) => ({
        ...(b as typeof schema.budgets.$inferInsert),
        createdAt: toDate(b.createdAt) ?? new Date(),
        updatedAt: toDate(b.updatedAt) ?? new Date(),
      }))
    );
  }

  if (payload.achievements?.length) {
    await db.insert(schema.achievements).values(
      payload.achievements.map((a) => ({
        ...(a as typeof schema.achievements.$inferInsert),
        unlockedAt: toDate(a.unlockedAt) ?? new Date(),
      }))
    );
  }

  if (payload.monthlyChallenges?.length) {
    await db.insert(schema.monthlyChallenges).values(
      payload.monthlyChallenges.map((m) => ({
        ...(m as typeof schema.monthlyChallenges.$inferInsert),
        completedAt: toDate(m.completedAt),
        createdAt: toDate(m.createdAt) ?? new Date(),
        updatedAt: toDate(m.updatedAt) ?? new Date(),
      }))
    );
  }

  if (payload.xpLogs?.length) {
    await db.insert(schema.xpLogs).values(
      payload.xpLogs.map((x) => ({
        ...(x as typeof schema.xpLogs.$inferInsert),
        createdAt: toDate(x.createdAt) ?? new Date(),
      }))
    );
  }

  if (payload.netWorthSnapshots?.length) {
    await db.insert(schema.netWorthSnapshots).values(
      payload.netWorthSnapshots.map((n) => ({
        ...(n as typeof schema.netWorthSnapshots.$inferInsert),
        createdAt: toDate(n.createdAt) ?? new Date(),
      }))
    );
  }

  _db = null;
  _pg = null;

  window.location.replace("/dashboard");
}

type DbContextValue = {
  db: DrizzleDb;
  isReady: boolean;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const DbContext = createContext<DbContextValue>({
  db: null as unknown as DrizzleDb,
  isReady: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DbProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<DbContextValue>({
    db: null as unknown as DrizzleDb,
    isReady: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // IndexedDB persistence — survives page refreshes, safe on any origin
      const pg = await PGlite.create("idb://finvault");
      const db = drizzle(pg, { schema });

      // Create tables and indexes
      await pg.exec(INIT_SQL);

      // Seed local user + default categories on first launch
      await seedLocalUser(db);

      if (!cancelled) {
        _pg = pg;
        _db = db;
        setValue({ db, isReady: true });
      }
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Returns the Drizzle db instance and a flag indicating if it's initialized. */
export function useDb(): DbContextValue {
  return useContext(DbContext);
}
