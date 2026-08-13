"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      router.push("/chat");
    } catch (err) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-signal-bg px-4">
      <div className="w-full max-w-sm bg-signal-panel rounded-2xl shadow-2xl border border-signal-border p-8">
        <div className="flex flex-col items-center mb-8">
          {/* Signal Welcome Icon */}
          <div className="w-14 h-14 rounded-2xl bg-signal-blue flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
            S
          </div>
          <h1 className="text-xl font-bold text-signal-text">Sign in to Signal</h1>
          <p className="text-xs text-signal-text-muted mt-1">Enter your phone number or username</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username or phone number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full bg-signal-input text-signal-text border border-signal-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue focus:border-signal-blue disabled:opacity-60 transition"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-signal-input text-signal-text border border-signal-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue focus:border-signal-blue disabled:opacity-60 transition"
            required
            disabled={loading}
          />

          {error && (
            <div className="bg-red-950/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg flex flex-col gap-0.5">
              <p className="text-xs font-semibold">Error</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-signal-text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-signal-blue font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}