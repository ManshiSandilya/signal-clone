"use client";

import { useChat } from "@/lib/ChatContext";
import SettingsPanel from "@/components/SettingsPanel";

export default function ChatIndexPage() {
  const { showSettings, activeTab } = useChat();

  if (showSettings) {
    return <SettingsPanel />;
  }

  if (activeTab === "calls") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-signal-sidebar py-8 px-4 select-none h-full">
        <div className="flex flex-col items-center text-center">
          <div className="text-signal-text mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-signal-text flex items-center gap-1.5">
            Click 
            <span className="text-signal-text">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                <line x1="12" y1="2" x2="12" y2="10" />
                <line x1="8" y1="6" x2="16" y2="6" />
              </svg>
            </span>
            to start a new voice or video call.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === "stories") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-signal-sidebar py-8 px-4 select-none h-full">
        <div className="flex flex-col items-center text-center">
          <div className="text-signal-text mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="14" height="16" rx="2" ry="2" />
              <path d="M6 2h14a2 2 0 0 1 2 2v14" />
            </svg>
          </div>
          <p className="text-sm font-medium text-signal-text">
            Click to view a story
          </p>
        </div>
      </div>
    );
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
            <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="3.5" strokeDasharray="14 10" />
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