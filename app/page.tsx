"use client";

import "./landing/landing.css";
import Link from "next/link";
import { useState } from "react";
import { Lightbulb, Timer, Flame, BarChart3, Sparkles, KeyRound, Zap, ShieldCheck, Globe, BookOpen, PenLine, Trophy, Medal, Star, type LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";

// ── Data ──────────────────────────────────────────────────────────────────────

const STUDENT_FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: Lightbulb, title: "Hints & Explanations", desc: "Stuck on a question? Request a hint. After answering, get a full explanation of why the right answer is right — not just what it is." },
    { Icon: Timer, title: "Timed Mock Exams", desc: "Simulate the real exam environment with countdowns, question navigation, and auto-submission when time runs out." },
    { Icon: Flame, title: "Survival Mode", desc: "One wrong answer ends your run. Beat your personal best. A high-pressure mode that builds real exam confidence." },
    { Icon: BarChart3, title: "Instant Scoring", desc: "See your score the moment you finish. Review every question, see what you got wrong, and understand exactly why." },
];

const SCHOOL_FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: Sparkles, title: "AI Question Parser", desc: "Upload any PDF question paper and our AI automatically extracts, classifies, and structures questions by difficulty — saving hours of manual entry." },
    { Icon: Timer, title: "Timed CBT Exams", desc: "Set custom durations with automatic submission when time runs out. Students get real-time warnings and a clean question-by-question interface." },
    { Icon: KeyRound, title: "School Code Isolation", desc: "Each school gets a unique code. Students log in with that code — your exams and data are completely invisible to other schools." },
    { Icon: Zap, title: "Instant Results", desc: "Scores are computed and displayed the moment a student submits. No manual grading. Track performance per student and per question." },
    { Icon: ShieldCheck, title: "Secure & Reliable", desc: "Powered by Supabase with row-level security. Auth-gated student sessions, logged attempts, and all data encrypted in transit and at rest." },
    { Icon: Globe, title: "General Mode", desc: "Create public practice exams open to anyone — no school code needed. Perfect for mock tests, demos, or open assessments." },
];

const STEPS = [
    { n: 1, t: "Create your admin account", d: "Sign up in seconds. A unique school code is automatically generated for your institution." },
    { n: 2, t: "Upload your question paper", d: "Drop in a PDF or enter questions manually. AI parses and categorises every question by difficulty." },
    { n: 3, t: "Configure & publish", d: "Set subject, class level, duration, and question count. Save as draft or publish live instantly." },
    { n: 4, t: "Students sit the exam", d: "Students log in with the school code. They get a timed, question-by-question exam interface." },
    { n: 5, t: "View instant results", d: "Scores are computed automatically. Review per-student and per-question analytics in your dashboard." },
    { n: 6, t: "Iterate & improve", d: "Reuse questions across exams, edit drafts, and track progress over time — all in one place." },
];

const STUDENT_TESTIMONIALS: { badge: { Icon: LucideIcon; text: string } | null; quote: string; initials: string; name: string; role: string }[] = [
    { badge: { Icon: Trophy, text: "JAMB Score: 298" }, quote: "I practised on Assessly for 3 weeks before my JAMB. The past questions and explanations made such a difference — I actually understood why I was getting things wrong.", initials: "AO", name: "Amaka Okafor", role: "JAMB 2024 Candidate, Enugu" },
    { badge: { Icon: Medal, text: "WAEC: 8 A's" }, quote: "Survival Mode is addictive. I kept pushing myself to beat my streak. By the time my WAEC came, I was answering questions faster than I thought possible.", initials: "TM", name: "Tunde Makinde", role: "SS3 Student, Lagos" },
    { badge: null, quote: "I liked that I could just start without creating an account. I'm bad with passwords and always forget to verify my email. Assessly just works — no stress.", initials: "IF", name: "Ifeoma Nwachukwu", role: "JSS3 Student, Onitsha" },
];

