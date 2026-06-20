"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ArchitectureTab from "@/components/tabs/ArchitectureTab";
import UiPagesTab from "@/components/tabs/UiPagesTab";
import KafkaEventsTab from "@/components/tabs/KafkaEventsTab";
import ReferenceTab from "@/components/tabs/ReferenceTab";
import AiChatTab from "@/components/tabs/AiChatTab";
import LambdaFunctionsTab from "@/components/tabs/LambdaFunctionsTab";
import RepoExplorerTab from "@/components/tabs/RepoExplorerTab";
import FeatureFlagsTab from "@/components/tabs/FeatureFlagsTab";
import LearningsTab from "@/components/tabs/LearningsTab";
import ServicesTab from "@/components/tabs/ServicesTab";
import BsaCheatsheetTab from "@/components/tabs/BsaCheatsheetTab";
import InterviewCoachTab from "@/components/tabs/InterviewCoachTab";
import MicrofrontendsTab from "@/components/tabs/MicrofrontendsTab";
import ApigeeTab from "@/components/tabs/ApigeeTab";

const tabGroups = [
  {
    label: "Platform",
    tintClass: "tab-group-platform",
    tabs: [
      { id: "arch", label: "Architecture" },
      { id: "pages", label: "UI pages & flows" },
      { id: "events", label: "Kafka events" },
      { id: "lambdas", label: "Lambda functions" },
      { id: "services", label: "Services" },
      { id: "mfe", label: "Microfrontends" },
    ],
  },
  {
    label: "Reference",
    tintClass: "tab-group-reference",
    tabs: [
      { id: "repo", label: "Repo" },
      { id: "ref", label: "Reference" },
      { id: "flags", label: "Feature Flags" },
      { id: "learnings", label: "Learnings" },
    ],
  },
  {
    label: "Interview Prep",
    tintClass: "tab-group-interview",
    tabs: [
      { id: "bsa", label: "BSA Cheatsheet" },
      { id: "apigee", label: "Apigee" },
    ],
  },
];
const standaloneTabs = [
  { id: "coach", label: "Interview Coach", tintClass: "tab-group-interview" },
  { id: "ai", label: "AI Assistant", tintClass: "tab-group-ai" },
];

function TabDropdown({
  group,
  activeTab,
  setActiveTab,
  animIndex,
}: {
  group: (typeof tabGroups)[number];
  activeTab: string;
  setActiveTab: (id: string) => void;
  animIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeChild = group.tabs.find((t) => t.id === activeTab);
  const isGroupActive = !!activeChild;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        style={{ animationDelay: `${animIndex * 40}ms` }}
        className={`tab-item px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-0 flex items-center gap-1.5 transition-all duration-200 ${group.tintClass} ${
          isGroupActive
            ? "tab-item-active tab-group-active text-arch-blue"
            : "text-arch-text2 hover:text-arch-text"
        }`}
      >
        {isGroupActive ? `${group.label}: ${activeChild.label}` : group.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-panel absolute top-full left-0 mt-1 z-50 min-w-[210px] py-2 px-0.5 bg-arch-bg2/95 border border-arch-border rounded-lg shadow-lg shadow-black/20">
          {group.tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setOpen(false);
              }}
              className={`dropdown-item w-full text-left px-3.5 py-2 text-xs font-medium transition-colors duration-150 ${
                activeTab === tab.id
                  ? "text-arch-blue bg-arch-blue/10"
                  : "text-arch-text2 hover:text-arch-text hover:bg-arch-blue/[0.08]"
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("arch");

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex bg-arch-bg3 border-b border-arch-border tab-bar-enter">
        {tabGroups.map((group, i) => (
          <TabDropdown
            key={group.label}
            group={group}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            animIndex={i}
          />
        ))}
        {standaloneTabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ animationDelay: `${(tabGroups.length + i) * 40}ms` }}
            className={`tab-item px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-0 ${tab.tintClass} transition-all duration-200 ${
              activeTab === tab.id
                ? "tab-item-active tab-group-active text-arch-blue"
                : "text-arch-text2 hover:text-arch-text"
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
      <div className="flex-1 overflow-hidden">
        {activeTab === "arch" && <ArchitectureTab />}
        {activeTab === "pages" && <UiPagesTab />}
        {activeTab === "events" && <KafkaEventsTab />}
        {activeTab === "lambdas" && <LambdaFunctionsTab />}
        {activeTab === "repo" && <RepoExplorerTab />}
        {activeTab === "ref" && <ReferenceTab />}
        {activeTab === "flags" && <FeatureFlagsTab />}
        {activeTab === "learnings" && <LearningsTab />}
        {activeTab === "services" && <ServicesTab />}
        {activeTab === "mfe" && <MicrofrontendsTab />}
        {activeTab === "bsa" && <BsaCheatsheetTab />}
        {activeTab === "apigee" && <ApigeeTab />}
        {activeTab === "ai" && <AiChatTab />}
        {activeTab === "coach" && <InterviewCoachTab />}
      </div>
    </div>
  );
}
