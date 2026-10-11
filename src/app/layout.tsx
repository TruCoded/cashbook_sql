import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PwaRoot } from "@/components/pwa/pwa";
import { UserProvider } from "@/components/providers/user-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "My Cashbook — One ledger, every partner", template: "%s · Cashbook" },
  description:
    "A shared cashbook for small businesses. Record money in and out, add a partner with their Gmail, and get a PDF statement by email after every change.",
  robots: { index: true, follow: true },
  applicationName: "My Cashbook",
  appleWebApp: { capable: true, title: "Cashbook", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#46568c",
  viewportFit: "cover",
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
          <PwaRoot />
          <Toaster position="top-center" richColors closeButton />
        </UserProvider>
      </body>
    </html>
  );
}
