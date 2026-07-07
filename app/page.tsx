"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";
import Topbar from "@/components/Topbar";
import StickyBuyBar from "@/components/StickyBuyBar";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import ArtReveal from "@/components/sections/ArtReveal";
import Features from "@/components/sections/Features";
import VersionToggle from "@/components/sections/VersionToggle";
import Gallery from "@/components/sections/Gallery";
import SizeGuide from "@/components/sections/SizeGuide";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import Footer from "@/components/sections/Footer";

const Scene3D = dynamic(() => import("@/components/three/Scene3D"), {
  ssr: false,
});

export default function Page() {
  return (
    <SmoothScroll>
      <Topbar />
      <Scene3D />

      <main className="relative">
        <Hero />
        <Manifesto />
        <ArtReveal />
        <Features />
        <VersionToggle />
        <Gallery />
        <SizeGuide />
        <Faq />
        <FinalCta />
        <Footer />
      </main>

      <StickyBuyBar />
    </SmoothScroll>
  );
}
