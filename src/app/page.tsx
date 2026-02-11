import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";

export default function Home() {
  return (
    <>
      <Header />
      <div className="space-y-8">
        <Hero />
        <Features />
      </div>
      <Footer />
    </>
  );
}
