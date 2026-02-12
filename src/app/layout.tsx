import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ThemeProvider, TenantStyles } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "NailXR - AI-Powered Virtual Nail Try-On",
  description: "Experience the future of nail art with NailXR. Visualize thousands of nail designs on realistic 3D hands, save your favorite looks, and book appointments with top salons near you.",
  keywords: "nail art, virtual try-on, AI, 3D visualization, manicure, nail design, salon booking",
  icons: {
    icon: "/NailXR-symbol.png",
    shortcut: "/NailXR-symbol.png",
    apple: "/NailXR-symbol.png",
  },
  openGraph: {
    title: "NailXR - AI-Powered Virtual Nail Try-On",
    description: "Experience the future of nail art with NailXR. Visualize thousands of nail designs on realistic 3D hands.",
    url: "https://nailxr.com",
    siteName: "NailXR",
    images: [
      {
        url: "/NailXR-white.png",
        width: 1200,
        height: 630,
        alt: "NailXR - Virtual Nail Try-On",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NailXR - AI-Powered Virtual Nail Try-On",
    description: "Experience the future of nail art with NailXR. Visualize thousands of nail designs on realistic 3D hands.",
    images: ["/NailXR-white.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <TenantStyles />
            <Navigation />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
