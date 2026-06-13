"use client";

import { useState } from "react";
import ArchitectureTab from "@/components/tabs/ArchitectureTab";
import UiPagesTab from "@/components/tabs/UiPagesTab";
import PayloadsTab from "@/components/tabs/PayloadsTab";
import ErrorsTab from "@/components/tabs/ErrorsTab";
import KafkaEventsTab from "@/components/tabs/KafkaEventsTab";
import ReferenceTab from "@/components/tabs/ReferenceTab";
import AiChatTab from "@/components/tabs/AiChatTab";
import GoGuidesTab from "@/components/tabs/GoGuidesTab";

const tabs = [
  { id: "arch", label: "Architecture" },
  { id: "pages", label: "UI pages & flows" },
  { id: "payloads", label: "Payloads" },
  { id: "errors", label: "Errors & timing" },
  { id: "events", label: "Kafka events" },
  { id: "ref", label: "Reference" },
  { id: "ai", label: "AI Assistant" },
  { id: "guides", label: "Go Guides" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("arch");

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex bg-arch-bg3 border-b border-arch-border overflow-x-auto tab-bar-enter">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ animationDelay: `${i * 40}ms` }}
            className={`tab-item px-4 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-0 ${
              activeTab === tab.id
                ? "tab-item-active text-arch-blue"
                : "text-arch-text2 hover:text-arch-text hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1">
        {activeTab === "arch" && <ArchitectureTab />}
        {activeTab === "pages" && <UiPagesTab />}
        {activeTab === "payloads" && <PayloadsTab />}
        {activeTab === "errors" && <ErrorsTab />}
        {activeTab === "events" && <KafkaEventsTab />}
        {activeTab === "ref" && <ReferenceTab />}
        {activeTab === "ai" && <AiChatTab />}
        {activeTab === "guides" && <GoGuidesTab />}
      </div>
    </div>
  );
}
