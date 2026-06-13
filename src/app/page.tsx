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
        <div className="ml-auto flex items-center pr-3">
          <a
            href="https://go.dev/tour"
            target="_blank"
            rel="noopener noreferrer"
            className="tab-item flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-arch-blue/15 text-arch-blue border border-arch-blue/30 hover:bg-arch-blue/25 transition-colors whitespace-nowrap"
          >
            A Tour of Go
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
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
