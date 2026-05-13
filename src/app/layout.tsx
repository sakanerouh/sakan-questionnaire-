import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "sweetalert2/dist/sweetalert2.min.css";
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
  title: "Sakan eRouh Archetype Questionnaire",
  description:
    "A soulful archetype questionnaire that reveals emotional patterns, strengths, shadows, and a personalized healing path.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
