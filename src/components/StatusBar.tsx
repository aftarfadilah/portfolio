"use client";

import { ideSections } from "@/data/content";

interface StatusBarProps {
  activeSection: string;
}

function GitBranchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z" />
    </svg>
  );
}

function getFileType(icon: "tsx" | "json" | "md"): string {
  if (icon === "tsx") return "TypeScript React";
  if (icon === "json") return "JSON";
  return "Markdown";
}

export default function StatusBar({ activeSection }: StatusBarProps) {
  const current = ideSections.find((s) => s.id === activeSection);
  const fileType = current ? getFileType(current.icon) : "TypeScript React";

  return (
    <div className="h-6 flex items-center justify-between px-3 bg-ide-statusbar text-white/90 text-[11px] font-mono shrink-0">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <GitBranchIcon />
          main
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span>{fileType}</span>
        <span>UTF-8</span>
        <span>Prettier</span>
      </div>
    </div>
  );
}
