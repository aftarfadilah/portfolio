"use client";

import { useState, useRef, useEffect } from "react";
import { chatResponses, socialLinks } from "@/data/content";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: "Hey! I'm not Aftar, but I've read everything he's done. Ask me about his work, stack, or projects — I'll do my best.",
};

const FALLBACK_RESPONSE =
  "I don't have a specific answer for that. Try asking about my experience, skills, projects, or contact info.";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  github: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  email: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
};

function findOfflineResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const key of Object.keys(chatResponses)) {
    if (lower.includes(key)) return chatResponses[key];
  }
  return FALLBACK_RESPONSE;
}

export default function ChatChapter() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.filter((m) => m !== INITIAL_MESSAGE),
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
    } catch {
      const fallback = findOfflineResponse(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", text: fallback }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="chat"
      className="bg-background px-6 py-32"
      style={{ scrollMarginTop: "6.5rem" }}
    >
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 font-mono text-sm tracking-widest text-syntax-comment">
          {"// 04"}
        </p>
        <h2 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl">
          Talk to &quot;Aftar&quot;
        </h2>
        <p className="mb-4 text-muted-foreground">
          Ask anything about engineering, testing, AI, or how I built things.
          You&apos;ll get an instant answer based on my actual work and experience.
        </p>
        <p className="mb-8 font-mono text-xs text-muted-foreground/50">
          AI-powered answers, trained on my knowledge base. It can be wrong sometimes.
        </p>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="max-h-[400px] min-h-[300px] space-y-4 overflow-y-auto p-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <p
                  className={
                    msg.role === "user"
                      ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-white"
                      : "max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm text-foreground"
                  }
                >
                  {msg.text}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2">
                  <span className="inline-flex gap-1 text-muted-foreground">
                    <span className="animate-bounce text-xs" style={{ animationDelay: "0ms" }}>.</span>
                    <span className="animate-bounce text-xs" style={{ animationDelay: "150ms" }}>.</span>
                    <span className="animate-bounce text-xs" style={{ animationDelay: "300ms" }}>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-3 border-t border-border p-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="What did you build at NoscAI?"
              disabled={loading}
              className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 font-mono text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">Or reach out directly:</p>
          <div className="flex justify-center gap-6">
            {socialLinks.map((link) => {
              const isEmail = link.icon === "email";
              return (
                <a
                  key={link.label}
                  href={link.href}
                  {...(!isEmail && { target: "_blank", rel: "noopener noreferrer" })}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {SOCIAL_ICONS[link.icon]}
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
