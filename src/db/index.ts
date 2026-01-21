// src/db/index.ts
import "server-only";
import postgres, { Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment variables.");
}

/**
 * Next.js dev reloads can re-run module init.
 * Use a global singleton to avoid creating many clients.
 */
declare global {
  // eslint-disable-next-line no-var
  var __festival_helper_sql__: Sql | undefined;
}

const isProd = process.env.NODE_ENV === "production";

// ✅ In dev, allow more than 1 connection so dashboards + Promise.all won't stall.
// ✅ In prod/serverless, keep it small.
const sql =
  global.__festival_helper_sql__ ??
  postgres(databaseUrl, {
    max: isProd ? 1 : 10, // <— key change (dev needs >1)
    idle_timeout: 20, // seconds
    connect_timeout: 10, // seconds
    // If you ever see "prepared statement already exists" on serverless/hot reload:
    // prepare: false,
  });

if (!isProd) global.__festival_helper_sql__ = sql;

export { sql };
export const db = drizzle(sql, { schema });
export type DB = typeof db;
