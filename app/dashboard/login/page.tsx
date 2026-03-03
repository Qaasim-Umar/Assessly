"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUpAdmin, signInAdmin, getAdminProfile } from "@/lib/authService";

type Tab = "login" | "signup";

export default function AdminLoginPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // Already logged in as admin → go straight to dashboard
    useEffect(() => {
        getAdminProfile().then((p) => { if (p) router.replace("/dashboard"); });
    }, [router]);

    const reset = () => { setUsername(""); setPassword(""); setConfirmPassword(""); setError(""); setSuccess(""); };
    const switchTab = (t: Tab) => { setTab(t); reset(); };

    const validate = () => {
        if (!username.trim() || username.trim().length < 3) return "Username must be at least 3 characters.";
        if (/\s/.test(username)) return "Username cannot contain spaces.";
        if (password.length < 6) return "Password must be at least 6 characters.";
        if (tab === "signup" && password !== confirmPassword) return "Passwords do not match.";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError(""); setSuccess(""); setLoading(true);
        try {
            if (tab === "signup") {
                await signUpAdmin(username.trim(), password);
                setSuccess("Account created! Your school code will appear on the dashboard.");
                router.push("/dashboard");
            } else {
                await signInAdmin(username.trim(), password);
                router.push("/dashboard");
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-gray-50 placeholder-gray-400 text-gray-900";

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 px-8 py-7 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h1 className="text-white text-xl font-bold tracking-tight">Assessly</h1>
                    <p className="text-gray-400 text-xs mt-1">Teacher / Admin Portal</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    {(["login", "signup"] as Tab[]).map((t) => (
                        <button key={t} type="button" onClick={() => switchTab(t)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${tab === t ? "text-gray-900 border-b-2 border-gray-900 bg-gray-50" : "text-gray-400 hover:text-gray-600"}`}>
                            {t === "login" ? "Login" : "Create Account"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
                    <div className="text-center mb-2">
                        <h2 className="text-base font-bold text-gray-900">{tab === "login" ? "Admin Login" : "Create Admin Account"}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{tab === "login" ? "Sign in to manage exams" : "A unique school code will be generated for you"}</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2.5 rounded-lg">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                            {success}
                        </div>
                    )}

                    {/* Username */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                            </span>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Admin username" required className={inputCls} />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                            </span>
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" required
                                className={`${inputCls} ${tab === "signup" ? "" : "pr-11"}`} />
                            {tab === "login" && (
                                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showPassword
                                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                                        }
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {tab === "signup" && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Confirm Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                </span>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className={inputCls} />
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-lg transition-colors mt-2">
                        {loading
                            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {tab === "login" ? "Signing in…" : "Creating account…"}</>
                            : tab === "login" ? "Login to Dashboard" : "Create Admin Account"
                        }
                    </button>

                    <p className="text-center text-xs text-gray-400 pt-1">
                        Student?{" "}
                        <a href="/login" className="text-blue-600 hover:underline font-semibold">Go to Student Portal →</a>
                    </p>
                </form>
            </div>
            <p className="text-xs text-gray-400 mt-6 text-center">Assessly CBT System &copy; {new Date().getFullYear()}</p>
        </div>
    );
}
