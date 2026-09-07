import type { Metadata } from "next";
import { SightkickTools } from "@sightmap/next";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roast & Steep — Sightmap + WebMCP on Next.js",
  description:
    "A Next.js storefront whose .sightmap/ corpus compiles into WebMCP tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        <main>{children}</main>
        {/* Registers the compiled tool layer on document.modelContext (WebMCP)
            on every page. Unlike the task-board example, this one does not
            inline the IR: with no `ir` prop the component fetches
            /.well-known/sightkick.json after hydration — the other code path,
            which is why this example exists. */}
        <SightkickTools />
      </body>
    </html>
  );
}
