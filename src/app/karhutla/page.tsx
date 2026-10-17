import type { Metadata } from "next";
import KarhutlaStory from "@/components/karhutla/KarhutlaStory";

export const metadata: Metadata = {
  title: "Karhutla: the fire is the last chapter | Aftar Fadilah",
  description:
    "A scroll story about Indonesia's forest and land fires: what a satellite hotspot really is, why peat burns from below, and how smoke travels. In English and Bahasa Indonesia.",
};

export default function KarhutlaPage() {
  return <KarhutlaStory />;
}
