import "dotenv/config";
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("[PostgreSQL] Connected successfully");
});

pool.on("error", (err) => {
  console.error("[PostgreSQL] Unexpected error:", err);
});