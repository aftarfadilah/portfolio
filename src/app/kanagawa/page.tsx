import type { Metadata } from "next";
import KanagawaExperience from "@/components/kanagawa/KanagawaExperience";

export const metadata: Metadata = {
  title: "Kanagawa | Aftar Fadilah",
  description:
    "The Great Wave off Kanagawa as a fullscreen, animated, colored ASCII landing page in the Kanagawa theme, with an ASCII wiki in English, Indonesian and Japanese.",
};

export default function KanagawaPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#1F1F28] font-mono text-[#DCD7BA]">
      <KanagawaExperience />
    </main>
  );
}
