import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D&D AI Dungeon Master",
  description: "An AI-powered Dungeon Master for D&D 5e campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
