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

function CodeBlock({ lines, startLine = 1 }: { lines: ReactNode[]; startLine?: number }) {
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

function FileSection({ id, filename, lines, startLine = 1 }: { id: string; filename: string; lines: ReactNode[]; startLine?: number }) {
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
        null,
        <><K>import</K> <P>{"{"}</P> <F>Developer</F> <P>{"}"}</P> <K>from</K> <S>{'"@/types"'}</S></>,
        null,
        <><K>const</K> <F>aftar</F><P>:</P> <F>Developer</F> <P>=</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><F>name</F><P>:</P> <S>{'"Aftar Fadilah"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>role</F><P>:</P> <S>{'"Software Engineer & Founder"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>focus</F><P>:</P> <S>{'"AI products and test automation"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>location</F><P>:</P> <S>{'"Indonesia"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>links</F><P>:</P> <P>{"{"}</P></>,
        <><P>{"    "}</P><F>github</F><P>:</P> <S>{'"github.com/aftarfadilah"'}</S><P>,</P></>,
        <><P>{"    "}</P><F>linkedin</F><P>:</P> <S>{'"linkedin.com/in/aftarfadilah"'}</S><P>,</P></>,
        <><P>{"    "}</P><F>email</F><P>:</P> <S>{'"aftarfadilah@gmail.com"'}</S></>,
        <><P>{"  }"}</P></>,
        <><P>{"}"}</P></>,
        null,
        <><K>export</K> <K>default</K> <K>function</K> <F>Hero</F><P>()</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><K>return</K> <P>{"<"}</P><F>Introduce</F> <F>developer</F><P>={"{"}</P><F>aftar</F><P>{"}"}</P> <P>/{">"}</P></>,
        <><P>{"}"}</P></>,
      ]}
    />
  );
}

