import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import "../../../landing/landing.css";

// ── Hardcoded data (swap for Supabase later) ──────────────────────────────────

type Urgency = "urgent" | "soon" | "open";

interface ScholarshipDetail {
  slug: string;
  title: string;
  description: string;
  icon: string;
  iconBg: string;
  amountLabel: string;
  amountNaira: number | null;
  frequency: string;
  deadlineLabel: string;
  daysLeft: string;
  urgency: Urgency;
  category: string;
  isOpen: boolean;
  applyUrl: string;
  eligibility: string[];
  requiredDocuments: string[];
  covers: string[];
}

const SCHOLARSHIPS_DATA: Record<string, ScholarshipDetail> = {
  "shell-nigeria-2024": {
    slug: "shell-nigeria-2024",
    title: "Shell Nigeria University Scholarship 2024/25",
    description:
      "Open to 100-level students in Engineering, Sciences, and Social Sciences with minimum 3.5 GPA. Covers tuition and stipend.",
    icon: "🛢️",
    iconBg: "bg-amber-100",
    amountLabel: "₦500,000/yr",
    amountNaira: 500000,
    frequency: "yearly",
    deadlineLabel: "Closes July 31, 2026",
    daysLeft: "41 days left",
    urgency: "soon",
    category: "STEM",
    isOpen: true,
    applyUrl: "https://www.shell.com.ng/sustainability/scholarships.html",
    eligibility: [
      "Nigerian citizen currently enrolled in a Nigerian university",
      "100-level student — applications from higher levels are not accepted",
      "Must be studying Engineering, Sciences, or Social Sciences",
      "Minimum CGPA of 3.5 out of 5.0 (or equivalent) at point of application",
      "Must not be receiving any other scholarship or bursary at the time of application",
      "No family member currently employed by Shell Nigeria or its subsidiaries",
    ],
    requiredDocuments: [
      "WAEC or NECO result slip (original or certified copy)",
      "JAMB result and admission letter",
      "University acceptance letter or student ID",
      "Current academic transcript showing CGPA",
      "Recent passport photograph (white background)",
      "Bank Verification Number (BVN) for payment setup",
      "Letter of recommendation from a faculty head or lecturer",
    ],
    covers: [
      "Full tuition fees for the academic year",
      "Annual stipend of ₦500,000 paid in two instalments",
      "Books and materials allowance",
      "Potential for internship placement at Shell Nigeria facilities",
    ],
  },
  "federal-scholarship-board-bilateral": {
    slug: "federal-scholarship-board-bilateral",
    title: "Federal Government Scholarship Board — Bilateral Education Agreement",
    description:
      "Full overseas scholarship for undergraduate and postgraduate study. Open to all Nigerian students with minimum 5 O'Level credits.",
    icon: "🇳🇬",
    iconBg: "bg-blue-100",
    amountLabel: "Full funding",
    amountNaira: null,
    frequency: "yearly",
    deadlineLabel: "Closes August 15, 2026",
    daysLeft: "56 days left",
    urgency: "open",
    category: "All fields",
    isOpen: true,
    applyUrl: "https://fgscholarships.edu.ng",
    eligibility: [
      "Nigerian citizen by birth",
      "Minimum of 5 O'Level credits including English and Mathematics (obtained in not more than 2 sittings)",
      "For undergraduates: must have JAMB score of at least 200",
      "For postgraduates: minimum of Second Class Lower (2:2) degree from a recognised institution",
      "Age limit: 18–25 years for undergraduate, 30 years for postgraduate",
      "Must not be a beneficiary of any other government scholarship",
    ],
    requiredDocuments: [
      "WAEC/NECO O'Level certificate",
      "JAMB result (undergraduate applicants)",
      "University degree certificate and transcript (postgraduate applicants)",
      "Birth certificate or sworn affidavit",
      "Local Government of Origin certificate",
      "State of Origin certificate",
      "Medical fitness certificate from a government hospital",
      "International passport (valid for at least 18 months)",
    ],
    covers: [
      "Full tuition at a partner overseas university",
      "Monthly living stipend (amount varies by country)",
      "Return airfare at the start and end of the programme",
      "Medical insurance for the duration of study",
      "One-time settling-in allowance",
    ],
  },
  "mtn-foundation-stem": {
    slug: "mtn-foundation-stem",
    title: "MTN Foundation Science & Technology Scholarship",
    description:
      "For 200-level students in Science, Technology, Engineering, and Mathematics. Minimum 3.0 GPA required at point of application.",
    icon: "📚",
    iconBg: "bg-violet-100",
    amountLabel: "₦200,000/yr",
    amountNaira: 200000,
    frequency: "yearly",
    deadlineLabel: "Closes September 1, 2026",
    daysLeft: "72 days left",
    urgency: "open",
    category: "STEM",
    isOpen: true,
    applyUrl: "https://www.mtnfoundation.org/scholarships",
    eligibility: [
      "Nigerian citizen currently studying in a Nigerian university",
      "200-level student at time of application (500-level for Engineering/Medical programmes)",
      "Enrolled in a Science, Technology, Engineering, or Mathematics (STEM) course",
      "Minimum CGPA of 3.0 out of 5.0 at point of application",
      "Must demonstrate financial need",
      "Must not be receiving any other scholarship at the time",
    ],
    requiredDocuments: [
      "Completed online application form",
      "University transcript showing CGPA",
      "WAEC or NECO result",
      "Proof of family income or financial need statement",
      "Two passport photographs",
      "Student ID card",
      "Essay: 'How science and technology can transform Nigeria' (500 words max)",
    ],
    covers: [
      "Annual scholarship of ₦200,000 paid directly to the student",
      "Access to the MTN Foundation mentorship programme",
      "Networking opportunities with MTN professionals",
      "Potential internship consideration at MTN Nigeria",
    ],
  },
  "zenith-bank-undergraduate": {
    slug: "zenith-bank-undergraduate",
    title: "Zenith Bank Undergraduate Scholarship",
    description:
      "Annual scholarship for students in Banking, Finance, and Economics. Applications closed for this cycle.",
    icon: "🏦",
    iconBg: "bg-gray-100",
    amountLabel: "₦150,000/yr",
    amountNaira: 150000,
    frequency: "yearly",
    deadlineLabel: "Closed",
    daysLeft: "Applications closed",
    urgency: "urgent",
    category: "Business",
    isOpen: false,
    applyUrl: "",
    eligibility: [
      "Nigerian citizen studying Banking & Finance, Economics, or Accounting",
      "Minimum CGPA of 3.5 out of 5.0",
      "100 to 300 level students",
    ],
    requiredDocuments: [
      "University transcript",
      "WAEC/NECO result",
      "Two passport photographs",
      "Student ID",
    ],
    covers: [
      "Annual award of ₦150,000",
      "Certificate of excellence from Zenith Bank",
    ],
  },
};

