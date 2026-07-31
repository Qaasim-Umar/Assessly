import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#0d1a0f] px-6 pt-16 pb-8">
            <div className="mx-auto max-w-[1100px]">
                <div className="mb-14 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                    <div>
                        <Link href="/" className="mb-3.5 block text-[22px] font-extrabold text-green-600">Assessly</Link>
                        <p className="max-w-[260px] text-sm leading-[1.65] text-white/40">Computer-Based Testing for Nigerian students and schools. Built for the way Nigerians learn.</p>
                    </div>
                    <div>
                        <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/30">Product</div>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link href="/#students" className="text-sm text-white/55 transition-colors hover:text-white">For Students</Link></li>
                            <li><Link href="/#schools" className="text-sm text-white/55 transition-colors hover:text-white">For Schools</Link></li>
                            <li><Link href="/#how" className="text-sm text-white/55 transition-colors hover:text-white">How it Works</Link></li>
                            <li><Link href="/#pricing" className="text-sm text-white/55 transition-colors hover:text-white">Pricing</Link></li>
                        </ul>
                    </div>
                    <div>
                        <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/30">Practice</div>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link href="/jamb-practice" className="text-sm text-white/55 transition-colors hover:text-white">JAMB Practice</Link></li>
                            <li><Link href="/waec-practice" className="text-sm text-white/55 transition-colors hover:text-white">WAEC Practice</Link></li>
                            <li><Link href="/post-utme-practice" className="text-sm text-white/55 transition-colors hover:text-white">Post-UTME Practice</Link></li>
                        </ul>
                    </div>
                    <div>
                        <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/30">Access</div>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link href="/general" className="text-sm text-white/55 transition-colors hover:text-white">Student Practice</Link></li>
                            <li><Link href="/admissions" className="text-sm text-white/55 transition-colors hover:text-white">Admissions Hub</Link></li>
                            <li><Link href="/login" className="text-sm text-white/55 transition-colors hover:text-white">Student Login</Link></li>
                            <li><Link href="/dashboard/login" className="text-sm text-white/55 transition-colors hover:text-white">Admin Login</Link></li>
                        </ul>
                    </div>
                    <div>
                        <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/30">Company</div>
                        <ul className="flex flex-col gap-2.5">
                            <li><Link href="/about" className="text-sm text-white/55 transition-colors hover:text-white">About Us</Link></li>
                            <li><Link href="/contact" className="text-sm text-white/55 transition-colors hover:text-white">Contact</Link></li>
                            <li><Link href="/privacy" className="text-sm text-white/55 transition-colors hover:text-white">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-white/55 transition-colors hover:text-white">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-6 max-sm:flex-col max-sm:gap-1.5">
                    <p className="text-[13px] text-white/30">© {new Date().getFullYear()} Assessly. All rights reserved.</p>
                    <p className="text-[13px] text-white/30">Built for Nigerian students and educators</p>
                </div>
            </div>
        </footer>
    );
}
