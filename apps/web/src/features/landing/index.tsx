import { HeroSection } from "./components/hero-section";
import { Navbar } from "./components/navbar";

export function Landing() {
  return (
    <div className="relative min-h-screen w-full">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
              radial-gradient(circle at 50% 50%, 
                rgba(194, 65, 12, 0.18) 0%, 
                rgba(194, 65, 12, 0.1) 25%, 
                rgba(194, 65, 12, 0.04) 35%, 
                transparent 50%
              )
            `,
          backgroundSize: "100% 100%",
        }}
      />
      <Navbar />
      <HeroSection />
    </div>
  );
}
