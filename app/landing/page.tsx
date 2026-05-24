"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
            <circle cx="8" cy="8" r="7" fill="#DCFCE7" />
            <path d="M5 8L7 10L11 6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

// ── Hero Section Component ────────────────────────────────────────────────────
function HeroSection() {
    return (
        <section id="hero" className="hero-section-modern">
            <div className="hero-bg-grid" />
            
            {/* Main Content Container */}
            <div className="hero-container-modern">
                
                {/* Top Badge */}
                <div className="hero-badge-modern">
                    <span className="badge-dot"></span>
                    <span>Nigeria's #1 CBT Platform</span>
                </div>

                {/* Main Headline */}
                <h1 className="hero-headline-modern">
                    Run School Exams <span className="gradient-text">Smarter.</span>
                </h1>

                {/* Subheadline */}
                <p className="hero-subheadline-modern">
                    Nigeria's smartest CBT platform. Create exams in minutes using AI, publish instantly, and get results the moment students finish.
                </p>

                {/* CTA Buttons */}
                <div className="hero-cta-group">
                    <Link href="/dashboard/login" className="cta-button cta-primary">
                        <div className="cta-text">
                            <span className="cta-label">Free to get started</span>
                            <span className="cta-action">Create your school account</span>
                        </div>
                        <div className="cta-arrow"><ArrowRight /></div>
                    </Link>
                </div>

                {/* Social Proof */}
                <div className="hero-social-proof">
                    <div className="avatar-stack-modern">
                        {["MO", "SA", "TA", "ED", "FH"].map((initials, i) => (
                            <div key={i} className="avatar-modern" style={{ zIndex: 5 - i }}>
                                {initials}
                            </div>
                        ))}
                    </div>
                    <div className="proof-text">
                        <strong>500+ teachers</strong> and <strong>thousands of students</strong> trust Assessly
                    </div>
                </div>

                {/* Dashboard Preview Mockup */}
                <div className="hero-mockup-modern">
                    <div className="mockup-window">
                        <div className="mockup-titlebar">
                            <div className="mockup-dots">
                                <span className="dot red"></span>
                                <span className="dot yellow"></span>
                                <span className="dot green"></span>
                            </div>
                            <span className="mockup-url">assessly.app/dashboard</span>
                            <div className="mockup-spacer"></div>
                        </div>
                        <div className="mockup-content-modern">
                            <div className="mockup-sidebar-modern">
                                <div className="sidebar-logo">
                                    <LogoIcon size={18} />
                                    <span>Assessly</span>
                                </div>
                                <div className="sidebar-nav">
                                    <div className="nav-item active">
                                        <span>Exams</span>
                                        <span className="nav-badge">12</span>
                                    </div>
                                    <div className="nav-item">
                                        <span>Results</span>
                                    </div>
                                    <div className="nav-item">
                                        <span>Students</span>
                                    </div>
                                    <div className="nav-item">
                                        <span>Settings</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mockup-main-modern">
                                <div className="main-header">
                                    <div>
                                        <h3 className="main-title">Live Exams</h3>
                                        <p className="main-subtitle">Active assessments</p>
                                    </div>
                                    <div className="live-indicator">
                                        <span className="pulse-dot"></span>
                                        <span>3 LIVE</span>
                                    </div>
                                </div>
                                <div className="exam-cards">
                                    {[
                                        { subject: "Mathematics", class: "SS3", icon: "M", time: "2h", students: 87, color: "#16a34a" },
                                        { subject: "English Language", class: "JS2", icon: "E", time: "1h 30m", students: 54, color: "#8b5cf6" },
                                        { subject: "Biology", class: "SS1", icon: "B", time: "45m", students: 63, color: "#10b981" },
                                    ].map((exam, i) => (
                                        <div key={i} className="exam-card-mini">
                                            <div className="exam-icon-modern" style={{ background: exam.color }}>
                                                {exam.icon}
                                            </div>
                                            <div className="exam-info-modern">
                                                <div className="exam-name-modern">{exam.subject} - {exam.class}</div>
                                                <div className="exam-meta-modern">
                                                    <span>{exam.time}</span>
                                                    <span>•</span>
                                                    <span>{exam.students} students</span>
                                                </div>
                                            </div>
                                            <div className="exam-status-badge">Live</div>
                                        </div>
                                    ))}
                                </div>
                                <button className="create-exam-btn">
                                    <span>+</span>
                                    Create New Exam
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
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

// ── Modes Data (moved here for use in Hero) ──────────────────────────────────
const MODES_DATA = [
    {
        id: "practice", name: "Practice Mode", tagline: "Learn at your own pace",
        desc: "Pick a subject and topic. Get hints when stuck and full explanations after every answer. No timer, no pressure.",
        tags: ["Hints", "Explanations", "No timer"],
        iconColor: "#059669", iconBg: "#d1fae5", borderColor: "#a7f3d0",
        icon: <svg width="28" height="28" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
    },
    {
        id: "mock", name: "Mock Exam", tagline: "Simulate real exam conditions",
        desc: "Timed, exam-board style practice. Choose JAMB, WAEC, or NECO and experience the real pressure of exam day.",
        tags: ["Timed", "Exam-board style", "Score report"],
        iconColor: "#2563eb", iconBg: "#dbeafe", borderColor: "#bfdbfe",
        icon: <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        id: "survival", name: "Survival Mode", tagline: "How far can you go?",
        desc: "One question at a time. One wrong answer and it's over. Beat your streak and climb the leaderboard.",
        tags: ["Streak-based", "One life", "High stakes"],
        iconColor: "#ea580c", iconBg: "#ffedd5", borderColor: "#fed7aa",
        icon: <svg width="28" height="28" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    },
    {
        id: "past", name: "Past Questions", tagline: "Practice with real exam papers",
        desc: "Authentic past questions from JAMB, WAEC, NECO, and BECE. Organised by exam board and year.",
        tags: ["Real papers", "By year", "Full explanations"],
        iconColor: "#7c3aed", iconBg: "#ede9fe", borderColor: "#ddd6fe",
        icon: <svg width="28" height="28" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    },
    {
        id: "teacher", name: "Teacher Mode", tagline: "Create & manage CBT exams",
        desc: "Upload questions, set timers, publish exams, and view instant results - all from one dashboard.",
        tags: ["AI parsing", "Instant results", "School code"],
        iconColor: "#0369a1", iconBg: "#e0f2fe", borderColor: "#bae6fd",
        icon: <svg width="28" height="28" fill="none" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>,
    },
];

// ── Exam board badges ────────────────────────────────────────────────────────
const EXAM_BOARDS = [
    { name: "JAMB", color: "#16a34a", bg: "#dcfce7" },
    { name: "WAEC", color: "#2563eb", bg: "#dbeafe" },
    { name: "NECO", color: "#7c3aed", bg: "#ede9fe" },
    { name: "BECE", color: "#ea580c", bg: "#ffedd5" },
];

// ── Hero ─────────────────────────────────────────────────────────────────────
function HeroSectionUnified() {
    return (
        <>
            <section id="hero" className="hero-section-modern">
                <div className="hero-bg-grid" />
                <div className="hero-split-container">

                    {/* Left: copy */}
                    <div className="hero-split-left">

                        <h1 className="hero-headline-modern">
                            The Smartest Way to<br />
                            <span className="gradient-text">Prep &amp; Test.</span>
                        </h1>
                        <p className="hero-subheadline-modern">
                            <strong>15,000+ past questions</strong> from JAMB, WAEC, NECO &amp; BECE with hints and explanations - free for every student. Plus a full CBT platform for schools to create, run, and grade exams in minutes.
                        </p>

                        {/* Exam board badges */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            {EXAM_BOARDS.map((board) => (
                                <span key={board.name} style={{
                                    fontSize: "12px", fontWeight: 700, color: board.color, background: board.bg,
                                    border: `1.5px solid ${board.color}20`, padding: "4px 14px", borderRadius: "999px",
                                    letterSpacing: "0.04em",
                                }}>
                                    {board.name}
                                </span>
                            ))}
                        </div>

                        {/* Dual CTAs */}
                        <div className="hero-cta-group">
                            <Link href="/general" className="cta-button cta-primary">
                                <div className="cta-text">
                                    <span className="cta-label">For students</span>
                                    <span className="cta-action">Start Practising Free</span>
                                </div>
                                <div className="cta-arrow"><ArrowRight /></div>
                            </Link>
                            <Link href="/dashboard/login" className="cta-button cta-secondary">
                                <div className="cta-text">
                                    <span className="cta-label">For schools</span>
                                    <span className="cta-action">Set Up Your School</span>
                                </div>
                                <div className="cta-arrow"><ArrowRight /></div>
                            </Link>
                        </div>

                        <div className="hero-social-proof">
                            <div className="avatar-stack-modern">
                                {["MO", "SA", "TA", "ED", "FH"].map((initials, i) => (
                                    <div key={i} className="avatar-modern" style={{ zIndex: 5 - i }}>{initials}</div>
                                ))}
                            </div>
                            <div className="proof-text">
                                <strong>500+ schools</strong> &amp; <strong>thousands of students</strong> trust Assessly
                            </div>
                        </div>
                    </div>

                    {/* Right: hero image */}
                    <div className="hero-split-right">
                        <div className="hero-image-wrapper">
                            <img
                                src="/hero.png"
                                alt="Assessly - CBT platform for students and schools"
                                style={{ width: "100%", height: "auto", borderRadius: "16px", display: "block", position: "relative", zIndex: 2 }}
                            />
                            {/* Floating boxes */}
                            <div className="hero-float-box hero-float-1">
                                <svg className="hero-float-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                <span className="hero-float-label">15K+ Questions</span>
                            </div>
                            <div className="hero-float-box hero-float-2">
                                <svg className="hero-float-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
                                <span className="hero-float-label">500+ Schools</span>
                            </div>
                            <div className="hero-float-box hero-float-3">
                                <svg className="hero-float-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                                <span className="hero-float-label">Instant Results</span>
                            </div>
                            <div className="hero-float-box hero-float-4">
                                <svg className="hero-float-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="hero-float-label">JAMB Ready</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Overlapping Modes Card */}
            <div className="hero-modes-card">
                <div className="hero-modes-badge">Modes</div>
                <div className="hero-modes-scroll">
                    {MODES_DATA.map((mode) => (
                        <div key={mode.id} className="hero-mode-item" style={{ borderColor: mode.borderColor, background: mode.iconBg }}>
                            <div className="hero-mode-icon" style={{ background: mode.iconBg, color: mode.iconColor }}>
                                {mode.icon}
                            </div>
                            <div className="hero-mode-text">
                                <span className="hero-mode-name" style={{ color: mode.iconColor }}>{mode.name}</span>
                                <span className="hero-mode-tagline">{mode.tagline}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust numbers strip */}
            <div className="hero-trust-strip">
                {[
                    { value: "15,000+", label: "Past Questions" },
                    { value: "500+", label: "Schools" },
                    { value: "85,000+", label: "Students" },
                    { value: "4", label: "Exam Boards" },
                ].map(({ value, label }) => (
                    <div key={label} className="hero-trust-item">
                        <span className="hero-trust-value">{value}</span>
                        <span className="hero-trust-label">{label}</span>
                    </div>
                ))}
            </div>
        </>
    );
}

// ── Student Features ──────────────────────────────────────────────────────────
function StudentFeaturesSection() {
    return (
        <section id="features" className="features-section">
            <div className="section-inner">
                <div className="section-tag">For Students</div>
                <h2 className="section-headline">Everything you need to ace your exams</h2>
                <p className="section-subtext">15,000+ questions across JAMB, WAEC, NECO, and BECE. Practice for free with hints, explanations, and instant feedback.</p>
                <div className="features-grid">
                    <FeatureCard accent="accent-green"
                        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="No Account Required"
                        description="Jump straight in. No signup, no login, no barriers. Just pick a mode and start answering questions instantly."
                    />
                    <FeatureCard accent="accent-blue"
                        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>}
                        title="Hints &amp; Explanations"
                        description="Stuck on a question? Request a hint. After answering, get a full explanation of why the correct answer is right."
                    />
                    <FeatureCard accent="accent-purple"
                        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                        title="15,000+ Past Questions"
                        description="Authentic questions from JAMB, WAEC, NECO, and BECE organised by year and subject. Practice the exact papers from any exam year."
                    />
                    <FeatureCard accent="accent-orange"
                        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
                        title="Survival Mode"
                        description="Think you know your stuff? One wrong answer ends your run. Beat your personal best and compete with others."
                    />
                    <FeatureCard accent="accent-blue"
                        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Timed Mock Exams"
                        description="Simulate the real exam environment with countdowns, question navigation, and automatic submission when time runs out."
                    />
                    <FeatureCard accent="accent-teal"
                        icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-6.75c0-.621.504-1.125 1.125-1.125h2.25C13.496 5.25 14 5.754 14 6.375v13.5c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 019.75 19.875V6.375zm6.75 3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V10.125z" /></svg>}
                        title="Instant Scoring"
                        description="See your score the moment you finish. Review every question, see what you got wrong, and understand exactly why."
                    />
                </div>
            </div>
        </section>
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
                name: "Assessly - Smart CBT Exams for Nigerian Schools",
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

            {/* ── Hero ── */}
            <HeroSectionUnified />

            {/* ── Student Features ── */}
            <StudentFeaturesSection />

            {/* ── Stats ── */}
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

            {/* ── School Features ── */}
            <section id="school-features" className="features-section">
                <div className="section-inner">
                    <div className="section-tag">For Schools</div>
                    <h2 className="section-headline">Everything your school needs</h2>
                    <p className="section-subtext">From exam creation to result analysis - Assessly handles it all in one place.</p>
                    <div className="features-grid">
                        <FeatureCard accent="accent-blue"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l1.286.6M14.25 3.104c.251.023.501.05.75.082M19.5 7.5l-1.607 7.929A2.25 2.25 0 0115.694 18H8.306a2.25 2.25 0 01-2.199-1.571L4.5 7.5" /></svg>}
                            title="AI Question Parser"
                            description="Upload any PDF question paper and our AI automatically extracts, classifies, and structures questions by difficulty - saving hours of manual work."
                        />
                        <FeatureCard accent="accent-purple"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            title="Timed CBT Exams"
                            description="Set custom durations with automatic submission when time runs out. Students get real-time warnings and can't skip ahead without reviewing every question."
                        />
                        <FeatureCard accent="accent-green"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
                            title="Multi-Tenant Schools"
                            description="Each school gets a unique code. Students log in with their school code ensuring complete data isolation - your exams are only visible to your students."
                        />
                        <FeatureCard accent="accent-orange"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-6.75c0-.621.504-1.125 1.125-1.125h2.25C13.496 5.25 14 5.754 14 6.375v13.5c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 019.75 19.875V6.375zm6.75 3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V10.125z" /></svg>}
                            title="Instant Results"
                            description="Exam results and scores are computed and displayed instantly - no manual grading. Track student performance with per-question analytics."
                        />
                        <FeatureCard accent="accent-blue"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
                            title="Secure &amp; Reliable"
                            description="Powered by Supabase with row-level security. Student sessions are auth-gated, exam attempts are logged, and all data is encrypted in transit and at rest."
                        />
                        <FeatureCard accent="accent-teal"
                            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>}
                            title="General Mode Exams"
                            description="Create public practice exams open to anyone - no school code needed. Perfect for mock tests, demos, or open assessments with instant score display."
                        />
                    </div>
                </div>
            </section>

            {/* ── How it Works ── */}
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
                            { n: "06", t: "Iterate & improve", d: "Reuse questions across exams, edit drafts, and track progress over time - all in one place." },
                        ].map(({ n, t, d }) => <StepCard key={n} number={n} title={t} description={d} />)}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section id="testimonials" className="testimonials-section">
                <div className="section-inner">
                    <div className="section-tag">Testimonials</div>
                    <h2 className="section-headline">Teachers love Assessly</h2>
                    <p className="section-subtext">Real feedback from educators using the platform every day.</p>
                    <div className="testimonials-grid">
                        <Testimonial
                            quote="Setting up our first CBT exam took less than 10 minutes. The AI parsed our question bank PDF perfectly - it was like magic."
                            name="Mrs. Adeyemi" role="Senior Teacher, Government Sec. School Lagos" initials="MA"
                        />
                        <Testimonial
                            quote="My students felt more confident knowing they could see their scores immediately. The timed interface is clean and stress-free."
                            name="Mr. Okonkwo" role="HOD Mathematics, Bright Future Academy" initials="BO"
                        />
                        <Testimonial
                            quote="The school code system is genius. Each of our campuses has its own code - students only ever see their own exams."
                            name="Dr. Fatima Hassan" role="Principal, Hillside Group of Schools" initials="FH"
                        />
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
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

            {/* ── CTA ── */}
            <section className="cta-section">
                <div className="cta-inner">
                    <h2 className="cta-headline">Ready to get started?</h2>
                    <p className="cta-subtext">Whether you&apos;re a student looking to practise or a school modernising exams - Assessly has you covered.</p>
                    <div className="cta-actions">
                        <Link href="/general" className="btn-primary cta-btn">
                            Start Practising Free <ArrowRight />
                        </Link>
                        <Link href="/dashboard/login" className="cta-btn-ghost">School Admin Login →</Link>
                    </div>
                </div>
                <div className="cta-glow" />
            </section>

            <Footer />
        </div>
    );
}
