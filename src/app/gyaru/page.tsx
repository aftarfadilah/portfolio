import type { Metadata } from "next";
import GyaruClient from "@/components/gyaru/GyaruClient";

export const metadata: Metadata = {
  title: "Ado Plush — Aftar Fadilah",
  description: "A little 3D Ado plushie you can spin and squish.",
  robots: { index: false, follow: false },
};

export default function GyaruPage() {
  return <GyaruClient />;
}
