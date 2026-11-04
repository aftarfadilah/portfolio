import type { Metadata } from "next";
import CaseFile from "@/components/casefile/CaseFile";

export const metadata: Metadata = {
  title: "Case File: the builder behind the interface | Aftar Fadilah",
  description:
    "A noir case file about Aftar Fadilah, frontend developer and web designer: from WordPress in Bali to the ClinicOS interface in Hamburg, and now founding Shiro Labs.",
};

export default function CaseFilePage() {
  return <CaseFile />;
}
