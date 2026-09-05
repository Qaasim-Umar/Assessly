import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  FileCheck2,
  MapPinCheck,
  PhoneCall,
} from "lucide-react";
import CboCentreFinder, { CboFinderLoading } from "./CboCentreFinder";
import "./cbo-centres.css";

export const metadata: Metadata = {
  title: "CBO Registration Centres in Nigeria",
  description:
    "Find a listed CBO registration centre by selecting your Nigerian state and local government area. View addresses and contact details before you visit.",
  keywords: [
    "CBO registration centres Nigeria",
    "CBO centre near me",
    "registration centre by LGA",
    "cyber cafe registration centre Nigeria",
  ],
  alternates: {
    canonical: "https://www.assessly.ng/admissions/cbo-centres",
  },
  openGraph: {
    title: "Find a CBO Registration Centre | Assessly",
    description:
      "Search listed CBO registration centres across Nigeria by state and local government area.",
    url: "https://www.assessly.ng/admissions/cbo-centres",
    type: "website",
  },
};

const visitTips = [
  {
    Icon: PhoneCall,
    title: "Call before you go",
    description: "Confirm opening hours and registration availability.",
  },
  {
    Icon: FileCheck2,
    title: "Bring your details",
    description: "Have the documents and information required for registration.",
  },
  {
    Icon: MapPinCheck,
    title: "Check the address",
    description: "Use the listed address and nearby landmark to plan your trip.",
  },
];

export default function CboCentresPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CBO Registration Centres in Nigeria",
    description:
      "A searchable directory of CBO registration centres in Nigeria, organised by state and local government area.",
    url: "https://www.assessly.ng/admissions/cbo-centres",
    isPartOf: {
      "@type": "WebSite",
      name: "Assessly",
      url: "https://www.assessly.ng",
    },
  };

  return (
    <main className="cbo-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="cbo-hero">
        <div className="cbo-shell cbo-hero-inner">
          <Link href="/admissions" className="cbo-back-link">
            <ArrowLeft size={17} aria-hidden="true" />
            Admissions hub
          </Link>
          <div className="cbo-eyebrow">Registration centre directory</div>
          <h1>Find a CBO centre close to you</h1>
          <p>
            Select your state and local government area to see listed centres,
            office addresses, and phone numbers before you travel.
          </p>
        </div>
      </section>

      <section className="cbo-directory-section" aria-label="CBO centre search">
        <div className="cbo-shell">
          <Suspense fallback={<CboFinderLoading />}>
            <CboCentreFinder />
          </Suspense>
        </div>
      </section>

      <section className="cbo-tips-section" aria-labelledby="visit-tips-heading">
        <div className="cbo-shell">
          <div className="cbo-tips-heading">
            <span>Before you visit</span>
            <h2 id="visit-tips-heading">A quick check can save you a trip</h2>
          </div>
          <div className="cbo-tips-grid">
            {visitTips.map(({ Icon, title, description }) => (
              <article key={title} className="cbo-tip-card">
                <span className="cbo-tip-icon">
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="cbo-directory-note">
            Centre details can change. Please call the centre to confirm its
            current address, opening hours, and services before visiting.
          </p>
        </div>
      </section>
    </main>
  );
}
