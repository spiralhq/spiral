import { HeroSection } from "./components/hero-section";
import { Navbar } from "./components/navbar";

export function Landing() {
  return (
    <div className="relative min-h-screen w-full">
      <div
        className="fixed inset-0 z-10"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, transparent 40%,rgba(194, 65, 12, 0.1) 100%)",
        }}
      />
      <Navbar />
      <HeroSection />
    </div>
  );
}
