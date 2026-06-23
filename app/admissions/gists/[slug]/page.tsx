import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ReactionBar from "../../_components/ReactionBar";
import "../../../landing/landing.css";

// ── Hardcoded data (swap for Supabase later) ──────────────────────────────────

const GISTS_DATA: Record<string, {
  slug: string;
  tag: string;
  tagColor: string;
  title: string;
  date: string;
  school: string;
  views: string;
  reactions: { fire: number; shock: number; check: number; think: number };
  paragraphs: string[];
  related: { slug: string; title: string; tag: string }[];
}> = {
  "unilag-post-utme-2024": {
    slug: "unilag-post-utme-2024",
    tag: "UNILAG",
    tagColor: "text-green-400",
    title: "UNILAG Post-UTME 2024/25: Everything You Need to Know",
    date: "June 18, 2026",
    school: "UNILAG",
    views: "14.2k",
    reactions: { fire: 312, shock: 89, check: 204, think: 47 },
    paragraphs: [
      "The University of Lagos (UNILAG) has officially announced the 2024/25 Post-UTME screening exercise. Candidates who chose UNILAG as their first choice institution on JAMB and scored 200 and above are eligible to participate.",
      "Screening dates run from July 14 to July 25, 2026. The exercise is computer-based and will be held at the UNILAG ICT Centre on the main campus in Akoka, Lagos. Candidates are advised to arrive at least 30 minutes before their scheduled time.",
      "Registration closes on July 11, 2026 — three days before screening begins. You must register on the official portal at admissions.unilag.edu.ng using your JAMB registration number and date of birth. A non-refundable fee of ₦2,000 is required.",
      "Subject combinations follow your proposed course of study. Science candidates will write subjects relevant to their faculty, while Arts and Social Science candidates have separate combinations. The full breakdown is published on the admissions portal after registration.",
      "The Post-UTME is scored out of 100 marks and is combined with your JAMB score to compute a composite score. UNILAG uses a 50:50 weighting — your JAMB score accounts for 50% and your Post-UTME score accounts for the other 50%.",
      "Past students advise that the questions are generally not harder than JAMB, but the time pressure is real. You get 45 minutes for 50 questions. Focus on topics that are heavy in your UTME subject — those same topics come up in Post-UTME.",
      "Results are typically released within 2 weeks of the last screening date. You can check on the admissions portal using the same login credentials. If you are offered admission, accept it on the JAMB CAPS portal immediately to secure your spot.",
    ],
    related: [
      { slug: "jamb-caps-how-to-accept", title: "JAMB CAPS: How to accept your admission offer", tag: "JAMB" },
      { slug: "oau-admission-list-2024", title: "OAU releases 2024/25 admission list", tag: "OAU" },
      { slug: "ui-cut-off-marks-2024", title: "University of Ibadan cut-off marks, 2024/25", tag: "UI" },
    ],
  },
  "oau-admission-list-2024": {
    slug: "oau-admission-list-2024",
    tag: "OAU",
    tagColor: "text-rose-400",
    title: "OAU releases 2024/25 admission list: how to check your status",
    date: "June 15, 2026",
    school: "OAU",
    views: "9.1k",
    reactions: { fire: 98, shock: 34, check: 71, think: 12 },
    paragraphs: [
      "Obafemi Awolowo University (OAU) has released the 2024/25 admission list. If you applied to OAU, here is how to check whether your name is on the list.",
      "Go to the JAMB CAPS portal at caps.jamb.gov.ng. Log in with your JAMB registration number and password. Under 'Check Admission Status', you should see whether OAU has offered you admission.",
      "If your status shows 'Admitted', you must accept the admission on the same CAPS portal before the deadline. Failing to accept means your admission may be withdrawn and offered to another candidate.",
      "If your status shows 'Not Admitted' or is blank, you may still be picked up in subsequent batches. OAU typically releases multiple admission lists across the season — follow the admissions office on their official social media pages for updates.",
      "Students who were admitted should also check their OAU student portal at oauife.edu.ng for the next steps — including document verification, fee payment, and registration timelines.",
    ],
    related: [
      { slug: "jamb-caps-how-to-accept", title: "JAMB CAPS: How to accept your admission offer", tag: "JAMB" },
      { slug: "unilag-post-utme-2024", title: "UNILAG Post-UTME 2024/25 guide", tag: "UNILAG" },
    ],
  },
  "ui-cut-off-marks-2024": {
    slug: "ui-cut-off-marks-2024",
    tag: "UI",
    tagColor: "text-violet-400",
    title: "University of Ibadan cut-off marks for all faculties, 2024/25",
    date: "June 12, 2026",
    school: "UI",
    views: "7.3k",
    reactions: { fire: 143, shock: 21, check: 89, think: 8 },
    paragraphs: [
      "The University of Ibadan has published departmental cut-off marks for the 2024/25 admissions cycle. These are the minimum JAMB scores required per faculty — scoring above the cut-off does not guarantee admission, but scoring below it disqualifies you automatically.",
      "Faculty of Sciences: The minimum cut-off is 200. Medicine and Dentistry require 280 and above. Pharmacy is 260. Other science courses range from 200 to 240.",
      "Faculty of Arts: The minimum is 180. English and Philosophy are at 180. History, Linguistics, and Theatre Arts range from 180 to 200.",
      "Faculty of Social Sciences: 190 minimum. Economics is the most competitive at 230. Political Science and Sociology are around 190 to 210.",
      "Faculty of Law: 220 minimum. This is one of the more competitive faculties at UI.",
      "Faculty of Education: 170 minimum across all departments. This is the lowest threshold at UI.",
      "These figures are based on the officially published guidelines and are confirmed for the 2024/25 cycle. Always verify on the UI admissions portal at admissions.ui.edu.ng as figures can change slightly between batches.",
    ],
    related: [
      { slug: "futa-post-utme-score", title: "FUTA Post-UTME: what score do you actually need?", tag: "FUTA" },
      { slug: "jamb-caps-how-to-accept", title: "JAMB CAPS: How to accept your admission offer", tag: "JAMB" },
    ],
  },
  "futa-post-utme-score": {
    slug: "futa-post-utme-score",
    tag: "FUTA",
    tagColor: "text-amber-400",
    title: "FUTA Post-UTME: what score do you actually need?",
    date: "June 10, 2026",
    school: "FUTA",
    views: "5.8k",
    reactions: { fire: 67, shock: 55, check: 30, think: 19 },
    paragraphs: [
      "Federal University of Technology, Akure (FUTA) is one of the most competitive technology-focused universities in Nigeria. The Post-UTME screening is taken seriously and a good score makes a meaningful difference.",
      "Based on data from students admitted over the last three cycles, the safe score range for most Engineering departments is 60 and above out of 100 on the Post-UTME. Computer Science has been especially competitive, with many admitted students scoring 65 to 75.",
      "FUTA uses a weighted aggregate of JAMB (60%) and Post-UTME (40%). This means your JAMB score carries more weight here than at some other schools. A JAMB score of 250 and a Post-UTME score of 55 will outperform a JAMB of 210 with a Post-UTME of 70.",
      "The Post-UTME consists of 60 questions in 45 minutes. Topics covered include the subjects relevant to your faculty. Engineering candidates sit Mathematics and Physics. Sciences sit Chemistry and Biology or Physics depending on course.",
      "Registration is on the FUTA admissions portal. Keep checking futa.edu.ng for the opening date, as it is typically announced 3 to 4 weeks before the screening.",
    ],
    related: [
      { slug: "ui-cut-off-marks-2024", title: "University of Ibadan cut-off marks, 2024/25", tag: "UI" },
      { slug: "unilag-post-utme-2024", title: "UNILAG Post-UTME 2024/25 guide", tag: "UNILAG" },
    ],
  },
  "jamb-caps-how-to-accept": {
    slug: "jamb-caps-how-to-accept",
    tag: "JAMB",
    tagColor: "text-emerald-400",
    title: "JAMB CAPS: How to accept your admission offer before the deadline",
    date: "June 8, 2026",
    school: "JAMB",
    views: "9.8k",
    reactions: { fire: 201, shock: 44, check: 158, think: 23 },
    paragraphs: [
      "The JAMB Central Admissions Processing System (CAPS) is the platform where you must formally accept your university admission offer. Many candidates miss this critical step and risk losing their spot — even after being offered admission.",
      "Step 1: Go to caps.jamb.gov.ng on any browser. Log in with your JAMB registration number (usually 10 digits) and your JAMB password.",
      "Step 2: On your dashboard, look for the 'Admission Status' section. If your institution has offered you admission, you will see a green banner or a prompt to accept.",
      "Step 3: Click 'Accept Admission'. You will be shown the institution name, course, and session. Confirm these details carefully before accepting.",
      "Step 4: After accepting, print or screenshot the acceptance confirmation page. Keep this as proof — it may be required during physical screening or document verification at your institution.",
      "The CAPS acceptance window has a deadline set by JAMB — for this cycle it closes June 30, 2026. If you do not accept before then, your institution may withdraw the offer. Log in regularly to check your status even if you have not received any notification.",
      "If your status still shows 'Awaiting Admission', your institution has not yet uploaded their list. This is normal — universities upload in batches. Keep checking every few days.",
    ],
    related: [
      { slug: "oau-admission-list-2024", title: "OAU releases 2024/25 admission list", tag: "OAU" },
      { slug: "unilag-post-utme-2024", title: "UNILAG Post-UTME 2024/25 guide", tag: "UNILAG" },
    ],
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gist = GISTS_DATA[slug];
  if (!gist) return { title: "Not Found" };
  return {
    title: `${gist.title} | Assessly Admissions Hub`,
    description: gist.paragraphs[0],
    openGraph: { title: gist.title, description: gist.paragraphs[0], type: "article" },
  };
}

const COMING_UP = [
  { dot: "bg-rose-500", title: "JAMB CAPS closes", sub: "June 30 · 10 days left" },
  { dot: "bg-rose-500", title: "UNILAG Post-UTME", sub: "July 14 · 24 days left" },
  { dot: "bg-amber-500", title: "Shell Scholarship", sub: "July 31 · 41 days left" },
  { dot: "bg-green-500", title: "Federal Scholarship Board", sub: "Aug 15 · 56 days left" },
];

export default async function GistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gist = GISTS_DATA[slug];
  if (!gist) notFound();

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
            <span>School Gists</span>
          </nav>

          {/* Tag */}
          <span className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide uppercase mb-4 bg-white/10 px-3 py-1.5 rounded-full ${gist.tagColor}`}>
            🏫 {gist.tag}
          </span>

          {/* Title */}
          <h1
            className="text-[clamp(28px,4vw,52px)] text-white leading-[1.1] tracking-[-1px] mb-5 max-w-[780px]"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            {gist.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-white/35 flex-wrap mb-5">
            <span>📅 {gist.date}</span>
            <span>👁 {gist.views} views</span>
            <span>🏫 {gist.school}</span>
          </div>

          {/* Reactions */}
          <ReactionBar initial={gist.reactions} dark />
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* Article */}
          <article>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
              {gist.paragraphs.map((p, i) => (
                <p key={i} className="text-[17px] text-[#1a2e1d] leading-[1.8] mb-5 last:mb-0">
                  {p}
                </p>
              ))}
            </div>

            {/* Related */}
            {gist.related.length > 0 && (
              <div className="mt-8">
                <h2
                  className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-4"
                  style={{ fontFamily: "'Lora', Georgia, serif" }}
                >
                  Related Gists
                </h2>
                <div className="flex flex-col gap-3">
                  {gist.related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/admissions/gists/${r.slug}`}
                      className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-green-300 hover:shadow-sm transition-all"
                    >
                      <div>
                        <span className="text-[13px] font-extrabold text-green-600 uppercase tracking-wide block mb-0.5">
                          {r.tag}
                        </span>
                        <span className="text-base font-semibold text-[#0d1a0f]">{r.title}</span>
                      </div>
                      <span className="text-[#9db5a3] flex-shrink-0 ml-4">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Back */}
            <Link
              href="/admissions"
              className="flex items-center gap-2 text-base font-bold text-green-600 hover:underline"
            >
              ← Back to Admissions Hub
            </Link>

            {/* Coming Up */}
            <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-extrabold text-[#0d1a0f]">📅 Coming Up</h3>
              </div>
              <div className="px-5 py-4">
                {COMING_UP.map((item, i, arr) => (
                  <div key={i} className={`flex items-start gap-3 py-3 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${item.dot}`} />
                    <div>
                      <strong className="text-base font-bold text-[#0d1a0f] block">{item.title}</strong>
                      <span className="text-sm text-[#9db5a3]">{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scholarships CTA */}
            <div className="bg-[#0d1a0f] rounded-2xl p-6">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                Don&apos;t miss out
              </div>
              <h3 className="text-[20px] text-white leading-tight tracking-[-0.5px] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                47 scholarships open right now
              </h3>
              <p className="text-sm text-white/45 leading-relaxed mb-4">
                Shell, MTN, Federal Scholarship Board and more — all updated weekly.
              </p>
              <Link
                href="/admissions"
                className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
              >
                Browse Scholarships →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
