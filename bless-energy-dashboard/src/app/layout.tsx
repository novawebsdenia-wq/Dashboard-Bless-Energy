import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bless Energy Dashboard",
  description: "Panel de control para gestionar clientes, leads y comunicaciones de Bless Energy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-[#0a0a0a] min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider>
          <NotificationProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {children}
              </main>
            </div>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
