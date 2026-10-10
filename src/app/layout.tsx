import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { UserProvider } from "@/components/providers/user-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "My Cashbook — Track. Share. Stay in sync.", template: "%s · Cashbook" },
  description:
    "A collaborative digital cashbook. Track cash in and out, add a partner with a Gmail code, and get a PDF copy of every change in your inbox.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f2ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Mrs+Saint+Delafield&family=Poppins:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <UserProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </UserProvider>
      </body>
    </html>
  );
}
