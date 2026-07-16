import type { Metadata } from "next";
import { Geist_Mono, Share_Tech } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const shareTech = Share_Tech({
  weight: "400",
  variable: "--font-share-tech",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "memberkit.co — The All-In-One Creator Commerce Platform",
  description:
    "Stop sacrificing 10% of your revenue. Join the waitlist for the all-in-one creator commerce platform with 0% fees, instant payouts, and AI Copilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${shareTech.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-share-tech)]">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
