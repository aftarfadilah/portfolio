import IDEShell from "@/components/IDEShell";
import HeroChapter from "@/components/HeroChapter";
import BeginningChapter from "@/components/BeginningChapter";
import ClinicOSChapter from "@/components/ClinicOSChapter";
import ShiroLabsChapter from "@/components/ShiroLabsChapter";
import StackChapter from "@/components/StackChapter";
import ContactChapter from "@/components/ContactChapter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <IDEShell>
      <HeroChapter />
      <BeginningChapter />
      <ClinicOSChapter />
      <ShiroLabsChapter />
      <StackChapter />
      <ContactChapter />
      <Footer />
    </IDEShell>
  );
}
