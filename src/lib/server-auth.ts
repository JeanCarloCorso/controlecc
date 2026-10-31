import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function requireUser(role?: "admin") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (role && session.user.role !== role) throw new Error("FORBIDDEN");
  return session.user;
}
