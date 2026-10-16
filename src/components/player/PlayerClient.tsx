"use client";

import dynamic from "next/dynamic";

const PlayerApp = dynamic(() => import("./PlayerApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center font-mono text-xs text-muted-foreground">
      Warming up the turntable…
    </div>
  ),
});

export default function PlayerClient() {
  return <PlayerApp />;
}
