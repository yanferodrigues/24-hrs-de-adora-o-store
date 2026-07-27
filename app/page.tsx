"use client";

import SmoothScroll from "@/components/SmoothScroll";
import Topbar from "@/components/Topbar";
import StickyBuyBar from "@/components/StickyBuyBar";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import ArtReveal from "@/components/sections/ArtReveal";
import Features from "@/components/sections/Features";
import Gallery from "@/components/sections/Gallery";
import SizeGuide from "@/components/sections/SizeGuide";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import Footer from "@/components/sections/Footer";

export default function Page() {
  return (
    <SmoothScroll>
      <Topbar />

      <main className="relative">
        <Hero />
        <Manifesto />
        <ArtReveal />
        <Features />
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
