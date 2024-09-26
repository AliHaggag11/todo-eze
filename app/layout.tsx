import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/app/components/ui/custom-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collaborative Todo List",
  description: "A real-time collaborative todo list application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
