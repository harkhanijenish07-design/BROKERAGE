import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: "TradeNexus",
  description: "Track real-time stock prices, get personalized alerts and explore detailed company insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className="antialiased"
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
