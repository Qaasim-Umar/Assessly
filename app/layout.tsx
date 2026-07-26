import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/PostHogProvider";
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
    default: "Assessly - Smart CBT Exams for Nigerian Schools",
    template: "%s | Assessly",
  },
  description:
    "Assessly is Nigeria's leading Computer-Based Testing (CBT) platform for secondary schools. Create exams with AI, run timed WAEC, JAMB & NECO practice tests - free for students, powerful for teachers.",
  keywords: [
    "CBT exam platform Nigeria",
    "WAEC past questions",
    "JAMB practice test",
    "NECO past questions",
    "online exam maker Nigeria",
    "school exam software Nigeria",
    "computer based test Nigeria",
    "free WAEC practice",
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
    title: "Assessly - Smart CBT Exams for Nigerian Schools",
    description:
      "Create, manage and deliver Computer-Based Tests in minutes. Free practice exams for WAEC, JAMB & NECO. No account needed.",
    images: [
      {
        url: `${BASE_URL}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "Assessly - Smart CBT Exam Platform for Nigerian Schools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Assessly - Smart CBT Exams for Nigerian Schools",
    description:
      "Create, manage and deliver Computer-Based Tests in minutes. Free WAEC, JAMB & NECO practice exams.",
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
      </head>
      <body className={`${lora.variable} ${plusJakartaSans.variable} min-h-screen bg-white`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
