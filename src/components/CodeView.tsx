"use client";

import type { ReactNode } from "react";

function K({ children }: { children: ReactNode }) {
  return <span className="text-syntax-keyword">{children}</span>;
}
function S({ children }: { children: ReactNode }) {
  return <span className="text-syntax-string">{children}</span>;
}
function C({ children }: { children: ReactNode }) {
  return <span className="text-syntax-comment">{children}</span>;
}
function F({ children }: { children: ReactNode }) {
  return <span className="text-syntax-function">{children}</span>;
}
function P({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function CodeBlock({
  lines,
  startLine = 1,
}: {
  lines: ReactNode[];
  startLine?: number;
}) {
  return (
    <div className="flex">
      <div className="select-none shrink-0 pr-6 text-right text-ide-linenr font-mono text-sm leading-7 min-w-[3rem]">
        {lines.map((_, i) => (
          <div key={i}>{startLine + i}</div>
        ))}
      </div>
      <pre className="font-mono text-sm leading-7 overflow-x-auto text-foreground">
        {lines.map((line, i) => (
          <div key={i}>{line || "\u00A0"}</div>
        ))}
      </pre>
    </div>
  );
}

function FileHeader({ filename }: { filename: string }) {
  return (
    <div className="border-b border-border py-2 px-4 text-xs font-mono text-muted-foreground bg-ide-gutter">
      {filename}
    </div>
  );
}

function FileSection({
  id,
  filename,
  lines,
  startLine = 1,
}: {
  id: string;
  filename: string;
  lines: ReactNode[];
  startLine?: number;
}) {
  return (
    <section id={id} style={{ scrollMarginTop: "6.5rem" }}>
      <FileHeader filename={filename} />
      <div className="p-4">
        <CodeBlock lines={lines} startLine={startLine} />
      </div>
    </section>
  );
}

function HeroFile() {
  return (
    <FileSection
      id="hero"
      filename="hero.tsx"
      lines={[
        <C>{"// hero.tsx"}</C>,
        <C>{"// Portfolio entry point"}</C>,
        null,
        <><K>import</K> <P>{"{"}</P> Developer <P>{"}"}</P> <K>from</K> <S>{'"@/types"'}</S></>,
        null,
        <><K>interface</K> <F>SocialLinks</F> <P>{"{"}</P></>,
        <> {"  "}<F>github</F><P>:</P> <K>string</K></>,
        <> {"  "}<F>linkedin</F><P>:</P> <K>string</K></>,
        <> {"  "}<F>email</F><P>:</P> <K>string</K></>,
        <P>{"}"}</P>,
        null,
        <><K>const</K> <F>aftar</F><P>:</P> Developer <P>=</P> <P>{"{"}</P></>,
        <> {"  "}name<P>:</P> <S>{'"Aftar Fadilah"'}</S><P>,</P></>,
        <> {"  "}role<P>:</P> <S>{'"Software Engineer & Founder"'}</S><P>,</P></>,
        <> {"  "}mission<P>:</P> <S>{'"Building AI-powered products that solve real problems"'}</S><P>,</P></>,
        <> {"  "}location<P>:</P> <S>{'"Indonesia"'}</S><P>,</P></>,
        <> {"  "}links<P>:</P> <P>{"{"}</P></>,
        <> {"    "}github<P>:</P> <S>{'"github.com/aftarfadilah"'}</S><P>,</P></>,
        <> {"    "}linkedin<P>:</P> <S>{'"linkedin.com/in/aftarfadilah"'}</S><P>,</P></>,
        <> {"    "}email<P>:</P> <S>{'"aftarfadilah@gmail.com"'}</S></>,
        <> {"  "}<P>{"}"}</P></>,
        <P>{"}"}</P>,
        null,
        <><K>export default</K> <K>function</K> <F>Hero</F><P>()</P> <P>{"{"}</P></>,
        <> {"  "}<K>return</K> <P>{"<"}</P><F>Introduce</F> developer<P>=</P><P>{"{"}</P>aftar<P>{"}"}</P> <P>{"/>"}</P></>,
        <P>{"}"}</P>,
      ]}
    />
  );
}

function BeginningFile() {
  return (
    <FileSection
      id="beginning"
      filename="beginning.tsx"
      startLine={1}
      lines={[
        <C>{"// beginning.tsx"}</C>,
        <C>{"// Chapter 01 \u2014 The Beginning"}</C>,
        null,
        <C>{"/**"}</C>,
        <C>{" * It started with curiosity \u2014 tinkering with code"}</C>,
        <C>{" * as a teenager, breaking things to understand how"}</C>,
        <C>{" * they worked."}</C>,
        <C>{" */"}</C>,
        null,
        <><K>const</K> <F>journey</F> <P>=</P> <P>{"{"}</P></>,
        <> {"  "}origin<P>:</P> <S>{'"Late-night experiments with code"'}</S><P>,</P></>,
        <> {"  "}growth<P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"React"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Vue.js"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Node.js"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Laravel"'}</S></>,
        <> {"  "}<P>]</P><P>,</P></>,
        <> {"  "}philosophy<P>:</P> <S>{'"Ship fast, iterate often"'}</S><P>,</P></>,
        <> {"  "}destination<P>:</P> <S>{'"Hamburg, Germany"'}</S></>,
        <P>{"}"}</P>,
        null,
        <><K>function</K> <F>evolve</F><P>(</P>curiosity<P>:</P> <K>string</K><P>)</P><P>:</P> Developer <P>{"{"}</P></>,
        <> {"  "}<C>{"// What began as late-night experiments"}</C></>,
        <> {"  "}<C>{"// quickly became an obsession with building"}</C></>,
        <> {"  "}<C>{"// things that actually work."}</C></>,
        <> {"  "}<K>return</K> <P>{"{"}</P></>,
        <> {"    "}skills<P>:</P> journey<P>.</P>growth<P>,</P></>,
        <> {"    "}location<P>:</P> journey<P>.</P>destination<P>,</P></>,
        <> {"    "}ready<P>:</P> <K>true</K></>,
        <> {"  "}<P>{"}"}</P></>,
        <P>{"}"}</P>,
      ]}
    />
  );
}

function ClinicosFile() {
  return (
    <FileSection
      id="clinicos"
      filename="clinicos.tsx"
      startLine={1}
      lines={[
        <C>{"// clinicos.tsx"}</C>,
        <C>{"// Chapter 02 \u2014 Building ClinicOS"}</C>,
        null,
        <><K>import</K> <P>{"{"}</P> QAEngineer <P>{"}"}</P> <K>from</K> <S>{'"@/roles"'}</S></>,
        null,
        <><K>const</K> <F>clinicOS</F> <P>=</P> <P>{"{"}</P></>,
        <> {"  "}company<P>:</P> <S>{'"NoscAI GmbH"'}</S><P>,</P></>,
        <> {"  "}location<P>:</P> <S>{'"Hamburg, Germany"'}</S><P>,</P></>,
        <> {"  "}product<P>:</P> <S>{'"ClinicOS"'}</S><P>,</P></>,
        <> {"  "}tagline<P>:</P> <S>{'"Germany\'s first AI-integrated physician information system"'}</S><P>,</P></>,
        <> {"  "}testCoverage<P>:</P> <S>0.90</S><P>,</P> {"  "}<C>{"// Built 90% of test automation infrastructure"}</C></>,
        <> {"  "}features<P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"AI Medical Transcription"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Automated Documentation"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Patient Management"'}</S><P>,</P></>,
        <> {"    "}<S>{'"GO\u00C4 Billing & GDPR Compliance"'}</S></>,
        <> {"  "}<P>]</P><P>,</P></>,
        <> {"  "}awards<P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"AI.SUMMIT 2024 \u2014 Jury Award"'}</S><P>,</P></>,
        <> {"    "}<S>{'"AI.SUMMIT 2024 \u2014 Audience Award"'}</S><P>,</P></>,
        <> {"    "}<S>{'"#1 AI Startup Hub Hamburg Accelerator"'}</S></>,
        <> {"  "}<P>]</P></>,
        <P>{"}"}</P>,
        null,
        <C>{"// When a bug isn't just a bug \u2014 it's patient safety."}</C>,
        <C>{"// Quality isn't optional. It's everything."}</C>,
        null,
        <><K>export</K> <K>function</K> <F>buildQuality</F><P>(</P>platform<P>:</P> Platform<P>)</P><P>:</P> <K>void</K> <P>{"{"}</P></>,
        <> {"  "}<F>assert</F><P>(</P>platform<P>.</P>testCoverage <P>{">"}</P> <S>0.85</S><P>)</P></>,
        <> {"  "}<F>assert</F><P>(</P>platform<P>.</P>gdprCompliant <P>===</P> <K>true</K><P>)</P></>,
        <> {"  "}<F>assert</F><P>(</P>platform<P>.</P>patientsFirst <P>===</P> <K>true</K><P>)</P></>,
        <P>{"}"}</P>,
      ]}
    />
  );
}