const URGENCY_STYLES: Record<Urgency, { banner: string; text: string; badge: string }> = {
  urgent: { banner: "bg-rose-50 border border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
  soon: { banner: "bg-amber-50 border border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  open: { banner: "bg-green-50 border border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = SCHOLARSHIPS_DATA[slug];
  if (!s) return { title: "Not Found" };
  return {
    title: `${s.title} | Assessly Admissions Hub`,
    description: s.description,
    openGraph: { title: s.title, description: s.description, type: "website" },
  };
}

export default async function ScholarshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = SCHOLARSHIPS_DATA[slug];
  if (!s) notFound();

  const u = URGENCY_STYLES[s.urgency];

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] pt-14 px-6 pb-12 relative overflow-hidden">
        <div
          className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)" }}
        />
        <div className="max-w-[1100px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/35 mb-6">
            <Link href="/admissions" className="hover:text-white/60 transition-colors">Admissions Hub</Link>
            <span>/</span>
            <span>Scholarships</span>
          </nav>

          {/* Icon + Title */}
          <div className="flex items-start gap-5 mb-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${s.iconBg}`}>
              {s.icon}
            </div>
            <h1
              className="text-[clamp(24px,3.5vw,46px)] text-white leading-[1.1] tracking-[-1px]"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              {s.title}
            </h1>
          </div>

          {/* Tag pills */}
          <div className="flex flex-wrap gap-2">
            {s.amountLabel && (
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300">
                {s.amountLabel} {s.frequency === "yearly" ? "· per year" : "· one-time"}
              </span>
            )}
            <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/70">
              {s.category}
            </span>
            {s.isOpen ? (
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-green-500/20 text-green-400">
                ✓ Open Now
              </span>
            ) : (
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/40">
                Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* Main content */}
          <div className="flex flex-col gap-6">

            {/* Deadline banner */}
            <div className={`rounded-2xl px-6 py-4 flex items-center justify-between gap-4 ${u.banner}`}>
              <div>
                <p className={`text-base font-extrabold ${u.text}`}>{s.deadlineLabel}</p>
                <p className={`text-sm ${u.text} opacity-70`}>{s.daysLeft}</p>
              </div>
              {s.isOpen && (
                <span className={`text-[13px] font-extrabold px-3 py-1.5 rounded-full flex-shrink-0 ${u.badge}`}>
                  {s.daysLeft}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <p className="text-[17px] text-[#1a2e1d] leading-[1.8]">{s.description}</p>
            </div>

            {/* Eligibility */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h2
                className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-5"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                Who Can Apply
              </h2>
              <ul className="flex flex-col gap-3">
                {s.eligibility.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold mt-0.5">
                      ✓
                    </span>
                    <span className="text-base text-[#1a2e1d] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Documents */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h2
                className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-5"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                What to Prepare
              </h2>
              <ul className="flex flex-col gap-3">
                {s.requiredDocuments.map((doc, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#9db5a3] flex-shrink-0 mt-1">📄</span>
                    <span className="text-base text-[#1a2e1d] leading-relaxed">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What it covers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h2
                className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-5"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                What&apos;s Covered
              </h2>
              <ul className="flex flex-col gap-3">
                {s.covers.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-amber-500 flex-shrink-0 mt-1">★</span>
                    <span className="text-base text-[#1a2e1d] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Back */}
            <Link
              href="/admissions"
              className="flex items-center gap-2 text-base font-bold text-green-600 hover:underline"
            >
              ← Back to Admissions Hub
            </Link>

            {/* Apply CTA */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3
                className="text-[20px] text-[#0d1a0f] tracking-[-0.5px] mb-1.5"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                {s.isOpen ? "Ready to apply?" : "Applications closed"}
              </h3>
              <p className="text-sm text-[#9db5a3] mb-5">
                {s.isOpen
                  ? `Deadline: ${s.deadlineLabel}. Don't wait.`
                  : "Check back next cycle or browse other open scholarships."}
              </p>
              {s.isOpen ? (
                <a
                  href={s.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-base font-bold text-white bg-amber-500 rounded-xl py-3.5 hover:bg-amber-600 transition-colors"
                >
                  Apply Now →
                </a>
              ) : (
                <button
                  disabled
                  className="block w-full text-center text-base font-bold text-[#9db5a3] bg-[#f7faf8] rounded-xl py-3.5 cursor-not-allowed border border-gray-200"
                >
                  Applications Closed
                </button>
              )}
            </div>

            {/* Quick facts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-base font-extrabold text-[#0d1a0f] mb-4">Quick Facts</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Amount", value: s.amountLabel || "Full funding" },
                  { label: "Frequency", value: s.frequency === "yearly" ? "Every academic year" : "One-time award" },
                  { label: "Category", value: s.category },
                  { label: "Deadline", value: s.deadlineLabel },
                  { label: "Status", value: s.isOpen ? "Open" : "Closed" },
                ].map((fact) => (
                  <div key={fact.label} className="flex justify-between items-start gap-4 text-sm border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <span className="text-[#9db5a3] font-semibold flex-shrink-0">{fact.label}</span>
                    <span className="text-[#0d1a0f] font-bold text-right">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Browse more */}
            <div className="bg-[#0d1a0f] rounded-2xl p-6">
              <p className="text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-2">More scholarships</p>
              <p className="text-base text-white/50 mb-4 leading-relaxed">47 scholarships are currently listed on the hub — many close soon.</p>
              <Link
                href="/admissions"
                className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
              >
                Browse All →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
