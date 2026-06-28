"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Newspaper, BookOpen } from "lucide-react";

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

const ADMISSIONS_ITEMS: { href: string; label: string; icon: React.ReactNode; comingSoon: boolean }[] = [
    { href: "/admissions", label: "News", icon: <Newspaper size={16} />, comingSoon: false },
    { href: "#", label: "Question Bank", icon: <BookOpen size={16} />, comingSoon: true },
];

interface NavbarProps {
    audience?: "students" | "schools";
    onAudienceChange?: (a: "students" | "schools") => void;
}

export default function Navbar({ audience = "students", onAudienceChange }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [admissionsOpen, setAdmissionsOpen] = useState(false);
    const [mobileAdmissionsOpen, setMobileAdmissionsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setAdmissionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const isAdmissionsActive = pathname.startsWith("/admissions");

    const plainLinks = [
        { href: "/landing#students", label: "For Students" },
        { href: "/landing#schools", label: "For Schools" },
        { href: "/landing#pricing", label: "Pricing" },
    ];

    return (
        <nav className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}>

            <div className="nav-inner nav-row-1">
                <Link href="/" className="nav-logo">
                    <LogoIcon size={30} />
                    <span className="nav-logo-text">Assessly</span>
                </Link>

                {/* Desktop nav links */}
                <div className="nav-desktop-links">
                    <Link href="/#students">For Students</Link>
                    <Link href="/#schools">For Schools</Link>

                    {/* Admissions dropdown */}
                    <div
                        ref={dropdownRef}
                        className="relative"
                        onMouseEnter={() => setAdmissionsOpen(true)}
                        onMouseLeave={() => setAdmissionsOpen(false)}
                    >
                        <button
                            onClick={() => setAdmissionsOpen(v => !v)}
                            className="flex items-center gap-1 text-sm font-medium transition-colors"
                            style={{ color: isAdmissionsActive ? "#16a34a" : "var(--lp-ink-60)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                            Admissions
                            <svg
                                width="14" height="14" viewBox="0 0 14 14" fill="none"
                                style={{ transform: admissionsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                            >
                                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {admissionsOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-52 z-50">
                                <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                                    <div className="p-2">
                                        {ADMISSIONS_ITEMS.map((item) =>
                                            item.comingSoon ? (
                                                <div
                                                    key={item.label}
                                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl opacity-40 cursor-default"
                                                >
                                                    <span className="text-base">{item.icon}</span>
                                                    <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                                                    <span className="text-[11px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full ml-auto">Soon</span>
                                                </div>
                                            ) : (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => setAdmissionsOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
                                                >
                                                    <span className="text-base">{item.icon}</span>
                                                    <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                                                </Link>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href="/#pricing">Pricing</Link>
                </div>

                {/* Desktop CTA */}
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

            {/* Mobile menu */}
            <div className={`nav-links-row ${menuOpen ? "nav-links-row-open" : ""}`}>
                {plainLinks.map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>
                ))}

                {/* Mobile Admissions accordion */}
                <div className="w-full">
                    <button
                        onClick={() => setMobileAdmissionsOpen(v => !v)}
                        className="w-full flex items-center justify-between"
                        style={{ color: isAdmissionsActive ? "#16a34a" : "var(--lp-ink)", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontSize: "0.95rem", fontWeight: 500 }}
                    >
                        Admissions
                        <svg
                            width="14" height="14" viewBox="0 0 14 14" fill="none"
                            style={{ transform: mobileAdmissionsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
                        >
                            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {mobileAdmissionsOpen && (
                        <div className="mt-2 ml-3 flex flex-col gap-1 border-l-2 border-gray-100 pl-3">
                            {ADMISSIONS_ITEMS.map((item) =>
                                item.comingSoon ? (
                                    <div key={item.label} className="flex items-center gap-2 py-1.5 opacity-40 cursor-default">
                                        <span className="text-base">{item.icon}</span>
                                        <span className="text-sm font-medium text-gray-600">{item.label}</span>
                                        <span className="text-[11px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
                                    </div>
                                ) : (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => { setMenuOpen(false); setMobileAdmissionsOpen(false); }}
                                        className="flex items-center gap-2 py-1.5 text-sm font-medium"
                                        style={{ color: pathname === item.href ? "#16a34a" : "var(--lp-ink)" }}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="nav-links-row-cta">
                    <Link href="/login" className="nav-btn-ghost" onClick={() => setMenuOpen(false)}>Student Login</Link>
                    <Link href="/dashboard/login" className="nav-btn-solid" onClick={() => setMenuOpen(false)}>Admin Login</Link>
                </div>
            </div>

        </nav>
    );
}
