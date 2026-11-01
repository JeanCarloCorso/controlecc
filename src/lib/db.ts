import { Pool, PoolClient, QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { postgresPool?: Pool };

export const db = globalForDb.postgresPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: true, ca: process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n") }
    : undefined,
});

if (process.env.NODE_ENV !== "production") globalForDb.postgresPool = db;

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  return db.query<T>(text, values);
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
