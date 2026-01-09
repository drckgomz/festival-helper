// src/db/index.ts
import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment variables.");
}

// For serverless (Vercel), keep connections minimal.
export const sql = postgres(databaseUrl, { max: 1 });

export const db = drizzle(sql, { schema });
export type DB = typeof db;
