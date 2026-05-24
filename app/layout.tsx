import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const BASE_URL = "https://assessly.app";

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
        url: "/opengraph-image.png",
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
    images: ["/opengraph-image.png"],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Epilogue:wght@400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
