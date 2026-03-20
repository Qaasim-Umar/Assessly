"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Navbar, { LogoIcon } from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./landing.css";

// ── Icons ─────────────────────────────────────────────────────────────────────
function ArrowRight() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#DBEAFE" />
            <path d="M5 8L7 10L11 6" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const step = Math.ceil(target / (1800 / 16));
                let current = 0;
                const timer = setInterval(() => {
                    current = Math.min(current + step, target);
                    setCount(current);
                    if (current >= target) clearInterval(timer);
                }, 16);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FeatureCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: string }) {
    return (
        <div className="feature-card">
            <div className={`feature-icon-wrap ${accent}`}>{icon}</div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="step-card">
            <div className="step-number">{number}</div>
            <h3 className="step-title">{title}</h3>
            <p className="step-desc">{description}</p>
        </div>
    );
}

function Testimonial({ quote, name, role, initials }: { quote: string; name: string; role: string; initials: string }) {
    return (
        <div className="testimonial-card">
            <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#FBBF24">
                        <path d="M7 1L8.545 5.09H13L9.545 7.41L10.909 11.5L7 9.09L3.091 11.5L4.455 7.41L1 5.09H5.455L7 1Z" />
                    </svg>
                ))}
            </div>
            <p className="testimonial-quote">&ldquo;{quote}&rdquo;</p>
            <div className="testimonial-author">
                <div className="testimonial-avatar">{initials}</div>
                <div>
                    <div className="testimonial-name">{name}</div>
                    <div className="testimonial-role">{role}</div>
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://assessly.app/#organization",
                name: "Assessly",
                url: "https://assessly.app",
                logo: {
                    "@type": "ImageObject",
                    url: "https://assessly.app/opengraph-image.png",
                    width: 1200,
                    height: 630,
                },
                description:
                    "Nigeria's leading Computer-Based Testing (CBT) platform for secondary schools. AI-powered exam creation, instant results, and free practice for WAEC, JAMB, and NECO students.",
                sameAs: [],
            },
            {
                "@type": "WebSite",
                "@id": "https://assessly.app/#website",
                url: "https://assessly.app",
                name: "Assessly",
                description:
                    "Smart CBT exam platform for Nigerian schools and students.",
                publisher: { "@id": "https://assessly.app/#organization" },
                potentialAction: {
                    "@type": "SearchAction",
                    target: {
                        "@type": "EntryPoint",
                        urlTemplate: "https://assessly.app/general?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "WebPage",
                "@id": "https://assessly.app/landing",
                url: "https://assessly.app/landing",
                name: "Assessly — Smart CBT Exams for Nigerian Schools",
                isPartOf: { "@id": "https://assessly.app/#website" },
                about: { "@id": "https://assessly.app/#organization" },
                description:
                    "Create, manage and deliver Computer-Based Tests in minutes. Free WAEC, JAMB & NECO practice for every student.",
            },
        ],
    };

    return (
        <div className="landing-root">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* ══════════════════════════════════════════════════════════════════
          COMBINED HERO — left: Schools/Admin · right: Students/Practice
         ══════════════════════════════════════════════════════════════════ */}
            <section id="practice" className="hero-section">
                <div className="hero-bg-grid" />
                <div className="hero-split">

                    {/* ── LEFT PANE: For Schools ───────────────────────────────── */}
                    <div className="hero-pane">
                        <div className="hero-pane-label">
                            <span className="pane-dot" />
                            For Educators &amp; Schools
                        </div>

                        <h1 className="hero-pane-headline">
                            Run School Exams
                            <span className="headline-blue"> Smarter &amp; Faster</span>
                        </h1>

                        <p className="hero-pane-sub">
                            Assessly lets teachers create, manage, and deliver Computer-Based Tests in minutes.
                            Upload a PDF — our AI structures the questions automatically.
                        </p>

                        <div className="hero-pane-actions">
                            <Link href="/dashboard/login" className="btn-primary">
                                Get Started Free <ArrowRight />
                            </Link>
                            <a href="#how-it-works" className="btn-ghost">See how it works</a>
                        </div>

                        <div className="hero-pane-proof">
                            <div className="avatar-stack">
                                {["MO", "SA", "TA"].map(i => (
                                    <div key={i} className="avatar-chip">{i}</div>
                                ))}
                            </div>
                            <span className="social-proof-text">Trusted by 500+ teachers across Nigeria</span>
                        </div>

                        {/* Mini dashboard mockup */}
                        <div className="pane-mockup-wrap">
                            <div className="mockup-bar">
                                <div className="mockup-dot red" /><div className="mockup-dot yellow" /><div className="mockup-dot green" />
                                <span className="mockup-url">assessly.app/dashboard</span>
                            </div>
                            <div className="mockup-body">
                                <div className="mockup-sidebar">
                                    <div className="mockup-logo-sm"><LogoIcon size={20} /></div>
                                    <div className="mockup-nav-item active-nav">📋 Exams</div>
                                    <div className="mockup-nav-item">📊 Results</div>
                                    <div className="mockup-nav-item">⚙️ Settings</div>
                                </div>
                                <div className="mockup-content">
                                    <div className="mockup-header">
                                        <span className="mockup-title">Live Exams</span>
                                        <div className="mockup-badge-live"><span className="live-dot" />LIVE</div>
                                    </div>
                                    {[
                                        { name: "Mathematics — SS3", subject: "M", time: "2h", students: "87" },
                                        { name: "English Language — JS2", subject: "E", time: "1h 30m", students: "54" },
                                        { name: "Biology — SS1", subject: "B", time: "45m", students: "63" },
                                    ].map((exam, i) => (
                                        <div key={i} className="mockup-exam-row">
                                            <div className="mockup-exam-icon">{exam.subject}</div>
                                            <div className="mockup-exam-info">
                                                <div className="mockup-exam-name">{exam.name}</div>
                                                <div className="mockup-exam-meta">⏱ {exam.time} · 👥 {exam.students}</div>
                                            </div>
                                            <div className="mockup-exam-status">Published</div>
                                        </div>
                                    ))}
                                    <div className="mockup-create-btn">+ Create New Exam</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT PANE: For Students / Practice ─────────────────── */}
                    <div className="hero-pane hero-pane-right">
                        <div className="hero-pane-label" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
                            Free for Every Student
                        </div>

                        <h2 className="hero-pane-headline">
                            Ace WAEC, JAMB &amp; NECO
                            <span className="headline-blue"> — no login needed</span>
                        </h2>

                        <p className="hero-pane-sub">
                            Access thousands of past questions across all major Nigerian exams — completely free.
                            No school code, no account, no cost. Just pick and practise.
                        </p>

                        <div className="practice-exam-tags">
                            {["WAEC", "JAMB / UTME", "NECO", "BECE", "Post-UTME", "Mock Tests"].map(tag => (
                                <span key={tag} className="exam-tag">{tag}</span>
                            ))}
                        </div>

                        <div className="practice-perks">
                            {[
                                { icon: "⚡", text: "Instant score & review" },
                                { icon: "📚", text: "Thousands of past questions" },
                                { icon: "🔓", text: "Zero account required" },
                                { icon: "🏆", text: "Track your personal best" },
                            ].map(({ icon, text }) => (
                                <div key={text} className="practice-perk">
                                    <span className="perk-icon">{icon}</span>
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="hero-pane-actions">
                            <Link href="/general" className="practice-cta">
                                Start Practising Free <ArrowRight />
                            </Link>
                            <Link href="/login" className="practice-cta-ghost">
                                Student login →
                            </Link>
                        </div>

                        {/* Mini exam card mockup */}
                        <div className="pc-card">
                            <div className="pc-header">
                                <div className="pc-exam-badge">WAEC 2024</div>
                                <div className="pc-subject">Mathematics</div>
                                <div className="pc-meta">50 Questions · 90 mins</div>
                            </div>
                            <div className="pc-question">
                                <div className="pc-q-num">Question 12 of 50</div>
                                <div className="pc-q-text">If 3x + 5 = 20, find the value of x.</div>
                                <div className="pc-options">
                                    {["A. 3", "B. 5", "C. 7", "D. 8"].map((opt, i) => (
                                        <div key={i} className={`pc-option ${i === 1 ? "pc-option-selected" : ""}`}>{opt}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="pc-footer">
                                <div className="pc-score-bar"><div className="pc-score-fill" /></div>
                                <span className="pc-score-text">24% complete</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── Stats ───────────────────────────────────────────────────────── */}
            <section className="stats-section">
                <div className="stats-inner">
                    {[
                        { label: "Exams Created", value: 12000, suffix: "+" },
                        { label: "Students Served", value: 85000, suffix: "+" },
                        { label: "Schools Onboarded", value: 500, suffix: "+" },
                        { label: "Avg. Setup Time", value: 5, suffix: " min" },
                    ].map(({ label, value, suffix }) => (
                        <div key={label}>
                            <div className="stat-value"><AnimatedCounter target={value} suffix={suffix} /></div>
                            <div className="stat-label">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ────────────────────────────────────────────────────── */}
            <section id="features" className="features-section">
                <div className="section-inner">
                    <div className="section-tag">Features</div>
                    <h2 className="section-headline">Everything your school needs</h2>
                    <p className="section-subtext">From exam creation to result analysis — Assessly handles it all in one place.</p>
                    <div className="features-grid">
                        <FeatureCard accent="accent-blue"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l1.286.6M14.25 3.104c.251.023.501.05.75.082M19.5 7.5l-1.607 7.929A2.25 2.25 0 0115.694 18H8.306a2.25 2.25 0 01-2.199-1.571L4.5 7.5" /></svg>}
                            title="AI Question Parser"
                            description="Upload any PDF question paper and our AI automatically extracts, classifies, and structures questions by difficulty — saving hours of manual work."
                        />
                        <FeatureCard accent="accent-purple"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            title="Timed CBT Exams"
                            description="Set custom durations with automatic submission when time runs out. Students get real-time warnings and can't skip ahead without reviewing every question."
                        />
                        <FeatureCard accent="accent-green"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
                            title="Multi-Tenant Schools"
                            description="Each school gets a unique code. Students log in with their school code ensuring complete data isolation — your exams are only visible to your students."
                        />
                        <FeatureCard accent="accent-orange"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-6.75c0-.621.504-1.125 1.125-1.125h2.25C13.496 5.25 14 5.754 14 6.375v13.5c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 019.75 19.875V6.375zm6.75 3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V10.125z" /></svg>}
                            title="Instant Results"
                            description="Exam results and scores are computed and displayed instantly — no manual grading. Track student performance with per-question analytics."
                        />
                        <FeatureCard accent="accent-blue"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
                            title="Secure &amp; Reliable"
                            description="Powered by Supabase with row-level security. Student sessions are auth-gated, exam attempts are logged, and all data is encrypted in transit and at rest."
                        />
                        <FeatureCard accent="accent-teal"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>}
                            title="General Mode Exams"
                            description="Create public practice exams open to anyone — no school code needed. Perfect for mock tests, demos, or open assessments with instant score display."
                        />
                    </div>
                </div>
            </section>

            {/* ── How it Works ─────────────────────────────────────────────────── */}
            <section id="how-it-works" className="hiw-section">
                <div className="hiw-bg" />
                <div className="section-inner hiw-inner">
                    <div className="section-tag">How it Works</div>
                    <h2 className="section-headline">Up and running in minutes</h2>
                    <p className="section-subtext">No technical knowledge required. If you can upload a PDF and fill a form, you can run a CBT exam.</p>
                    <div className="steps-grid">
                        {[
                            { n: "01", t: "Create your admin account", d: "Sign up in seconds. A unique school code is automatically generated for your institution." },
                            { n: "02", t: "Upload your question paper", d: "Drop in a PDF or enter questions manually. AI parses and categorises questions by difficulty level." },
                            { n: "03", t: "Configure & publish", d: "Set subject, class level, duration, and question count. Save as draft or publish live instantly." },
                            { n: "04", t: "Students sit the exam", d: "Students log in with the school code. They get a timed, question-by-question exam interface." },
                            { n: "05", t: "View instant results", d: "Scores are computed automatically. Review per-student and per-question analytics in your dashboard." },
                            { n: "06", t: "Iterate & improve", d: "Reuse questions across exams, edit drafts, and track progress over time — all in one place." },
                        ].map(({ n, t, d }) => <StepCard key={n} number={n} title={t} description={d} />)}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────────────────────────────── */}
            <section id="testimonials" className="testimonials-section">
                <div className="section-inner">
                    <div className="section-tag">Testimonials</div>
                    <h2 className="section-headline">Teachers love Assessly</h2>
                    <p className="section-subtext">Real feedback from educators using the platform every day.</p>
                    <div className="testimonials-grid">
                        <Testimonial
                            quote="Setting up our first CBT exam took less than 10 minutes. The AI parsed our question bank PDF perfectly — it was like magic."
                            name="Mrs. Adeyemi" role="Senior Teacher, Government Sec. School Lagos" initials="MA"
                        />
                        <Testimonial
                            quote="My students felt more confident knowing they could see their scores immediately. The timed interface is clean and stress-free."
                            name="Mr. Okonkwo" role="HOD Mathematics, Bright Future Academy" initials="BO"
                        />
                        <Testimonial
                            quote="The school code system is genius. Each of our campuses has its own code — students only ever see their own exams."
                            name="Dr. Fatima Hassan" role="Principal, Hillside Group of Schools" initials="FH"
                        />
                    </div>
                </div>
            </section>

            {/* ── Pricing ──────────────────────────────────────────────────────── */}
            <section id="pricing" className="pricing-section">
                <div className="section-inner">
                    <div className="section-tag">Pricing</div>
                    <h2 className="section-headline">Simple, honest pricing</h2>
                    <p className="section-subtext">Start for free. Scale when you need to.</p>
                    <div className="pricing-grid">
                        <div className="pricing-card">
                            <div className="pricing-name">Starter</div>
                            <div className="pricing-price">Free <span className="pricing-period">forever</span></div>
                            <ul className="pricing-features">
                                {["Up to 3 active exams", "50 student accounts", "AI question parsing", "Instant results"].map(f => (
                                    <li key={f}><CheckIcon /> {f}</li>
                                ))}
                            </ul>
                            <Link href="/dashboard/login" className="pricing-btn pricing-btn-ghost">Get started</Link>
                        </div>
                        <div className="pricing-card pricing-card-featured">
                            <div className="pricing-badge">Most Popular</div>
                            <div className="pricing-name pricing-name-light">Pro</div>
                            <div className="pricing-price pricing-price-light">₦5,000 <span className="pricing-period-light">/month</span></div>
                            <ul className="pricing-features pricing-features-light">
                                {["Unlimited active exams", "Unlimited students", "Advanced AI classification", "General Mode (public exams)", "Detailed analytics", "Priority support"].map(f => (
                                    <li key={f}><CheckIcon /> {f}</li>
                                ))}
                            </ul>
                            <Link href="/dashboard/login" className="pricing-btn pricing-btn-solid">Start free trial</Link>
                        </div>
                        <div className="pricing-card">
                            <div className="pricing-name">School</div>
                            <div className="pricing-price">Custom</div>
                            <ul className="pricing-features">
                                {["Everything in Pro", "Multiple admin accounts", "Campus-level isolation", "Bulk student import", "Dedicated support"].map(f => (
                                    <li key={f}><CheckIcon /> {f}</li>
                                ))}
                            </ul>
                            <a href="mailto:hello@assessly.app" className="pricing-btn pricing-btn-ghost">Contact us</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────────── */}
            <section className="cta-section">
                <div className="cta-inner">
                    <h2 className="cta-headline">Ready to modernise your exams?</h2>
                    <p className="cta-subtext">Join hundreds of Nigerian schools running smarter, fairer Computer-Based Tests with Assessly.</p>
                    <div className="cta-actions">
                        <Link href="/dashboard/login" className="btn-primary cta-btn">
                            Create free account <ArrowRight />
                        </Link>
                        <Link href="/general" className="cta-btn-ghost">Start practising free →</Link>
                    </div>
                </div>
                <div className="cta-glow" />
            </section>

            <Footer />
        </div>
    );
}
