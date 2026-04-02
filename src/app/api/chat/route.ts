import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Aftar Fadilah's AI assistant on his portfolio website. Answer questions about his background, experience, skills, and projects. Keep responses concise (2-4 sentences max). Be friendly and professional.

Here is Aftar's background:

EXPERIENCE:
- QA Engineer at NoscAI (Dec 2025 — Present, full-time, remote). End-to-end testing and test automation for ClinicOS.
- Founder of Shiro Labs (Sep 2025 — Present). Building Cariin — a B2B hiring platform with AI skill matching.
- Laravel Developer Intern at Yayasan Pendidikan BAIK (Feb 2025 — Aug 2025, Surabaya). Built education platform for overseas study consultation.
- Career break (Aug 2024 — Feb 2025) to finish bachelor's degree.
- Frontend Developer at NoscAI (Nov 2022 — Aug 2024, part-time, remote). Built the ClinicOS frontend. One of the first 4 team members.
- Website Developer Intern at Alamaya Online Indonesia (Jul 2018 — Jun 2019, Bali). WordPress development.

ABOUT CLINICOS:
- Germany's first AI-integrated physician information system
- AI-powered medical transcription, patient management, GOÄ billing
- GDPR-compliant healthcare cloud platform
- Won AI.SUMMIT 2024 jury + audience award
- 1st place AI Startup Hub Hamburg Accelerator

SKILLS:
- Frontend: React, Next.js, Vue.js, TypeScript, Tailwind CSS
- Backend: Node.js, Laravel, PostgreSQL, Prisma
- Testing: Playwright, Cypress, Jest, Testing Library
- DevOps: GitHub Actions, Docker, CI/CD, Vercel
- AI: Claude API, LangChain, NLP, ML Pipelines

CONTACT:
- Email: me@aftarfadilah.com
- GitHub: github.com/aftarfadilah
- LinkedIn: linkedin.com/in/aftarfadilah
- Location: Indonesia

If asked something you don't know about Aftar, say so honestly and suggest they reach out directly.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI chat is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== "string" || message.length > 500) {
      return NextResponse.json(
        { error: "Invalid message." },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey });

    const messages: Anthropic.MessageParam[] = [
      ...(history || []).slice(-6).map((m: { role: string; text: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
