"use client";

import "./landing/landing.css";
import Link from "next/link";
import { Lightbulb, Timer, Flame, BarChart3, Sparkles, KeyRound, Zap, Globe, BookOpen, PenLine, Building2, Users, CalendarDays, ClipboardCheck, Newspaper, Award, ArrowRight, type LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ── Data ──────────────────────────────────────────────────────────────────────

const STUDENT_FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: Lightbulb, title: "Hints & Explanations", desc: "Stuck on a question? Request a hint. After answering, get a full explanation of why the right answer is right, not just what it is." },
    { Icon: Timer, title: "Timed Mock Exams", desc: "Practice with countdowns, question navigation, and automatic submission when time runs out." },
    { Icon: Flame, title: "Survival Mode", desc: "One wrong answer ends the run, giving you a different way to practise questions and improve your streak." },
    { Icon: BarChart3, title: "Instant Scoring", desc: "See your score the moment you finish. Review every question, see what you got wrong, and understand exactly why." },
];

const SCHOOL_FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: CalendarDays, title: "Academic Terms & Classes", desc: "Create academic terms, organise active classes, and archive older classes without deleting their pupils, assessments, or results." },
    { Icon: Users, title: "Pupil Accounts Without Email", desc: "Add pupils to classes and manage their access using a School Code, Pupil ID, and six-digit PIN." },
    { Icon: ClipboardCheck, title: "Objective & Theory Assessments", desc: "Create assignments, tests, exams, or practice assessments with objective and theory questions." },
    { Icon: Timer, title: "Class Assignment & Scheduling", desc: "Assign an assessment to one or more classes, publish it immediately, or schedule its opening and closing times." },
    { Icon: Zap, title: "Automatic Scoring & Grading", desc: "Objective responses are scored automatically while teachers review and award marks for theory answers." },
    { Icon: BarChart3, title: "Results & Class Reports", desc: "Review pupil submissions, control result visibility, compare class performance, and export filtered reports." },
];

const EDUCATOR_WORKSPACES: { Icon: LucideIcon; name: string; title: string; desc: string }[] = [
    { Icon: Globe, name: "Creator workspace", title: "Create standalone CBT exams", desc: "Build and manage exams for a group without setting up classes or an academic term." },
    { Icon: Building2, name: "School workspace", title: "Manage structured school assessments", desc: "Organise terms, classes, pupils, assigned assessments, grading, results, and reports." },
];

const STEPS = [
    { n: 1, t: "Create the School profile", d: "Add your School name, type, contact details, and location to open the management workspace." },
    { n: 2, t: "Set up terms and classes", d: "Create the current academic term, then add the classes that will receive assessments." },
    { n: 3, t: "Add pupils without email", d: "Create pupil accounts, place each pupil in a class, and manage their access from the dashboard." },
    { n: 4, t: "Share secure login details", d: "Each pupil signs in with the School Code, their Pupil ID, and a six-digit PIN." },
    { n: 5, t: "Create the assessment", d: "Set the subject and duration, then add objective questions, theory questions, or both." },
    { n: 6, t: "Assign and publish", d: "Choose one or more classes and publish immediately or schedule the assessment for later." },
    { n: 7, t: "Score objective answers", d: "Objective responses are marked automatically when a pupil submits the assessment." },
    { n: 8, t: "Grade theory and review reports", d: "Award theory marks, release completed results, and review pupil and class performance." },
];

const PLATFORM_BENEFITS: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: BookOpen, title: "Review answers", desc: "Check your answer after each question and use available hints or explanations while revising." },
    { Icon: Timer, title: "Choose a practice mode", desc: "Switch between regular practice, timed sessions, study tools, and Survival Mode." },
    { Icon: KeyRound, title: "Manage school assessments", desc: "Set up classes and pupils, assign assessments, grade theory responses, and review results." },
];

const TRUST_STATS = [
    { num: "5", label: "Practice modes" },
    { num: "No account", label: "Free student practice" },
    { num: "Objective + Theory", label: "Assessment questions" },
    { num: "Class-based", label: "School assessments" },
];

