import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { VkIdFloatingGate } from "@/components/auth/VkIdFloatingGate";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "MarketCard AI — карточки товаров для WB и Ozon за 2 минуты",
  description: "Загрузите фото — получите продающую карточку с текстом, SEO и обложкой для Wildberries, Ozon и Avito."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={inter.variable} lang="ru">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <VkIdFloatingGate />
        </AuthProvider>
      </body>
    </html>
  );
}
