"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
export function LogoIcon({ size = 32 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2563EB" />
            <path d="M16 6.5L7 10.5V16C7 20.694 10.896 25.122 16 26.5C21.104 25.122 25 20.694 25 16V10.5L16 6.5Z"
                fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M11 16L14.5 19.5L21 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    return (
        <nav className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}>
            <div className="nav-inner">
                <Link href="/landing" className="nav-logo">
                    <LogoIcon size={30} />
                    <span className="nav-logo-text">Assessly</span>
                </Link>
                <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
                    <Link href="/landing#features" onClick={() => setMenuOpen(false)}>Features</Link>
                    <Link href="/landing#practice" onClick={() => setMenuOpen(false)}>Practice Exams</Link>
                    <Link href="/landing#how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
                    <Link href="/landing#pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
                </div>
                <div className="nav-cta">
                    <Link href="/login" className="nav-btn-ghost">Student Login</Link>
                    <Link href="/dashboard/login" className="nav-btn-solid">Admin Login</Link>
                </div>
                <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
                    <span className={menuOpen ? "bar bar-1-open" : "bar"} />
                    <span className={menuOpen ? "bar bar-2-open" : "bar"} />
                    <span className={menuOpen ? "bar bar-3-open" : "bar"} />
                </button>
            </div>
        </nav>
    );
}
