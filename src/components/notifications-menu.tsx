"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Notification = {
  id: string;
  activityId: string | null;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function NotificationsMenu() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const body = await response.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(body.notifications);
      setUnreadCount(body.unreadCount);
    } catch {
      // A navegação permanece utilizável mesmo durante uma falha temporária da API.
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30_000);
    window.addEventListener("focus", loadNotifications);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", loadNotifications);
    };
  }, [loadNotifications]);

  async function markAsRead(notification: Notification) {
    if (!notification.read) {
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!response.ok) await loadNotifications();
    }
    router.push("/files");
  }

  async function markAllAsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    const response = await fetch("/api/notifications", { method: "PATCH" });
    if (!response.ok) await loadNotifications();
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) loadNotifications(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={unreadCount ? `${unreadCount} notificação(ões) não lida(s)` : "Notificações"}>
          <Bell size={20} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="gov-dropdown-menu w-[min(24rem,calc(100vw-2rem))]">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 ? <Button variant="ghost" size="sm" onClick={markAllAsRead}>Marcar todas como lidas</Button> : null}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-3 py-5 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
        ) : notifications.map((notification) => (
          <DropdownMenuItem key={notification.id} onSelect={() => markAsRead(notification)} className="flex cursor-pointer items-start gap-3 whitespace-normal py-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-[#1351b4]"}`} />
            <span className="min-w-0">
              <strong className="block text-sm">{notification.title}</strong>
              <span className="block text-sm text-muted-foreground">{notification.message}</span>
              <time className="mt-1 block text-xs text-muted-foreground" dateTime={notification.createdAt}>
                {new Date(notification.createdAt).toLocaleString("pt-BR")}
              </time>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
