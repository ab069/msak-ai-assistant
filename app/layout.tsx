import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MSAK AI Assistant — Intelligent Document Analysis",
  description:
    "Upload documents and ask questions. Powered by Claude AI. Built by msakithub.com.",
  keywords: ["AI", "RAG", "document analysis", "Claude", "chatbot", "msakithub"],
  authors: [{ name: "Abdullah Khan", url: "https://msakithub.com" }],
  openGraph: {
    title: "MSAK AI Assistant",
    description: "AI-powered document analysis and Q&A chatbot",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0a] text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
