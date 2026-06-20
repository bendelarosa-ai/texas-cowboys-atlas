import type { Metadata } from "next";
import "./globals.css";
import Banner from "@/components/Banner";

export const metadata: Metadata = {
  title: "1922",
  description: "Texas Cowboys alumni directory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <Banner />
        {children}
      </body>
    </html>
  );
}
