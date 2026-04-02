import IDEShell from "@/components/IDEShell";
import HeroChapter from "@/components/HeroChapter";
import ExperienceChapter from "@/components/ExperienceChapter";
import ExpertiseChapter from "@/components/ExpertiseChapter";
import ProjectsChapter from "@/components/ProjectsChapter";
import ChatChapter from "@/components/ChatChapter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <IDEShell>
      <HeroChapter />
      <ExperienceChapter />
      <ExpertiseChapter />
      <ProjectsChapter />
      <ChatChapter />
      <Footer />
    </IDEShell>
  );
}
