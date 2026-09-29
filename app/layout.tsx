import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOLOS · Акустический мониторинг зерна",
  description: "Демонстрационная панель акустического мониторинга насекомых-вредителей в хранящемся зерне.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
