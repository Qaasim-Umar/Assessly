"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInGeneralAdmin, getGeneralAdminSession } from "@/lib/generalAdminAuth";

export default function GeneralDashboardLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Already logged in?
    useEffect(() => {
        getGeneralAdminSession().then((session) => {
            if (session) router.replace("/general/dashboard");
        });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signInGeneralAdmin(username, password);
            router.push("/general/dashboard");
        } catch {
            setError("Invalid username or password.");
            setLoading(false);
        }
    };

    const inputCls =
        "w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white placeholder:text-gray-400 text-gray-900 transition-all";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-10">
            <div className="w-full max-w-4xl mb-3 flex">
                <a href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors group">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back to home
                </a>
            </div>
            <div className="w-full max-w-4xl flex rounded-3xl shadow-2xl shadow-green-900/15 overflow-hidden ring-1 ring-black/5">
            {/* ── Left blob panel ──────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[45%] bg-green-800 relative overflow-hidden flex-col items-center justify-center min-h-[560px]">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-60,180 C20,80 160,20 280,60 C400,100 480,220 460,360 C440,500 320,580 200,560 C80,540 -140,440 -60,180Z" fill="rgba(255,255,255,0.07)" />
                    <path d="M200,500 C320,460 480,520 520,640 C560,760 440,820 300,800 C160,780 60,700 80,600 C100,500 80,540 200,500Z" fill="rgba(255,255,255,0.05)" />
                    <path d="M340,20 C440,-20 560,60 580,180 C600,300 520,380 420,360 C320,340 260,240 300,140 C320,80 240,60 340,20Z" fill="rgba(255,255,255,0.06)" />
                </svg>

                <div className="relative z-10 flex flex-col items-center text-center px-12">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-5 shadow-xl">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                        </svg>
                    </div>
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Assessly</span>
                    <h2 className="text-3xl font-bold text-white leading-tight mb-3">Welcome Back!</h2>
                    <p className="text-green-200/70 text-sm leading-relaxed max-w-[260px]">
                        Create and manage public practice exams with no student login required.
                    </p>

                    <div className="mt-10 flex flex-col gap-3 w-full max-w-[260px]">
                        {["Public exams open to anyone", "No student account required", "WAEC, JAMB & NECO practice"].map((text) => (
                            <div key={text} className="flex items-center gap-2.5">
                                <div className="w-4 h-4 rounded-full bg-green-400/25 border border-green-300/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2 h-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-sm text-green-100/80 text-left">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-black/20 px-8 py-4">
                    <p className="text-center text-xs text-green-200/60 leading-relaxed">A free, open platform for Nigerian students to practise exam questions with no school code needed.</p>
                </div>
            </div>

            {/* ── Right form panel ─────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center bg-white px-8 py-10">
                <div className="w-full max-w-[360px]">
                    {/* Mobile-only brand */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" /></svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900">Assessly</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">General Admin</h1>
                        <p className="text-sm text-gray-400 mt-1.5">Manage open practice exams</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-xs px-4 py-3 rounded-xl mb-5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-500">Username</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </span>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username" required className={inputCls} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-500">Password</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </span>
                                <input type={showPassword ? "text" : "password"} value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password" required className={`${inputCls} pr-11`} />
                                <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showPassword
                                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                                        }
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl shadow-md shadow-green-600/20 transition-all mt-2">
                            {loading
                                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Signing in…</>
                                : "Login to Dashboard"
                            }
                        </button>
                    </form>
                </div>
            </div>
            </div>
        </div>
    );
}