const TEACHER_TESTIMONIALS = [
    { badge: null, quote: "Setting up our first CBT exam took less than 10 minutes. The AI parsed our question bank PDF perfectly — questions were categorised by difficulty automatically.", initials: "MA", name: "Mrs. Adeyemi", role: "Senior Teacher, Govt. Sec. School Lagos" },
    { badge: null, quote: "My students felt more confident seeing their scores immediately. The timed interface is clean — it mirrors what they'll see in the actual WAEC hall.", initials: "BO", name: "Mr. Okonkwo", role: "HOD Mathematics, Bright Future Academy" },
    { badge: null, quote: "The school code system is genius. Each of our campuses has its own code — students only ever see their own exams. We've been using Assessly across 3 branches.", initials: "FH", name: "Dr. Fatima Hassan", role: "Principal, Hillside Group of Schools" },
];

const TRUST_STATS = [
    { num: "15,000+", label: "Past Questions" },
    { num: "500+", label: "Schools" },
    { num: "85,000+", label: "Students" },
    { num: "4", label: "Exam Boards" },
    { num: "Free", label: "For every student" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
    const [tab, setTab] = useState<"students" | "teachers">("students");
    const testimonials = tab === "students" ? STUDENT_TESTIMONIALS : TEACHER_TESTIMONIALS;

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            { "@type": "Organization", "@id": "https://www.assessly.ng/#organization", name: "Assessly", url: "https://www.assessly.ng", description: "Nigeria's leading Computer-Based Testing (CBT) platform for secondary schools." },
            { "@type": "WebSite", "@id": "https://www.assessly.ng/#website", url: "https://www.assessly.ng", name: "Assessly", publisher: { "@id": "https://www.assessly.ng/#organization" } },
            { "@type": "WebPage", "@id": "https://www.assessly.ng/", url: "https://www.assessly.ng/", name: "Assessly - Smart CBT Exams for Nigerian Schools", isPartOf: { "@id": "https://www.assessly.ng/#website" } },
        ],
    };

    return (
        <div className="lp-root">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <Navbar />

            {/* ── HERO ── */}
            <section className="lp-hero">
                <div className="lp-hero-inner">
                    <h1 className="lp-h1">
                        Ace your exams.<br />
                        <em>Run better tests.</em>
                    </h1>
                    <p className="lp-hero-sub">
                        15,000+ past questions for students. A full CBT platform for schools.
                        No friction — just results.
                    </p>

                    <div className="lp-split">
                        <Link href="/general" className="lp-split-card lp-split-student">
                            <div className="lp-split-tag">I&apos;m a student</div>
                            <div className="lp-split-title">Practise free.<br />Score higher.</div>
                            <p className="lp-split-desc">JAMB, WAEC, NECO &amp; BECE past questions with hints and explanations. No account needed.</p>
                            <span className="lp-split-cta">Start practising →</span>
                            <span className="lp-split-bg" aria-hidden="true"><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></span>
                        </Link>
                        <Link href="/dashboard/login" className="lp-split-card lp-split-school">
                            <div className="lp-split-tag">I run a school</div>
                            <div className="lp-split-title">Create CBT exams<br />in minutes.</div>
                            <p className="lp-split-desc">Upload a PDF, set a duration, publish. Students log in with your school code and sit the exam.</p>
                            <span className="lp-split-cta">Set up your school →</span>
                            <span className="lp-split-bg" aria-hidden="true"><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22h18M6 18V9M10 18V9M14 18V9M18 18V9M12 2L2 7h20z"/></svg></span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── TRUST BAR ── */}
            <div className="lp-trust-bar">
                <div className="lp-trust-inner">
                    {TRUST_STATS.map(({ num, label }) => (
                        <div key={label} className="lp-trust-stat">
                            <span className="lp-trust-num">{num}</span>
                            <span className="lp-trust-label">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── STUDENT FEATURES ── */}
            <section id="students" className="lp-section">
                <div className="lp-section-inner">
                    <div className="lp-section-eyebrow">For Students</div>
                    <h2 className="lp-section-title">Everything you need<br />to ace your exams</h2>
                    <p className="lp-section-sub">Practice with real past questions from JAMB, WAEC, NECO, and BECE — with instant feedback on every answer.</p>

                    <div className="lp-features-grid">
                        <div className="lp-no-login">
                            <span className="lp-no-login-icon"><Zap size={20} strokeWidth={1.8} /></span>
                            <div>
                                <strong>No account needed — start in 10 seconds</strong>
                                <p>Most platforms make you sign up before you can practise a single question. Assessly doesn&apos;t. Pick a subject, pick a mode, and go.</p>
                            </div>
                        </div>

                        <div className="lp-feature-card lp-feature-highlight">
                            <div className="lp-highlight-content">
                                <div className="lp-feature-icon"><BookOpen size={24} strokeWidth={1.8} /></div>
                                <h3>15,000+ authentic past questions</h3>
                                <p>Real questions from official exam papers, organised by year and subject. Practice the exact papers students have sat for years.</p>
                                <div className="lp-badges">
                                    {["JAMB", "WAEC", "NECO", "BECE"].map(b => <span key={b} className="lp-badge">{b}</span>)}
                                </div>
                            </div>
                            <div className="lp-highlight-deco" aria-hidden="true"><PenLine size={72} strokeWidth={1} /></div>
                        </div>

                        {STUDENT_FEATURES.map(({ Icon, title, desc }) => (
                            <div key={title} className="lp-feature-card">
                                <div className="lp-feature-icon"><Icon size={24} strokeWidth={1.8} /></div>
                                <h3>{title}</h3>
                                <p>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SCHOOL FEATURES ── */}
            <section id="schools" className="lp-section lp-section-dark">
                <div className="lp-section-inner">
                    <div className="lp-section-eyebrow lp-eyebrow-on-dark">For Schools</div>
                    <h2 className="lp-section-title lp-title-on-dark">Everything your school needs</h2>
                    <p className="lp-section-sub lp-sub-on-dark">From exam creation to result analysis — Assessly handles it all. No technical knowledge required.</p>

                    <div className="lp-school-grid">
                        {SCHOOL_FEATURES.map(({ Icon, title, desc }) => (
                            <div key={title} className="lp-school-card">
                                <div className="lp-feature-icon lp-feature-icon-dark"><Icon size={24} strokeWidth={1.8} /></div>
                                <h3>{title}</h3>
                                <p>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how" className="lp-section lp-section-surface">
                <div className="lp-section-inner">
                    <div className="lp-section-eyebrow">How it Works</div>
                    <h2 className="lp-section-title">Up and running in minutes</h2>
                    <p className="lp-section-sub">No technical knowledge required. If you can upload a PDF and fill a form, you can run a CBT exam.</p>

                    <div className="lp-steps-grid">
                        {STEPS.map(({ n, t, d }) => (
                            <div key={n} className="lp-step">
                                <div className="lp-step-num">{n}</div>
                                <h3>{t}</h3>
                                <p>{d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section id="testimonials" className="lp-section">
                <div className="lp-section-inner">
                    <div className="lp-section-eyebrow">What people say</div>
                    <h2 className="lp-section-title">Students and teachers love Assessly</h2>

                    <div className="lp-tabs">
                        <button className={`lp-tab${tab === "students" ? " lp-tab-active" : ""}`} onClick={() => setTab("students")}>Students</button>
                        <button className={`lp-tab${tab === "teachers" ? " lp-tab-active" : ""}`} onClick={() => setTab("teachers")}>Teachers</button>
                    </div>

                    <div className="lp-testimonials-grid">
                        {testimonials.map(({ badge, quote, initials, name, role }, i) => (
                            <div key={i} className="lp-testimonial">
                                {badge && (
                                    <div className="lp-score-badge">
                                        <badge.Icon size={13} strokeWidth={2} />
                                        {' '}{badge.text}
                                    </div>
                                )}
                                <div className="lp-stars">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor" strokeWidth={0} />)}
                                </div>
                                <p className="lp-t-quote">&ldquo;{quote}&rdquo;</p>
                                <div className="lp-t-author">
                                    <div className={`lp-t-avatar${tab === "teachers" ? " lp-t-avatar-green" : ""}`}>{initials}</div>
                                    <div>
                                        <div className="lp-t-name">{name}</div>
                                        <div className="lp-t-role">{role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" className="lp-section lp-section-surface">
                <div className="lp-section-inner">
                    <div className="lp-section-eyebrow">Pricing</div>
                    <h2 className="lp-section-title">Simple, honest pricing</h2>
                    <p className="lp-section-sub">Students always practise free. Schools pay only when they need more.</p>

                    <div className="lp-pricing-note">
                        <Sparkles size={14} strokeWidth={1.8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Practising as a student? It&apos;s always free — no card, no account needed.
                    </div>

                    <div className="lp-pricing-grid">
                        <div className="lp-pricing-card">
                            <div className="lp-plan-name">Starter</div>
                            <div className="lp-price">Free</div>
                            <div className="lp-cadence">Forever</div>
                            <ul className="lp-plan-features">
                                {["Up to 3 active exams", "50 student accounts", "AI question parsing", "Instant results"].map(f => <li key={f}>{f}</li>)}
                            </ul>
                            <Link href="/dashboard/login" className="lp-plan-cta lp-cta-outline">Get started free</Link>
                        </div>

                        <div className="lp-pricing-card lp-pricing-featured">
                            <div className="lp-pricing-badge">Most Popular</div>
                            <div className="lp-plan-name">Pro</div>
                            <div className="lp-price"><span className="lp-price-symbol">₦</span>5,000</div>
                            <div className="lp-cadence">per month</div>
                            <ul className="lp-plan-features">
                                {["Unlimited active exams", "Unlimited students", "Advanced AI classification", "General Mode (public exams)", "Detailed analytics", "Priority support"].map(f => <li key={f}>{f}</li>)}
                            </ul>
                            <Link href="/dashboard/login" className="lp-plan-cta lp-cta-primary">Start free trial</Link>
                        </div>

                        <div className="lp-pricing-card">
                            <div className="lp-plan-name">School</div>
                            <div className="lp-price lp-price-custom">Custom</div>
                            <div className="lp-cadence">Contact us for a quote</div>
                            <ul className="lp-plan-features">
                                {["Everything in Pro", "Multiple admin accounts", "Campus-level isolation", "Bulk student import", "Dedicated support"].map(f => <li key={f}>{f}</li>)}
                            </ul>
                            <a href="mailto:hello@assessly.ng" className="lp-plan-cta lp-cta-outline">Talk to us</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="lp-cta-section">
                <div className="lp-cta-inner">
                    <h2>Ready to get started?</h2>
                    <p>Whether you&apos;re a student who wants to practise for free or a school ready to modernise your exams — Assessly has you covered.</p>
                    <div className="lp-cta-actions">
                        <Link href="/general" className="lp-cta-white">Start Practising Free</Link>
                        <Link href="/dashboard/login" className="lp-cta-ghost">Set Up Your School →</Link>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-top">
                        <div>
                            <Link href="/" className="lp-footer-logo">Assessly</Link>
                            <p className="lp-footer-desc">AI-powered Computer-Based Testing for Nigerian students and schools. Built for the way Nigerians learn.</p>
                        </div>
                        <div>
                            <div className="lp-footer-col-title">Product</div>
                            <ul className="lp-footer-links">
                                <li><Link href="#students">For Students</Link></li>
                                <li><Link href="#schools">For Schools</Link></li>
                                <li><Link href="#how">How it Works</Link></li>
                                <li><Link href="#pricing">Pricing</Link></li>
                            </ul>
                        </div>
                        <div>
                            <div className="lp-footer-col-title">Access</div>
                            <ul className="lp-footer-links">
                                <li><Link href="/general">Student Practice</Link></li>
                                <li><Link href="/admissions">Admissions Hub</Link></li>
                                <li><Link href="/login">Student Login</Link></li>
                                <li><Link href="/dashboard/login">Admin Login</Link></li>
                            </ul>
                        </div>
                        <div>
                            <div className="lp-footer-col-title">Company</div>
                            <ul className="lp-footer-links">
                                <li><a href="mailto:hello@assessly.ng">Contact</a></li>
                                <li><Link href="#">Privacy Policy</Link></li>
                                <li><Link href="#">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="lp-footer-bottom">
                        <p>© {new Date().getFullYear()} Assessly. All rights reserved.</p>
                        <p>Built for Nigerian students and educators</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
