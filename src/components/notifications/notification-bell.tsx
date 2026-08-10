"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications);
      setUnread(data.unreadCount);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-anthracite-500 hover:bg-anthracite-50"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-xl border border-anthracite-100 bg-white shadow-xl sm:w-80">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="shrink-0 text-xs text-accent">
                  Tout marquer lu
                </button>
              )}
            </div>
            <ul className="max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-anthracite-400">
                  Aucune notification
                </li>
              ) : (
                items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link ?? "#"}
                      onClick={() => setOpen(false)}
                      className={`block px-4 py-3 text-sm hover:bg-anthracite-50 ${!n.read ? "bg-accent-muted/30" : ""}`}
                    >
                      <p className="font-medium text-anthracite break-words">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 break-words text-xs text-anthracite-500">
                          {n.body}
                        </p>
                      )}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
