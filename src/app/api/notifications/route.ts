import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/server-auth";
import { apiErrorResponse, assertTrustedOrigin } from "@/lib/http";

type NotificationRow = {
  id: string;
  activity_id: string | null;
  title: string;
  message: string;
  read_at: Date | string | null;
  created_at: Date | string;
};

export async function GET() {
  try {
    const user = await requireUser();
    const [items, count] = await Promise.all([
      query<NotificationRow>("SELECT id, activity_id, title, message, read_at, created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30", [user.id]),
      query<{ count: string }>("SELECT count(*)::text count FROM notifications WHERE user_id=$1 AND read_at IS NULL", [user.id]),
    ]);
    return NextResponse.json({
      unreadCount: Number(count.rows[0]?.count || 0),
      notifications: items.rows.map((item) => ({
        id: item.id,
        activityId: item.activity_id,
        title: item.title,
        message: item.message,
        read: Boolean(item.read_at),
        createdAt: new Date(item.created_at).toISOString(),
      })),
    });
  } catch (error) {
    return apiErrorResponse(error, "Falha ao consultar notificações");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const user = await requireUser();
    await query("UPDATE notifications SET read_at=coalesce(read_at,now()) WHERE user_id=$1 AND read_at IS NULL", [user.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Falha ao atualizar notificações");
  }
}
