import "dotenv/config";
import { Pool } from "pg";

export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || "localhost",
        port: parseInt(process.env.PGPORT || "5432", 10),
        database: process.env.PGDATABASE || "consumer_attention_mapping",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
      }
);

pool.on("connect", () => {
  console.log("[PostgreSQL] Connected successfully");
});

pool.on("error", (err: any) => {
  console.error("[PostgreSQL] Unexpected error:", err);
});

