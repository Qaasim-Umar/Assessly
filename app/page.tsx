"use client";

import "./landing/landing.css";
import Link from "next/link";
import { Lightbulb, Timer, Flame, BarChart3, Sparkles, KeyRound, Zap, ShieldCheck, Globe, BookOpen, PenLine, type LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ── Data ──────────────────────────────────────────────────────────────────────

const STUDENT_FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: Lightbulb, title: "Hints & Explanations", desc: "Stuck on a question? Request a hint. After answering, get a full explanation of why the right answer is right — not just what it is." },
    { Icon: Timer, title: "Timed Mock Exams", desc: "Practice with countdowns, question navigation, and automatic submission when time runs out." },
    { Icon: Flame, title: "Survival Mode", desc: "One wrong answer ends the run, giving you a different way to practise questions and improve your streak." },
    { Icon: BarChart3, title: "Instant Scoring", desc: "See your score the moment you finish. Review every question, see what you got wrong, and understand exactly why." },
];

const SCHOOL_FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: PenLine, title: "Question Builder", desc: "Enter and organise questions, answer options, explanations, and difficulty levels in a structured exam builder." },
    { Icon: Timer, title: "Timed CBT Exams", desc: "Set custom durations with automatic submission when time runs out. Students get real-time warnings and a clean question-by-question interface." },
    { Icon: KeyRound, title: "School Code Access", desc: "Each school receives a unique code so students can access the exams associated with their school." },
    { Icon: Zap, title: "Instant Results", desc: "Scores are computed and displayed the moment a student submits. No manual grading. Track performance per student and per question." },
    { Icon: ShieldCheck, title: "Controlled Access", desc: "Administrator access, school codes, and database access rules help keep school assessment records separated." },
    { Icon: Globe, title: "General Mode", desc: "Create public practice exams that can be opened without a school code for mock tests, demos, or open assessments." },
];

const STEPS = [
    { n: 1, t: "Create your admin account", d: "Register your institution and receive the school code students will use to access its exams." },
    { n: 2, t: "Add your questions", d: "Enter questions, answer options, explanations, and difficulty levels using the exam builder." },
    { n: 3, t: "Configure & publish", d: "Set the subject, class level, duration, and question count. Save a draft or publish when it is ready." },
    { n: 4, t: "Students sit the exam", d: "Students log in with the school code. They get a timed, question-by-question exam interface." },
    { n: 5, t: "View instant results", d: "Scores are computed automatically. Review per-student and per-question analytics in your dashboard." },
    { n: 6, t: "Iterate & improve", d: "Reuse questions across exams, edit drafts, and track progress over time — all in one place." },
];

const PLATFORM_BENEFITS: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: BookOpen, title: "Review answers", desc: "Check your answer after each question and use available hints or explanations while revising." },
    { Icon: Timer, title: "Choose a practice mode", desc: "Switch between regular practice, timed sessions, study tools, and Survival Mode." },
    { Icon: KeyRound, title: "Run school assessments", desc: "Create exams, share a school code with students, and review submitted results from the dashboard." },
];

