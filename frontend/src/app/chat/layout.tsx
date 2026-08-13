"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api";
import { getToken } from "@/lib/api";
import { User } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="flex h-screen bg-signal-bg overflow-hidden">
      <Sidebar me={me} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}