function ExperienceFile() {
  return (
    <FileSection
      id="experience"
      filename="experience.tsx"
      startLine={1}
      lines={[
        <C>{"// experience.tsx"}</C>,
        null,
        <><K>const</K> <F>noscai</F> <P>=</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><F>company</F><P>:</P> <S>{'"NoscAI GmbH"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>location</F><P>:</P> <S>{'"Hamburg, Germany"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>period</F><P>:</P> <S>{'"2022 — 2024"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>roles</F><P>:</P> <P>[</P><S>{'"Frontend Engineer"'}</S><P>,</P> <S>{'"QA Engineer"'}</S><P>],</P></>,
        <><P>{"  "}</P><F>team</F><P>:</P> <S>4</S><P>,</P> <C>{"// core founding team"}</C></>,
        <><P>{"  "}</P><F>product</F><P>:</P> <S>{'"ClinicOS"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>testCoverage</F><P>:</P> <S>0.90</S><P>,</P></>,
        <><P>{"  "}</P><F>awards</F><P>:</P> <P>[</P></>,
        <><P>{"    "}</P><S>{'"AI.SUMMIT 2024 — Jury + Audience Award"'}</S><P>,</P></>,
        <><P>{"    "}</P><S>{'"1st Place AI Startup Hub Hamburg"'}</S><P>,</P></>,
        <><P>{"  ]"}</P></>,
        <><P>{"}"}</P></>,
        null,
        <><K>const</K> <F>shiroLabs</F> <P>=</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><F>company</F><P>:</P> <S>{'"Shiro Labs"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>role</F><P>:</P> <S>{'"Founder"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>period</F><P>:</P> <S>{'"2024 — Present"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>focus</F><P>:</P> <S>{'"AI-powered B2B tools"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>building</F><P>:</P> <S>{'"Cariin — hiring with AI skill matching"'}</S></>,
        <><P>{"}"}</P></>,
        null,
        <><K>export</K> <K>default</K> <K>function</K> <F>Experience</F><P>()</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><K>return</K> <P>{"<"}</P><F>Timeline</F> <F>entries</F><P>={"{"}</P><P>[</P><F>noscai</F><P>,</P> <F>shiroLabs</F><P>]</P><P>{"}"}</P> <P>/{">"}</P></>,
        <><P>{"}"}</P></>,
      ]}
    />
  );
}

function ExpertiseFile() {
  return (
    <FileSection
      id="expertise"
      filename="expertise.tsx"
      startLine={1}
      lines={[
        <C>{"// expertise.tsx"}</C>,
        null,
        <><K>const</K> <F>areas</F> <P>=</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><F>frontend</F><P>:</P> <P>[</P><S>{'"React"'}</S><P>,</P> <S>{'"Next.js"'}</S><P>,</P> <S>{'"Vue.js"'}</S><P>,</P> <S>{'"TypeScript"'}</S><P>,</P> <S>{'"Tailwind CSS"'}</S><P>],</P></>,
        <><P>{"  "}</P><F>testing</F><P>:</P> <P>[</P><S>{'"Playwright"'}</S><P>,</P> <S>{'"Cypress"'}</S><P>,</P> <S>{'"Jest"'}</S><P>,</P> <S>{'"Testing Library"'}</S><P>,</P> <S>{'"CI/CD"'}</S><P>],</P></>,
        <><P>{"  "}</P><F>ai</F><P>:</P> <P>[</P><S>{'"Claude API"'}</S><P>,</P> <S>{'"LangChain"'}</S><P>,</P> <S>{'"NLP"'}</S><P>,</P> <S>{'"ML Pipelines"'}</S><P>,</P> <S>{'"RAG"'}</S><P>],</P></>,
        <><P>{"  "}</P><F>backend</F><P>:</P> <P>[</P><S>{'"Node.js"'}</S><P>,</P> <S>{'"Laravel"'}</S><P>,</P> <S>{'"PostgreSQL"'}</S><P>,</P> <S>{'"Prisma"'}</S><P>,</P> <S>{'"Docker"'}</S><P>]</P></>,
        <><P>{"}"}</P></>,
        null,
        <><K>type</K> <F>Specialty</F> <P>=</P> <K>keyof</K> <K>typeof</K> <F>areas</F></>,
        null,
        <><K>function</K> <F>getSkills</F><P>(</P><F>area</F><P>:</P> <F>Specialty</F><P>)</P><P>:</P> <K>string</K><P>[]</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><K>return</K> <F>areas</F><P>[</P><F>area</F><P>]</P></>,
        <><P>{"}"}</P></>,
        null,
        <C>{"// Frontend, QA, AI, Full-stack — in that order."}</C>,
      ]}
    />
  );
}

function ProjectsFile() {
  return (
    <FileSection
      id="projects"
      filename="projects.tsx"
      startLine={1}
      lines={[
        <C>{"// projects.tsx"}</C>,
        null,
        <><K>interface</K> <F>Project</F> <P>{"{"}</P></>,
        <><P>{"  "}</P><F>name</F><P>:</P> <K>string</K></>,
        <><P>{"  "}</P><F>status</F><P>:</P> <S>{'"live"'}</S> <P>|</P> <S>{'"coming-soon"'}</S></>,
        <><P>{"  "}</P><F>stack</F><P>:</P> <K>string</K><P>[]</P></>,
        <><P>{"}"}</P></>,
        null,
        <><K>const</K> <F>projects</F><P>:</P> <F>Project</F><P>[]</P> <P>=</P> <P>[</P></>,
        <><P>{"  {"}</P></>,
        <><P>{"    "}</P><F>name</F><P>:</P> <S>{'"Cariin"'}</S><P>,</P></>,
        <><P>{"    "}</P><F>status</F><P>:</P> <S>{'"coming-soon"'}</S><P>,</P></>,
        <><P>{"    "}</P><F>stack</F><P>:</P> <P>[</P><S>{'"Next.js"'}</S><P>,</P> <S>{'"Prisma"'}</S><P>,</P> <S>{'"PostgreSQL"'}</S><P>,</P> <S>{'"Claude API"'}</S><P>],</P></>,
        <><P>{"  },"}</P></>,
        <><P>{"  {"}</P></>,
        <><P>{"    "}</P><F>name</F><P>:</P> <S>{'"This Portfolio"'}</S><P>,</P></>,
        <><P>{"    "}</P><F>status</F><P>:</P> <S>{'"live"'}</S><P>,</P></>,
        <><P>{"    "}</P><F>stack</F><P>:</P> <P>[</P><S>{'"Next.js 16"'}</S><P>,</P> <S>{'"React 19"'}</S><P>,</P> <S>{'"Tailwind 4"'}</S><P>,</P> <S>{'"Framer Motion"'}</S><P>],</P></>,
        <><P>{"  }"}</P></>,
        <><P>]</P></>,
        null,
        <C>{"// Side projects and things I'm building."}</C>,
      ]}
    />
  );
}

function ChatFile() {
  return (
    <FileSection
      id="chat"
      filename="chat.tsx"
      startLine={1}
      lines={[
        <C>{"// chat.tsx"}</C>,
        null,
        <><K>import</K> <P>{"{"}</P> <F>createChat</F> <P>{"}"}</P> <K>from</K> <S>{'"@/lib/ai"'}</S></>,
        null,
        <><K>const</K> <F>knowledge</F> <P>=</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><F>experience</F><P>:</P> <S>{'"NoscAI GmbH → Shiro Labs"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>skills</F><P>:</P> <S>{'"Frontend, QA, AI, Full-stack"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>projects</F><P>:</P> <S>{'"Cariin, Portfolio"'}</S><P>,</P></>,
        <><P>{"  "}</P><F>contact</F><P>:</P> <S>{'"aftarfadilah@gmail.com"'}</S></>,
        <><P>{"}"}</P></>,
        null,
        <><K>async</K> <K>function</K> <F>respond</F><P>(</P><F>input</F><P>:</P> <K>string</K><P>)</P><P>:</P> <F>Promise</F><P>{"<"}</P><K>string</K><P>{">"}</P> <P>{"{"}</P></>,
        <><P>{"  "}</P><K>return</K> <F>createChat</F><P>(</P><F>knowledge</F><P>)</P><P>.</P><F>answer</F><P>(</P><F>input</F><P>)</P></>,
        <><P>{"}"}</P></>,
        null,
        <C>{"// Talk to Aftar — ask about experience, skills, or projects."}</C>,
      ]}
    />
  );
}

export default function CodeView() {
  return (
    <div className="pb-32">
      <HeroFile />
      <ExperienceFile />
      <ExpertiseFile />
      <ProjectsFile />
      <ChatFile />
    </div>
  );
}
