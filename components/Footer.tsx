"use client";

import Link from "next/link";
import { LogoIcon } from "./Navbar";

export default function Footer() {
    return (
        <footer className="landing-footer mt-auto">
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="footer-logo"><LogoIcon size={26} /><span className="footer-logo-text">Assessly</span></div>
                    <p className="footer-tagline">AI-powered Computer-Based Testing for modern Nigerian schools.</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <div className="footer-col-title">Product</div>
                        <Link href="/landing#features">Features</Link>
                        <Link href="/landing#how-it-works">How it works</Link>
                        <Link href="/landing#pricing">Pricing</Link>
                    </div>
                    <div className="footer-col">
                        <div className="footer-col-title">Access</div>
                        <Link href="/dashboard/login">Admin Login</Link>
                        <Link href="/login">Student Login</Link>
                        <Link href="/general">Free Practice Exams</Link>
                    </div>
                    <div className="footer-col">
                        <div className="footer-col-title">Company</div>
                        <a href="mailto:hello@assessly.app">Contact</a>
                        <Link href="#">Privacy Policy</Link>
                        <Link href="#">Terms of Service</Link>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© {new Date().getFullYear()} Assessly. All rights reserved.</span>
                <span>Built for Nigerian educators 🇳🇬</span>
            </div>
        </footer>
    );
}
