"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ideSections } from "@/data/content";
import Sidebar from "@/components/Sidebar";
import TabBar from "@/components/TabBar";
import StatusBar from "@/components/StatusBar";
import CodeView from "@/components/CodeView";

const RICK_ASCII = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠤⠒⠒⠒⠒⠠⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠞⠀⠀⠀⠀⠀⠀⠀⠘⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢻⠄⢠⠔⠒⠒⠒⠒⠒⢢⡀⢸⡄⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⡼⠀⠇⠀⠀⠀⠀⠀⠀⠀⢳⢸⠂⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣀⣹⠞⠀⠀⠀⠀⠀⠀⠀⠀⣸⣼⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠹⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡅⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠙⢲⠀⠀⠀⠀⠀⠀⠀⢠⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⢠⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⠀⠀⠀⠀⠀⠀⢸⡧⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⡠⠔⢚⡟⡏⠉⠙⡇⠀⠀⣠⠟⡇⠀⠉⠁⠀⠒⠠⠄⣀⠀⠀⠀
⠀⣠⠔⠊⠁⠀⠀⢸⠀⡇⠀⢰⠃⣀⠜⠁⢰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⡀
⡞⠀⠀⠀⠀⠀⠀⢸⣀⣇⣀⣸⣯⡁⠀⡠⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹
⡇⠀⠀⠀⠀⠀⠀⠈⢹⣰⠛⡆⠀⠈⠉⢰⠃⠀⠀⠀⠀⣴⠶⡀⠀⠀⠀⠀⢸
⡇⠀⠀⠀⠀⠀⠀⠀⢸⣟⠀⡇⠀⠀⠀⢸⠀⠀⠀⠀⠀⢹⠀⢇⠀⢴⣦⠀⣏
⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣴⠃⠀⠀⠀⢸⡄⠀⠀⠀⠀⢈⠀⠈⣓⢻⡟⢱⡛`;

function TerminalScreen({ onRelaunch }: { onRelaunch: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-3xl px-6 py-12">
        {phase >= 0 && (
          <pre className="font-mono text-sm text-green-400 text-left mb-4">
            $ kill -9 portfolio
          </pre>
        )}
        {phase >= 1 && (
          <motion.pre
            className="font-mono text-green-400 mb-6 text-sm leading-none sm:text-base sm:leading-none md:text-lg md:leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {RICK_ASCII}
          </motion.pre>
        )}
        {phase >= 2 && (
          <motion.div
            className="font-mono text-green-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm mb-1">{'>'} Never gonna give you up!</p>
            <p className="text-sm text-green-400/70">{'>'} Never gonna let you close this tab.</p>
          </motion.div>
        )}
        {phase >= 3 && (
          <motion.button
            onClick={onRelaunch}
            className="mt-8 font-mono text-sm text-green-400 underline underline-offset-4 hover:text-green-300 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            $ npm run dev &rarr; Fine, take me back
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function MinimizedDock({ onRestore }: { onRestore: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.button
        onClick={onRestore}
        className="flex items-center gap-3 rounded-2xl border border-border bg-ide-titlebar px-6 py-3 font-mono text-sm text-muted-foreground shadow-2xl transition-all hover:border-primary/50 hover:text-foreground hover:scale-105"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        Aftar Fadilah — Portfolio
        <span className="text-xs text-muted-foreground/60 ml-2">click to restore</span>
      </motion.button>
    </motion.div>
  );
}

export default function IDEShell({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<string>(ideSections[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const [showHint, setShowHint] = useState(false);
  const [windowState, setWindowState] = useState<"normal" | "terminated" | "minimized" | "zen">("normal");
  const editorRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback((id: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const el = editor.querySelector(`#${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const onScroll = () => {
      const atTop = editor.scrollTop < 100;
      const atBottom = editor.scrollHeight - editor.scrollTop - editor.clientHeight < 100;
      setShowHint(atTop || atBottom);
    };
    onScroll();
    editor.addEventListener("scroll", onScroll, { passive: true });
    return () => editor.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        root: editor,
        threshold: 0.3,
      }
    );

    const sections = editor.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [viewMode]);

  const zen = windowState === "zen";

  return (
    <>
      <AnimatePresence>
        {windowState === "terminated" && (
          <TerminalScreen onRelaunch={() => setWindowState("normal")} />
        )}
        {windowState === "minimized" && (
          <MinimizedDock onRestore={() => setWindowState("normal")} />
        )}
      </AnimatePresence>

      <div className={`h-screen flex flex-col bg-background ${windowState === "terminated" || windowState === "minimized" ? "invisible" : ""}`}>
        <div className="h-9 flex items-center shrink-0 bg-ide-titlebar border-b border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden ml-3 text-muted-foreground hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2 ml-4 group">
            <button
              onClick={() => setWindowState("terminated")}
              className="w-3 h-3 rounded-full transition-transform hover:scale-125"
              style={{ background: "#ff5f57" }}
              title="Close"
            />
            <button
              onClick={() => setWindowState("minimized")}
              className="w-3 h-3 rounded-full transition-transform hover:scale-125"
              style={{ background: "#febc2e" }}
              title="Minimize"
            />
            <button
              onClick={() => setWindowState(zen ? "normal" : "zen")}
              className="w-3 h-3 rounded-full transition-transform hover:scale-125"
              style={{ background: "#28c840" }}
              title={zen ? "Exit Zen Mode" : "Zen Mode"}
            />
          </div>

          <span className="flex-1 text-center text-xs text-muted-foreground font-mono">
            {zen ? "Zen Mode" : "Aftar Fadilah — Portfolio"}
          </span>

          <button
            onClick={() => setViewMode(viewMode === "preview" ? "source" : "preview")}
            className="mr-3 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={viewMode === "preview" ? "Switch to Source" : "Switch to Preview"}
          >
            {viewMode === "preview" ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Source
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview
              </>
            )}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {!zen && (
            <Sidebar
              activeSection={activeSection}
              onNavigate={handleNavigate}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex flex-1 flex-col overflow-hidden">
            {!zen && (
              <TabBar activeSection={activeSection} onNavigate={handleNavigate} />
            )}

            <div className="relative flex-1 overflow-hidden">
              {viewMode === "preview" && showHint && !zen && (
                <div className="pointer-events-none absolute right-4 top-4 z-10">
                  <span className="inline-flex animate-bounce items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    Try source view
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </span>
                </div>
              )}
              <div ref={editorRef} className="h-full overflow-y-auto">
                {viewMode === "preview" ? children : <CodeView />}
              </div>
            </div>
          </div>
        </div>

        {!zen && <StatusBar activeSection={activeSection} />}
      </div>
    </>
  );
}