const TRUST_STATS = [
    { num: "JAMB", label: "Practice" },
    { num: "WAEC", label: "Practice" },
    { num: "NECO", label: "Practice" },
    { num: "BECE", label: "Practice" },
    { num: "Free", label: "Student access" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            { "@type": "Organization", "@id": "https://www.assessly.ng/#organization", name: "Assessly", url: "https://www.assessly.ng", description: "A Computer-Based Testing (CBT) platform for secondary schools in Nigeria." },
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
                        Prepare for exams.<br />
                        <em>Run better tests.</em>
                    </h1>
                    <p className="lp-hero-sub">
                        Exam practice for students and a complete CBT platform for schools.
                        Start practising or create and manage your own assessments.
                    </p>

                    <div className="lp-split">
                        <Link href="/general" className="lp-split-card lp-split-student">
                            <div className="lp-split-tag">I&apos;m a student</div>
                            <div className="lp-split-title">Practise free.<br />Learn as you go.</div>
                            <p className="lp-split-desc">JAMB, WAEC, NECO &amp; BECE past questions with hints and explanations. No account needed.</p>
                            <span className="lp-split-cta">Start practising →</span>
                            <span className="lp-split-bg" aria-hidden="true"><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></span>
                        </Link>
                        <Link href="/dashboard/login" className="lp-split-card lp-split-school">
                            <div className="lp-split-tag">I run a school</div>
                            <div className="lp-split-title">Create and manage<br />CBT exams.</div>
                            <p className="lp-split-desc">Add your questions, set a duration, and publish. Students log in with your school code and sit the exam.</p>
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
                        <div key={num} className="lp-trust-stat">
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
                    <h2 className="lp-section-title">Tools for focused<br />exam practice</h2>
                    <p className="lp-section-sub">Practice questions organised for JAMB, WAEC, NECO, and BECE — with feedback on every answer.</p>

                    <div className="lp-features-grid">
                        <div className="lp-no-login">
                            <span className="lp-no-login-icon"><Zap size={20} strokeWidth={1.8} /></span>
                            <div>
                                <strong>No account needed — start right away</strong>
                                <p>Most platforms make you sign up before you can practise a single question. Assessly doesn&apos;t. Pick a subject, pick a mode, and go.</p>
                            </div>
                        </div>

                        <div className="lp-feature-card lp-feature-highlight">
                            <div className="lp-highlight-content">
                                <div className="lp-feature-icon"><BookOpen size={24} strokeWidth={1.8} /></div>
                                <h3>Past questions by year and subject</h3>
                                <p>Browse the questions currently available for each exam, then review answers, hints, and explanations as you practise.</p>
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
                    <h2 className="lp-section-title lp-title-on-dark">Tools for running school exams</h2>
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
                    <h2 className="lp-section-title">How school exam setup works</h2>
                    <p className="lp-section-sub">No technical knowledge required. The guided exam builder takes you from question entry to publishing.</p>

                    <div className="lp-steps-grid">
                        {STEPS.map(({ n, t, d }) => (
                            <div key={n} className="lp-step">
                                <div className="lp-step-num">{n}</div>
                                <div className="lp-step-body">
                                    <h3>{t}</h3>
                                    <p>{d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PLATFORM BENEFITS ── */}
            <section id="benefits" className="lp-section">
                <div className="lp-section-inner">
                    <div className="lp-section-eyebrow">What you can do</div>
                    <h2 className="lp-section-title">Practice, assess, and review</h2>
                    <p className="lp-section-sub">These are the core tools currently available to students and schools on Assessly.</p>

                    <div className="lp-benefits-grid">
                        {PLATFORM_BENEFITS.map(({ Icon, title, desc }) => (
                            <div key={title} className="lp-benefit-card">
                                <div className="lp-feature-icon"><Icon size={24} strokeWidth={1.8} /></div>
                                <h3>{title}</h3>
                                <p>{desc}</p>
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
                        <Sparkles size={14} strokeWidth={1.8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Student practice is free — no card or account needed.
                    </div>

                    <div className="lp-pricing-grid">
                        <div className="lp-pricing-card">
                            <div className="lp-plan-name">Starter</div>
                            <div className="lp-price">Free</div>
                            <div className="lp-cadence">Forever</div>
                            <ul className="lp-plan-features">
                                {["Up to 3 active exams", "50 student accounts", "Manual question entry", "Instant results"].map(f => <li key={f}>{f}</li>)}
                            </ul>
                            <Link href="/dashboard/login" className="lp-plan-cta lp-cta-outline">Get started free</Link>
                        </div>

                        <div className="lp-pricing-card lp-pricing-featured">
                            <div className="lp-plan-name">Pro</div>
                            <div className="lp-price"><span className="lp-price-symbol">₦</span>5,000</div>
                            <div className="lp-cadence">per month</div>
                            <ul className="lp-plan-features">
                                {["Unlimited active exams", "Unlimited students", "Question difficulty settings", "General Mode (public exams)", "Detailed analytics", "Priority support"].map(f => <li key={f}>{f}</li>)}
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
            <Footer />
        </div>
    );
}
