import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrgFinance",
  description: "Multi-tenant financial tracker",
};

const initialThemeScript = `(() => {
  try {
    const key = 'orgfinance-theme';
    const stored = localStorage.getItem(key);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: initialThemeScript }}
          suppressHydrationWarning
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6">
          <header className="mb-8 flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white font-semibold">OF</div>
              <div>
                <div className="text-base font-semibold text-foreground">OrgFinance</div>
                <div className="text-sm text-muted-foreground">Multi-tenant financial tracker</div>
              </div>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-10 pb-6 text-sm text-muted-foreground">
            Foundation phase · Supabase + Next.js · Tailwind v4
          </footer>
        </div>
      </body>
    </html>
  );
}