function ShiroLabsFile() {
  return (
    <FileSection
      id="now"
      filename="shirolabs.tsx"
      startLine={1}
      lines={[
        <C>{"// shirolabs.tsx"}</C>,
        <C>{"// Chapter 03 \u2014 What I'm Building Now"}</C>,
        null,
        <><K>const</K> <F>evolution</F> <P>=</P> <P>[</P></>,
        <> {"  "}<S>{'"QA Engineer"'}</S><P>,</P></>,
        <> {"  "}<S>{'"Product Builder"'}</S><P>,</P></>,
        <> {"  "}<S>{'"Founder"'}</S></>,
        <><P>{"]"}</P> <K>as const</K></>,
        null,
        <><K>type</K> <F>CurrentRole</F> <P>=</P> <K>typeof</K> evolution<P>{"["}</P><S>2</S><P>{"]"}</P> {"  "}<C>{"// \"Founder\""}</C></>,
        null,
        <><K>const</K> <F>shiroLabs</F> <P>=</P> <P>{"{"}</P></>,
        <> {"  "}name<P>:</P> <S>{'"Shiro Labs"'}</S><P>,</P></>,
        <> {"  "}focus<P>:</P> <S>{'"AI-powered B2B products"'}</S><P>,</P></>,
        <> {"  "}status<P>:</P> <S>{'"active"'}</S> <K>as const</K><P>,</P></>,
        <P>{"}"}</P>,
        null,
        <><K>const</K> <F>cariin</F> <P>=</P> <P>{"{"}</P></>,
        <> {"  "}name<P>:</P> <S>{'"Cariin"'}</S><P>,</P></>,
        <> {"  "}status<P>:</P> <S>{'"coming-soon"'}</S> <K>as const</K><P>,</P></>,
        <> {"  "}description<P>:</P> <S>{'"B2B hiring management with AI skill matching"'}</S><P>,</P></>,
        <> {"  "}stack<P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"Next.js"'}</S><P>,</P></>,
        <> {"    "}<S>{'"TypeScript"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Prisma"'}</S><P>,</P></>,
        <> {"    "}<S>{'"PostgreSQL"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Claude API"'}</S></>,
        <> {"  "}<P>]</P></>,
        <P>{"}"}</P>,
        null,
        <C>{"// From ensuring quality to building products."}</C>,
      ]}
    />
  );
}

