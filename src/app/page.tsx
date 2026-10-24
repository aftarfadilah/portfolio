import IDEShell from "@/components/IDEShell";
import HeroChapter from "@/components/HeroChapter";
import ExperienceChapter from "@/components/ExperienceChapter";
import ExpertiseChapter from "@/components/ExpertiseChapter";
import LabsChapter from "@/components/LabsChapter";
import ProjectsChapter from "@/components/ProjectsChapter";
import ChatChapter from "@/components/ChatChapter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <IDEShell>
      <HeroChapter />
      <ExperienceChapter />
      <ExpertiseChapter />
      <LabsChapter />
      <ProjectsChapter />
      <ChatChapter />
      <Footer />
    </IDEShell>
  );
}
