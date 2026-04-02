"use client";

import { ideSections } from "@/data/content";

interface TabBarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

function FileIcon({ icon }: { icon: "tsx" | "json" | "md" }) {
  if (icon === "tsx") return <span className="w-2 h-2 rounded-full bg-primary shrink-0" />;
  if (icon === "json") return <span className="w-2 h-2 rounded-full bg-syntax-function shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />;
}

export default function TabBar({ activeSection, onNavigate }: TabBarProps) {
  return (
    <div className="h-9 flex items-end bg-ide-tab-inactive border-b border-border overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {ideSections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={`h-full flex items-center gap-2 px-4 text-xs font-mono border-r border-border cursor-pointer transition-colors whitespace-nowrap ${
              isActive
                ? "bg-ide-tab-active text-foreground border-t-2 border-t-primary"
                : "bg-ide-tab-inactive text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileIcon icon={section.icon} />
            {section.file}
          </button>
        );
      })}
    </div>
  );
}
