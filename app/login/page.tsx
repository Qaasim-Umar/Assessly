"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentLogin, getSession } from "@/lib/authService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "@/app/landing/landing.css";

export default function StudentLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Already logged in → go to correct portal
    useEffect(() => {
        getSession().then((session) => {
            if (session) {
                if (session.user.email?.endsWith("@assessly.admin")) {
                    router.replace("/dashboard");
                } else {
                    router.replace("/student");
                }
            }
        });
    }, [router]);

    const validate = () => {
        if (!username.trim() || username.trim().length < 3) return "Username must be at least 3 characters.";
        if (/\s/.test(username)) return "Username cannot contain spaces.";
        if (password.length < 6) return "Password must be at least 6 characters.";
        if (!schoolCode.trim()) return "School code is required.";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError("");
        setLoading(true);
        try {
            await studentLogin(username.trim(), password, schoolCode.trim().toUpperCase());
            router.push("/student");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const inputBase = "w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 placeholder-gray-400 text-gray-900";

    return (
        <div className="landing-root min-h-screen flex flex-col pt-[68px] bg-[#f0f2f5]">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-700 px-8 py-7 text-center">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h1 className="text-white text-xl font-bold tracking-tight">Assessly</h1>
                        <p className="text-blue-200 text-xs mt-1">Student Examination Portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
                        <div className="text-center mb-2">
                            <h2 className="text-base font-bold text-gray-900">Student Login</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Enter your details and your school code to access exams</p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                </span>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username" required className={inputBase} />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                </span>
                                <input type={showPassword ? "text" : "password"} value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password" required className={`${inputBase} pr-11`} />
                                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showPassword
                                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                                        }
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* School Code */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">School Code</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                </span>
                                <input
                                    type="text"
                                    value={schoolCode}
                                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. KF9X2P"
                                    required
                                    maxLength={8}
                                    className={`${inputBase} font-mono tracking-widest uppercase`}
                                />
                            </div>
                            <p className="text-[11px] text-gray-400">Ask your teacher for the school code.</p>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-lg transition-colors mt-2">
                            {loading
                                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Signing in…</>
                                : <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                                    Login
                                </>
                            }
                        </button>

                        <p className="text-center text-xs text-gray-400 pt-1">
                            Teacher?{" "}
                            <a href="/dashboard/login" className="text-gray-700 hover:underline font-semibold">Admin Dashboard →</a>
                        </p>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