function StackFile() {
  return (
    <FileSection
      id="stack"
      filename="stack.json"
      startLine={1}
      lines={[
        <P>{"{"}</P>,
        <> {"  "}<K>{'"// stack.json"'}</K><P>:</P> <S>{'"Chapter 04 \u2014 The Stack"'}</S><P>,</P></>,
        null,
        <> {"  "}<K>{'"frontend"'}</K><P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"React"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Next.js"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Vue.js"'}</S><P>,</P></>,
        <> {"    "}<S>{'"TypeScript"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Tailwind CSS"'}</S></>,
        <> {"  "}<P>]</P><P>,</P></>,
        <> {"  "}<K>{'"backend"'}</K><P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"Node.js"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Laravel"'}</S><P>,</P></>,
        <> {"    "}<S>{'"PostgreSQL"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Prisma"'}</S></>,
        <> {"  "}<P>]</P><P>,</P></>,
        <> {"  "}<K>{'"testing"'}</K><P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"Playwright"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Cypress"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Jest"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Testing Library"'}</S></>,
        <> {"  "}<P>]</P><P>,</P></>,
        <> {"  "}<K>{'"devops"'}</K><P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"GitHub Actions"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Docker"'}</S><P>,</P></>,
        <> {"    "}<S>{'"CI/CD"'}</S><P>,</P></>,
        <> {"    "}<S>{'"Vercel"'}</S></>,
        <> {"  "}<P>]</P><P>,</P></>,
        <> {"  "}<K>{'"ai"'}</K><P>:</P> <P>[</P></>,
        <> {"    "}<S>{'"Claude API"'}</S><P>,</P></>,
        <> {"    "}<S>{'"NLP"'}</S><P>,</P></>,
        <> {"    "}<S>{'"ML Pipelines"'}</S><P>,</P></>,
        <> {"    "}<S>{'"LangChain"'}</S></>,
        <> {"  "}<P>]</P></>,
        <P>{"}"}</P>,
      ]}
    />
  );
}

function ContactFile() {
  return (
    <FileSection
      id="contact"
      filename="contact.md"
      startLine={1}
      lines={[
        <><P>#</P> <strong>{"Let's build something together"}</strong></>,
        <C>{"<!-- Chapter 05 \u2014 Contact -->"}</C>,
        null,
        <>Have a project in mind, want to collaborate,</>,
        <>or just want to say hi?</>,
        null,
        <><P>##</P> <strong>Links</strong></>,
        null,
        <><P>-</P> <strong>GitHub</strong>: <P>[</P><K>github.com/aftarfadilah</K><P>]</P><P>(</P><S>https://github.com/aftarfadilah</S><P>)</P></>,
        <><P>-</P> <strong>LinkedIn</strong>: <P>[</P><K>linkedin.com/in/aftarfadilah</K><P>]</P><P>(</P><S>https://linkedin.com/in/aftarfadilah</S><P>)</P></>,
        <><P>-</P> <strong>Email</strong>: <P>[</P><K>aftarfadilah@gmail.com</K><P>]</P><P>(</P><S>mailto:aftarfadilah@gmail.com</S><P>)</P></>,
        null,
        <P>---</P>,
        null,
        <><S><em>Always open to interesting conversations.</em></S></>,
      ]}
    />
  );
}

export default function CodeView() {
  return (
    <div className="pb-32">
      <HeroFile />
      <BeginningFile />
      <ClinicosFile />
      <ShiroLabsFile />
      <StackFile />
      <ContactFile />
    </div>
  );
}
