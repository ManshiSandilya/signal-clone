"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, sendOtp } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"initial" | "otp" | "profile">("initial");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter phone or username");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await sendOtp(phone).catch(() => null);
      setHint(data?.hint || "123456");
    } catch {
      setHint("123456");
    } finally {
      setStep("otp");
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length < 4) {
      setError("OTP must be at least 4 characters");
      return;
    }
    setStep("profile");
    setError("");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(phone, password, displayName, otp);
      router.push("/chat");
    } catch (err: any) {
      try {
        const errData = JSON.parse(err.message);
        setError(errData.detail || "Registration failed");
      } catch {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-signal-bg px-4">
      <div className="w-full max-w-sm bg-signal-panel rounded-2xl shadow-2xl border border-signal-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-signal-blue flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
            S
          </div>
          <h1 className="text-xl font-bold text-signal-text">Create account</h1>
          <p className="text-xs text-signal-text-muted mt-1">
            {step === "initial" && "Enter phone or username"}
            {step === "otp" && "Verify with OTP"}
            {step === "profile" && "Complete your profile"}
          </p>
        </div>

        {/* Step 1: Phone/Username */}
        {step === "initial" && (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Phone number or username"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              <div className="bg-red-950/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg">
                <p className="text-xs">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <p className="text-xs text-signal-text-muted text-center">
              Enter the OTP sent to <strong>{phone}</strong>
            </p>
            {hint && (
              <p className="text-xs text-signal-text-muted text-center bg-signal-input border border-signal-border px-3 py-2 rounded">
                Hint: {hint}
              </p>
            )}
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-signal-input text-signal-text border border-signal-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue focus:border-signal-blue transition"
              required
            />
            {error && (
              <div className="bg-red-950/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg">
                <p className="text-xs">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-3 text-sm font-semibold transition cursor-pointer shadow-md"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => setStep("initial")}
              className="text-signal-blue text-sm font-semibold hover:underline"
            >
              Back
            </button>
          </form>
        )}

        {/* Step 3: Profile */}
        {step === "profile" && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-signal-input text-signal-text border border-signal-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue focus:border-signal-blue disabled:opacity-60 transition"
              required
              disabled={loading}
            />
            {error && (
              <div className="bg-red-950/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg">
                <p className="text-xs">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => setStep("otp")}
              className="text-signal-blue text-sm font-semibold hover:underline"
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}

        <p className="text-center text-sm text-signal-text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-signal-blue font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
