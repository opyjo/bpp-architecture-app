"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { guides } from "@/data/guides";

const sidebarItems = guides.map((g) => ({ id: g.id, label: g.label }));

export default function GoGuidesTab() {
  return (
    <SectionLayout label="Go Guides" items={sidebarItems}>
      {(activeId) => {
        const guide = guides.find((g) => g.id === activeId);
        if (!guide) return null;
        return (
          <div>
            <div className="mb-4">
              <p className="text-[11px] text-arch-text3">{guide.description}</p>
            </div>
            <MarkdownRenderer content={guide.content} />
          </div>
        );
      }}
    </SectionLayout>
  );
}
