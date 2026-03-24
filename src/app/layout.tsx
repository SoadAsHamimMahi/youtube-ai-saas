import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Monitor | Intelligent Research Agents",
  description: "Monitor and automate your YouTube and LinkedIn content research with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} antialiased dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background selection:bg-primary/30" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
