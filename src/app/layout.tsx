import type { Metadata } from "next";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "./figure-one.css";

const sourceSerif = Source_Serif_4({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-code",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ENPIRE: Agentic Robot Policy Self-Improvement in the Real World",
  description:
    "Anonymous ENPIRE project website for agentic robot policy self-improvement in the real world.",
  icons: {
    icon: "/seo/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${jetBrainsMono.variable} h-full antialiased`}>
      <body className={`${sourceSerif.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
