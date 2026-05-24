"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
export function LogoIcon({ size = 32 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#16a34a" />
            <path d="M16 6.5L7 10.5V16C7 20.694 10.896 25.122 16 26.5C21.104 25.122 25 20.694 25 16V10.5L16 6.5Z"
                fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M11 16L14.5 19.5L21 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

interface NavbarProps {
    audience?: "students" | "schools";
    onAudienceChange?: (a: "students" | "schools") => void;
}

export default function Navbar({ audience = "students", onAudienceChange }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    const navLinks = [
        { href: "/landing#features", label: "Features" },
        { href: "/landing#how-it-works", label: "How it works" },
        { href: "/landing#pricing", label: "Pricing" },
    ];

    return (
        <nav className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}>

            <div className="nav-inner nav-row-1">
                <Link href="/landing" className="nav-logo">
                    <LogoIcon size={30} />
                    <span className="nav-logo-text">Assessly</span>
                </Link>

                {/* Desktop nav links */}
                <div className="nav-desktop-links">
                    {navLinks.map(({ href, label }) => (
                        <Link key={href} href={href}>{label}</Link>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="nav-cta">
                    <Link href="/dashboard/login" className="nav-btn-ghost">Admin Login</Link>
                    <Link href="/login" className="nav-btn-solid">Student Login</Link>
                </div>

                <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
                    <span className={menuOpen ? "bar bar-1-open" : "bar"} />
                    <span className={menuOpen ? "bar bar-2-open" : "bar"} />
                    <span className={menuOpen ? "bar bar-3-open" : "bar"} />
                </button>
            </div>

            {/* Mobile dropdown */}
            <div className={`nav-links-row ${menuOpen ? "nav-links-row-open" : ""}`}>
                {navLinks.map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>
                ))}
                <div className="nav-links-row-cta">
                    <Link href="/dashboard/login" className="nav-btn-ghost" onClick={() => setMenuOpen(false)}>Admin Login</Link>
                    <Link href="/login" className="nav-btn-solid" onClick={() => setMenuOpen(false)}>Student Login</Link>
                </div>
            </div>

        </nav>
    );
}
