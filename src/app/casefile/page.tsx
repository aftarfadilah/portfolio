import type { Metadata } from "next";
import CaseFile from "@/components/casefile/CaseFile";

export const metadata: Metadata = {
  title: "Case File: the engineer behind the build | Aftar Fadilah",
  description:
    "A noir case file about Aftar Fadilah: from WordPress in Bali to ClinicOS in Hamburg, from building the screen to breaking it, and now founding Shiro Labs.",
};

export default function CaseFilePage() {
  return <CaseFile />;
}