const ADMISSIONS_TOPICS: { Icon: LucideIcon; title: string; desc: string }[] = [
    { Icon: Award, title: "Scholarships", desc: "Funding opportunities for Nigerian students." },
    { Icon: CalendarDays, title: "Deadlines & Cut-offs", desc: "Important admission dates and institution requirements." },
    { Icon: Newspaper, title: "School & NYSC Updates", desc: "Admission news, school information, and NYSC guidance." },
    { Icon: BookOpen, title: "Question Packs", desc: "Focused past-question packs for further practice." },
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
                        CBT practice and school assessment tools for Nigerian students and educators.
                        Practise freely, create exams, or manage classes, pupils, and results.
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
                            <div className="lp-split-tag">I&apos;m an educator</div>
                            <div className="lp-split-title">Create exams.<br />Manage your school.</div>
                            <p className="lp-split-desc">Use Creator workspace for standalone CBT exams or School workspace for terms, classes, pupils, assessments, and reports.</p>
                            <span className="lp-split-cta">Open educator dashboard →</span>
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
                    <p className="lp-section-sub">Practice questions organised for JAMB, WAEC, NECO, and BECE, with feedback on every answer.</p>

                    <div className="lp-features-grid">
                        <div className="lp-no-login">
                            <span className="lp-no-login-icon"><Zap size={20} strokeWidth={1.8} /></span>
                            <div>
                                <strong>No account needed. Start right away.</strong>
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
                    <p className="lp-section-sub lp-sub-on-dark">One educator account gives you two focused workspaces, from standalone exam creation to class-based School assessment management.</p>

                    <div className="lp-workspace-panel" aria-labelledby="educator-workspaces-heading">
                        <div className="lp-workspace-heading">
                            <span>Choose the right workspace</span>
                            <h3 id="educator-workspaces-heading">Two ways to create and manage assessments</h3>
                        </div>
                        <div className="lp-workspace-grid">
                            {EDUCATOR_WORKSPACES.map(({ Icon, name, title, desc }) => (
                                <article key={name} className="lp-workspace-card">
                                    <div className="lp-workspace-icon"><Icon size={21} strokeWidth={1.8} /></div>
                                    <div>
                                        <span className="lp-workspace-name">{name}</span>
                                        <h4>{title}</h4>
                                        <p>{desc}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

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
                    <p className="lp-section-sub">From School setup to final reports, each step stays inside the School workspace.</p>

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

            {/* ── ADMISSIONS HUB ── */}
            <section className="lp-section lp-admissions-section" aria-labelledby="admissions-heading">
                <div className="lp-section-inner">
                    <div className="lp-admissions-card">
                        <div className="lp-admissions-copy">
                            <div className="lp-section-eyebrow">Admissions Hub</div>
                            <h2 id="admissions-heading">Move from exam practice to your next opportunity</h2>
                            <p>Browse scholarships, admission deadlines, cut-off marks, school updates, NYSC information, and focused question packs in one place.</p>
                            <div className="lp-admissions-actions">
                                <Link href="/admissions" className="lp-admissions-primary">Explore Admissions Hub <ArrowRight size={17} aria-hidden="true" /></Link>
                                <Link href="/admissions/question-bank" className="lp-admissions-secondary">Open Question Bank</Link>
                            </div>
                        </div>
                        <div className="lp-admissions-topics">
                            {ADMISSIONS_TOPICS.map(({ Icon, title, desc }) => (
                                <article key={title} className="lp-admissions-topic">
                                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                                    <div><h3>{title}</h3><p>{desc}</p></div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" className="lp-section lp-section-surface">
                <div className="lp-section-inner">
                    <div className="lp-section-eyebrow">Pricing</div>
                    <h2 className="lp-section-title">Simple, honest pricing</h2>
                    <p className="lp-section-sub">Students practise free. Schools get the complete assessment workspace for one price per academic term.</p>

                    <div className="lp-pricing-note">
                        <Sparkles size={14} strokeWidth={1.8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Student practice is free. No card or account needed.
                    </div>

                    <div className="lp-pricing-grid">
                        <div className="lp-pricing-card">
                            <div className="lp-plan-name">Student Practice</div>
                            <div className="lp-price">Free</div>
                            <div className="lp-cadence">Forever</div>
                            <ul className="lp-plan-features">
                                {["Five practice modes", "JAMB, WAEC, NECO & BECE practice", "Hints and explanations", "No account or card required"].map(f => <li key={f}>{f}</li>)}
                            </ul>
                            <Link href="/general" className="lp-plan-cta lp-cta-outline">Start practising</Link>
                        </div>

                        <div className="lp-pricing-card lp-pricing-featured">
                            <div className="lp-pricing-badge">Full school access</div>
                            <div className="lp-plan-name">School</div>
                            <div className="lp-price"><span className="lp-price-symbol">₦</span>25,000</div>
                            <div className="lp-cadence">per academic term</div>
                            <ul className="lp-plan-features">
                                {["Classes and academic terms", "Pupil accounts with School Code, Pupil ID & PIN", "Objective and theory assessments", "Assign, publish or schedule assessments", "Automatic objective scoring and theory grading", "Results and class performance reports", "Reuse questions across exams"].map(f => <li key={f}>{f}</li>)}
                            </ul>
                            <Link href="/dashboard/login" className="lp-plan-cta lp-cta-primary">Set up your school</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="lp-cta-section">
                <div className="lp-cta-inner">
                    <h2>Ready to get started?</h2>
                    <p>Whether you&apos;re a student who wants to practise for free or a school ready to modernise your exams, Assessly has you covered.</p>
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
