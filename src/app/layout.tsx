import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Aftar Fadilah — Software Engineer & Founder",
  description:
    "Building AI-powered products that solve real problems. Founder of Shiro Labs, previously QA Engineer at NoscAI GmbH building ClinicOS.",
  openGraph: {
    title: "Aftar Fadilah — Software Engineer & Founder",
    description:
      "Building AI-powered products that solve real problems. Founder of Shiro Labs, previously QA Engineer at NoscAI GmbH building ClinicOS.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="h-screen overflow-hidden bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
