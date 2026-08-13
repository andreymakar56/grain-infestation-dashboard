import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kazan Grain Monitor",
  description: "Interactive showcase for acoustic grain infestation monitoring.",
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
