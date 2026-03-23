import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://re3con.github.io'),
  title: "MD380 Web Tools",
  description: "Browser-based firmware and codeplug management for Tytera MD380 radios via WebUSB. Read, write, and flash your MD380 radio directly from your browser.",
  keywords: ["MD380", "MD390", "DMR", "radio", "firmware", "WebUSB", "ham radio", "amateurradio"],
  authors: [{ name: "RE3CON", url: "https://github.com/RE3CON" }],
  creator: "RE3CON",
  publisher: "GitHub",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://re3con.github.io/MD380Tool/",
    siteName: "MD380 Web Tools",
    title: "MD380 Web Tools",
    description: "Browser-based firmware and codeplug management for Tytera MD380 radios via WebUSB",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MD380 Web Tools"
      }
    ],
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "MD380 Web Tools",
    description: "Browser-based firmware and codeplug management for Tytera MD380 radios via WebUSB",
    creator: "@re3con",
    images: ["/og-image.png"],
  },
  
  // PWA Manifest
  manifest: "/manifest.json",
  
  // Favicon
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  
  // Other
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MD380 Tools" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
