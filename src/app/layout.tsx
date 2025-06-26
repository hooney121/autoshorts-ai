import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoShorts.ai - AI로 만드는 뉴스 쇼츠",
  description: "뉴스 URL만 붙여넣으면 AI가 자동으로 매력적인 쇼츠 영상을 만들어드립니다. 최신 AI 기술로 뉴스를 쇼츠로 변환하세요.",
  keywords: ["AI", "쇼츠", "뉴스", "영상 제작", "자동화", "유튜브", "소셜미디어"],
  authors: [{ name: "AutoShorts.ai Team" }],
  creator: "AutoShorts.ai",
  publisher: "AutoShorts.ai",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://autoshorts.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AutoShorts.ai - AI로 만드는 뉴스 쇼츠",
    description: "뉴스 URL만 붙여넣으면 AI가 자동으로 매력적인 쇼츠 영상을 만들어드립니다.",
    url: "https://autoshorts.ai",
    siteName: "AutoShorts.ai",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AutoShorts.ai - AI 뉴스 쇼츠 제작",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoShorts.ai - AI로 만드는 뉴스 쇼츠",
    description: "뉴스 URL만 붙여넣으면 AI가 자동으로 매력적인 쇼츠 영상을 만들어드립니다.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ef4444" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="antialiased">
        <AuthProvider>
        {children}
        </AuthProvider>
      </body>
    </html>
  );
}
