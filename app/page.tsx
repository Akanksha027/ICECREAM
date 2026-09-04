import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import DripDivider from "@/components/DripDivider";
import OurStory from "@/components/OurStory";
import Ticker from "@/components/Ticker";
import FlavorWheel from "@/components/FlavorWheel";
import Showcase from "@/components/Showcase";
import MenuGrid from "@/components/MenuGrid";
import IngredientsStrip from "@/components/IngredientsStrip";
import FlavorsShowcase from "@/components/FlavorsShowcase";
import VideoStrip from "@/components/VideoStrip";
import VideoOverlaySection from "@/components/VideoOverlaySection";
import Footer from "@/components/Footer";
import AuditDrawer from "@/components/AuditDrawer";
import PolicySyncListener from "@/components/PolicySyncListener";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Ticker />
      <MenuGrid />
      <OurStory />
      {/* <FlavorWheel /> */}
      <Showcase />
      <FlavorsShowcase />
      <VideoStrip />
      <VideoOverlaySection />
      <Footer />
      <AuditDrawer />
      <PolicySyncListener />
    </main>
  );
}

