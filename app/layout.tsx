import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kolos · Grain Acoustic Monitor",
  description: "Prototype dashboard for acoustic grain pest monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
