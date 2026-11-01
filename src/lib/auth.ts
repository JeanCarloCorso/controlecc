import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

declare module "next-auth" {
  interface Session { user: { id: string; role: "common" | "admin"; name?: string | null; email?: string | null; image?: string | null } }
  interface User { role: "common" | "admin" }
}
declare module "next-auth/jwt" { interface JWT { id: string; role: "common" | "admin"; sessionVersion: number } }

export const authOptions: NextAuthOptions = {
  providers: [CredentialsProvider({
    name: "Credentials",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Senha", type: "password" } },
    async authorize(credentials, request) {
      if (!credentials?.email || !credentials.password) return null;
      const forwardedFor = request.headers?.["x-forwarded-for"];
      const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",", 1)[0].trim() || "unknown";
      const normalizedEmail = credentials.email.trim().toLowerCase();
      if (!rateLimit(`login-ip:${ip}`, 30, 15 * 60_000) || !rateLimit(`login:${ip}:${normalizedEmail}`, 10, 15 * 60_000)) return null;
      const result = await query<{ id: string; email: string; password_hash: string; full_name: string; role: "student" | "admin"; email_verified_at: Date | null; session_version: number }>(
        "SELECT id, email, password_hash, full_name, role, email_verified_at, session_version FROM users WHERE email = $1", [normalizedEmail]);
      const user = result.rows[0];
      if (!user || !user.email_verified_at) return null;
      const { default: argon2 } = await import("argon2");
      if (!(await argon2.verify(user.password_hash, credentials.password))) return null;
      return { id: user.id, email: user.email, name: user.full_name, role: user.role === "student" ? "common" : "admin", sessionVersion: user.session_version } as any;
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role; token.sessionVersion = (user as any).sessionVersion; }
      else if (token.id) {
        const current = await query<{ session_version: number }>("SELECT session_version FROM users WHERE id=$1", [token.id]);
        if (!current.rows[0] || current.rows[0].session_version !== token.sessionVersion) token.id = "";
      }
      return token;
    },
    async session({ session, token }) { session.user = { id: token.id, email: token.email, name: token.name, role: token.role }; return session; },
  },
  pages: { signIn: "/login" }, session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, secret: process.env.NEXTAUTH_SECRET,
};
