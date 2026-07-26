import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Source_Sans_3 } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const editorialSerif = Cormorant_Garamond({
  variable: "--font-editorial-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "At The In Gate | The Hunter-Jumper World, All in One Place",
  description:
    "Horses, ponies, professionals, horse shows, jobs, and the conversations happening between the rings.",
  icons: {
    icon: [{ url: "/at-the-in-gate-mark.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/at-the-in-gate-mark.svg?v=2",
    apple: "/at-the-in-gate-mark.svg?v=2",
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
      className={`${sourceSans.variable} ${editorialSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f4efe5] text-[#242721]">
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
