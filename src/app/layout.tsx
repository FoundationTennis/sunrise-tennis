import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sunrise Tennis",
    template: "%s | Sunrise Tennis",
  },
  description: "Coaching, bookings, and team management for Sunrise Tennis.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2B5EA7",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading x-nonce tells Next.js to apply it to all inline <script> tags
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased`}
      >
        <NextTopLoader color="#2B5EA7" height={2} showSpinner={false} nonce={nonce} />
        {children}
        <Toaster position="top-center" richColors closeButton duration={3000} />
        <SpeedInsights />
      </body>
    </html>
  );
}
