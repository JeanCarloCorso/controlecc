import { createHash, randomBytes } from "crypto";
import { query } from "@/lib/db";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createAuthToken(userId: string, purpose: "verify_email" | "reset_password", ttlHours: number) {
  const token = randomBytes(32).toString("base64url");
  await query("DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL", [userId, purpose]);
  await query(
    "INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1, $2, $3, now() + ($4 * interval '1 hour'))",
    [userId, purpose, hashToken(token), ttlHours]
  );
  return token;
}
