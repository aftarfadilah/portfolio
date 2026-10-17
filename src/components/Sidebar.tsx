"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ideSections } from "@/data/content";

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function FileIcon({ icon }: { icon: "tsx" | "json" | "md" }) {
  if (icon === "tsx") return <span className="w-2 h-2 rounded-full bg-primary shrink-0" />;
  if (icon === "json") return <span className="w-2 h-2 rounded-full bg-syntax-function shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />;
}

const noopSubscribe = () => () => {};

/** The "installer" extension that matches the visitor's OS: .dmg on Apple devices, .exe elsewhere. */
function useInstallerExt() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "dmg" : "exe"),
    () => "exe",
  );
}

const apps = [
  { href: "/player", name: "turntable", title: "Open the turntable", dot: "bg-syntax-function" },
  { href: "/kanagawa", name: "kanagawa", title: "Open the Great Wave", dot: "bg-syntax-string" },
];

export default function Sidebar({ activeSection, onNavigate, isOpen, onClose }: SidebarProps) {
  const [portfolioOpen, setPortfolioOpen] = useState(true);
  const [srcOpen, setSrcOpen] = useState(true);
  const [appOpen, setAppOpen] = useState(true);
  const ext = useInstallerExt();

  const content = (
    <div className="flex flex-col h-full">
      <div className="text-[10px] tracking-widest text-muted-foreground font-semibold uppercase px-4 py-2">
        Explorer
      </div>

      <button
        onClick={() => setPortfolioOpen(!portfolioOpen)}
        className="text-sm font-mono py-1 px-2 mx-2 rounded flex items-center gap-2 text-left text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="text-xs">{portfolioOpen ? "▾" : "▸"}</span>
        portfolio
      </button>

      {portfolioOpen && (
        <>
          <button
            onClick={() => setSrcOpen(!srcOpen)}
            className="text-sm font-mono py-1 px-2 ml-5 mr-2 rounded flex items-center gap-2 text-left text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs">{srcOpen ? "▾" : "▸"}</span>
            src
          </button>

          {srcOpen && (
            <nav className="flex flex-col">
              {ideSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => onNavigate(section.id)}
                  className={`text-sm font-mono py-1 px-2 ml-8 mr-2 rounded flex items-center gap-2 text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <FileIcon icon={section.icon} />
                  {section.file}
                </button>
              ))}
            </nav>
          )}

          <button
            onClick={() => setAppOpen(!appOpen)}
            className="text-sm font-mono py-1 px-2 ml-5 mr-2 rounded flex items-center gap-2 text-left text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs">{appOpen ? "▾" : "▸"}</span>
            app
          </button>

          {appOpen &&
            apps.map((app) => (
              <Link
                key={app.href}
                href={app.href}
                title={app.title}
                className="text-sm font-mono py-1 px-2 ml-8 mr-2 rounded flex items-center gap-2 text-left text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${app.dot} shrink-0`} />
                {app.name}.{ext}
              </Link>
            ))}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[220px] shrink-0 bg-ide-sidebar border-r border-border overflow-y-auto">
        {content}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[220px] bg-ide-sidebar border-r border-border overflow-y-auto z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
