"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

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
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_or_username: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to send OTP");
        return;
      }
      setHint(data.hint || "OTP sent (mocked)");
      setStep("otp");
    } catch (err) {
      setError("Error sending OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    // In a real app, verify OTP; here we just accept any OTP
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
    <div className="min-h-screen flex items-center justify-center bg-signal-sidebar">
      <div className="w-full max-w-sm bg-signal-bg rounded-2xl shadow-sm border border-signal-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-signal-blue flex items-center justify-center text-white text-2xl font-semibold mb-3">
            S
          </div>
          <h1 className="text-xl font-semibold text-signal-text">Create account</h1>
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
                <p className="text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
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
            {hint && <p className="text-xs text-signal-text-muted text-center bg-signal-sidebar px-3 py-2 rounded">{hint}</p>}
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border border-signal-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-blue"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-2.5 text-sm font-medium transition"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => setStep("initial")}
              className="text-signal-blue text-sm font-medium"
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
              className="border border-signal-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-blue disabled:opacity-60"
              required
              disabled={loading}
            />
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => setStep("otp")}
              className="text-signal-blue text-sm font-medium hover:underline"
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}

        <p className="text-center text-sm text-signal-text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-signal-blue font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
