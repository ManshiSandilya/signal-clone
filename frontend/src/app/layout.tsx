import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Signal Clone - Secure Messaging",
  description: "A functional clone of Signal messenger with real-time messaging, contacts, and group chats",
};

function TitleBar() {
  return (
    <div className="hidden md:flex items-center px-4 py-1.5 bg-signal-bg border-b border-signal-border text-xs text-signal-text-muted select-none flex-shrink-0 drag-region" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <div className="flex items-center gap-2 mr-4">
        {/* Small Signal Logo */}
        <div className="w-4 h-4 rounded-full bg-signal-blue flex items-center justify-center p-[2px]">
          <div className="w-full h-full bg-signal-bg rounded-full flex items-center justify-center">
            <div className="w-full h-full bg-signal-blue rounded-full flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
        </div>
        <span className="font-semibold text-signal-text text-[13px]">Signal</span>
      </div>
      <div className="flex items-center gap-4 text-[13px] font-medium" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <span className="hover:text-signal-text cursor-pointer hover:bg-signal-sidebar-hover px-2 py-0.5 rounded transition">File</span>
        <span className="hover:text-signal-text cursor-pointer hover:bg-signal-sidebar-hover px-2 py-0.5 rounded transition">Edit</span>
        <span className="hover:text-signal-text cursor-pointer hover:bg-signal-sidebar-hover px-2 py-0.5 rounded transition">View</span>
        <span className="hover:text-signal-text cursor-pointer hover:bg-signal-sidebar-hover px-2 py-0.5 rounded transition">Window</span>
        <span className="hover:text-signal-text cursor-pointer hover:bg-signal-sidebar-hover px-2 py-0.5 rounded transition">Help</span>
      </div>
      <div className="ml-auto flex items-center gap-3 text-signal-text-muted" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        {/* Windows style window controls */}
        <button className="hover:bg-signal-sidebar-hover px-3 py-1 flex items-center justify-center transition">
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1"><line x1="1" y1="5" x2="9" y2="5"/></svg>
        </button>
        <button className="hover:bg-signal-sidebar-hover px-3 py-1 flex items-center justify-center transition">
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1" fill="none"><rect x="1.5" y="1.5" width="7" height="7"/></svg>
        </button>
        <button className="hover:bg-red-500 hover:text-white px-3 py-1 flex items-center justify-center transition">
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen overflow-hidden flex flex-col bg-signal-bg">
        <TitleBar />
        {children}
      </body>
    </html>
  );
}
