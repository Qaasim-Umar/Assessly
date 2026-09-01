import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const BASE_URL = "https://www.assessly.ng";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-lora",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Assessly - CBT Practice and School Assessments",
    template: "%s | Assessly",
  },
  description:
    "Assessly provides free CBT practice for Nigerian students and tools for educators to manage exams, classes, pupils, grading, and results across every school type.",
  keywords: [
    "CBT exam platform Nigeria",
    "WAEC past questions",
    "JAMB practice test",
    "NECO past questions",
    "online exam maker Nigeria",
    "school exam software Nigeria",
    "computer based test Nigeria",
    "free WAEC practice",
    "free BECE practice",
    "Post-UTME practice",
    "primary school CBT",
    "tertiary CBT platform",
    "school assessment software Nigeria",
    "Assessly",
  ],
  authors: [{ name: "Assessly", url: BASE_URL }],
  creator: "Assessly",
  publisher: "Assessly",
  category: "Education",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: BASE_URL,
    siteName: "Assessly",
    title: "Assessly - CBT Practice and School Assessments",
    description:
      "Free CBT practice for Nigerian students and assessment tools for educators to manage exams, classes, pupils, grading, and results.",
    images: [
      {
        url: `${BASE_URL}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "Assessly CBT practice and school assessment platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Assessly - CBT Practice and School Assessments",
    description:
      "Free CBT practice for Nigerian students and assessment tools for educators across every school type.",
    images: [`${BASE_URL}/opengraph-image.png`],
    creator: "@assessly",
  },
  alternates: {
    canonical: BASE_URL,
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
  other: {
    "theme-color": "#16a34a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6113651065351042"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${lora.variable} ${plusJakartaSans.variable} min-h-screen bg-white`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
