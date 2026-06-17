import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Wanderlust — AI Travel Planner",
    template: "%s | Wanderlust",
  },
  description:
    "Generate, customize, save and share complete trip itineraries with AI. Budget planning, packing lists, expense tracking and more.",
  keywords: ["travel planner", "AI itinerary", "trip planning", "budget travel"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
