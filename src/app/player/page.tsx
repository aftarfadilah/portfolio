import type { Metadata } from "next";
import PlayerClient from "@/components/player/PlayerClient";

export const metadata: Metadata = {
  title: "Vinyl Turntable — Aftar Fadilah",
  description:
    "A 3D turntable that plays any YouTube link. Paste a link, drag the record onto the platter, and drop the needle.",
};

export default function PlayerPage() {
  return <PlayerClient />;
}
