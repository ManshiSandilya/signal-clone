"use client";

import React, { createContext, useContext, useState } from "react";

interface ChatContextType {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  activeSettingsTab: string;
  setActiveSettingsTab: (val: string) => void;
  activeTab: string;
  setActiveTab: (val: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("chats");
  const [activeTab, setActiveTab] = useState("chats");

  return (
    <ChatContext.Provider
      value={{
        showSettings,
        setShowSettings,
        activeSettingsTab,
        setActiveSettingsTab,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
