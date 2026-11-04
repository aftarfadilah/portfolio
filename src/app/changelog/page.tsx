import type { Metadata } from "next";
import Changelog from "@/components/changelog/Changelog";

export const metadata: Metadata = {
  title: "Changelog: release notes for a frontend builder | Aftar Fadilah",
  description:
    "Aftar Fadilah, frontend developer and web designer, told as release notes: from WordPress in Bali to the ClinicOS interface in Hamburg, and now founding Shiro Labs.",
};

export default function ChangelogPage() {
  return <Changelog />;
}
