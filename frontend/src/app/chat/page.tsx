"use client";

import { useChat } from "@/lib/ChatContext";
import SettingsPanel from "@/components/SettingsPanel";

export default function ChatIndexPage() {
  const { showSettings } = useChat();

  if (showSettings) {
    return <SettingsPanel />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between bg-signal-bg py-8 px-4 select-none">
      {/* Empty spacer to push content to middle */}
      <div />

      {/* Center Welcome Box */}
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Signal Welcome Logo (Dashed Circle + Speech Bubble) */}
        <div className="text-signal-text/80 mb-6">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="3.5" strokeDasharray="8 6" />
            <path d="M60 32C44.536 32 32 44.536 32 60C32 67.848 35.256 74.92 40.528 80L36 92L48.88 87.792C52.336 89.208 56.08 90 60 90C75.464 90 88 77.464 88 60C88 44.536 75.464 32 60 32Z" fill="currentColor" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-signal-text mb-2">Welcome to Signal</h2>
        <p className="text-sm text-signal-text-muted">
          See{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Signal Clone v1.2.0 - Dark Mode & True Signal Layout Update");
            }}
            className="text-signal-blue font-medium hover:underline"
          >
            what&apos;s new
          </a>{" "}
          in this update
        </p>
      </div>

      {/* Footer Text */}
      <p className="text-xs text-signal-text-dim text-center">
        Signal is a 501c3 nonprofit
      </p>
    </div>
  );
}