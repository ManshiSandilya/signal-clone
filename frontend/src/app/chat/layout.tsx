"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe, getToken } from "@/lib/api";
import { User } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import { ChatProvider } from "@/lib/ChatContext";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isChatOpen = pathname !== "/chat";

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    getMe()
      .then(setMe)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-signal-text-muted">Loading...</div>;
  }

  if (!me) return null;

  return (
    <ChatProvider>
      <div className="flex h-screen bg-signal-bg overflow-hidden">
        <Sidebar me={me} />
        <div className={`flex-1 flex flex-col ${isChatOpen ? "flex" : "hidden md:flex"}`}>
          {children}
        </div>
      </div>
    </ChatProvider>
  );
}