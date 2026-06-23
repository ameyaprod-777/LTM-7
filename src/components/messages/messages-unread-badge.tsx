"use client";

import { useEffect, useState } from "react";

export function MessagesUnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => {
      void fetch("/api/messages/unread")
        .then((r) => r.json())
        .then((json) => setCount(json.count ?? 0));
    };
    load();
    const onRead = () => load();
    window.addEventListener("ltm-messages-read", onRead);
    const id = setInterval(load, 30000);
    return () => {
      clearInterval(id);
      window.removeEventListener("ltm-messages-read", onRead);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
