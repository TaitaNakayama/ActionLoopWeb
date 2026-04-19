import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrickDB — Trick Study Database",
  description:
    "Community-ranked study clips for tricking. Search tricks, watch the best examples, and build your study list.",
  openGraph: {
    title: "TrickDB — Trick Study Database",
    description:
      "Community-ranked study clips for tricking. Search tricks, watch the best examples, and build your study list.",
    siteName: "TrickDB",
    type: "website",
  },
  metadataBase: new URL("https://trickdb.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
