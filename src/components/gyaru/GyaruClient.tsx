"use client";

import dynamic from "next/dynamic";

const GyaruApp = dynamic(() => import("./GyaruApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center font-mono text-xs text-muted-foreground">
      Fluffing the plush…
    </div>
  ),
});

export default function GyaruClient() {
  return <GyaruApp />;
}
