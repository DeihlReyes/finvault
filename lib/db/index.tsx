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

/**
 * Drops all tables in the database, then forces a hard page reload to
 * /onboarding so DbProvider reinitializes completely from scratch.
 * Uses DROP TABLE rather than indexedDB.deleteDatabase so it works
 * regardless of PGlite's internal IDB naming scheme.
 */
export async function resetDatabase(): Promise<void> {
  if (_pg) {
    await _pg.exec(`
      DROP TABLE IF EXISTS xp_logs CASCADE;
      DROP TABLE IF EXISTS achievements CASCADE;
      DROP TABLE IF EXISTS monthly_challenges CASCADE;
      DROP TABLE IF EXISTS net_worth_snapshots CASCADE;
      DROP TABLE IF EXISTS budgets CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS wallets CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
  }

  _db = null;
  _pg = null;

  window.location.replace("/onboarding");
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
