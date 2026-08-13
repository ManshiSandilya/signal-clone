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
    <div className="min-h-screen flex items-center justify-center bg-signal-sidebar">
      <div className="w-full max-w-sm bg-signal-bg rounded-2xl shadow-sm border border-signal-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-signal-blue flex items-center justify-center text-white text-2xl font-semibold mb-3">
            S
          </div>
          <h1 className="text-xl font-semibold text-signal-text">Sign in</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username or phone number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="border border-signal-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-blue disabled:opacity-60"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-signal-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-blue disabled:opacity-60"
            required
            disabled={loading}
          />

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-signal-text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-signal-blue font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}