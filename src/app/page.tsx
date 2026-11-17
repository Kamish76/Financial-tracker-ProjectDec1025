import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-accent/20">
      {/* Subtle ambient radial glow for depth in both light and dark modes */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 overflow-hidden"
      >
        <div className="mx-auto h-[32rem] max-w-6xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/12 via-accent/4 to-transparent blur-3xl dark:from-accent/15 dark:via-accent/5" />
      </div>

      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-20 sm:space-y-28">
        <Hero />
        <Features />
      </main>

      <Footer />
    </div>
  );
}

