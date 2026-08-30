"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Check,
    Eye,
    EyeOff,
    GraduationCap,
    LoaderCircle,
    LockKeyhole,
    School,
    UserRound,
} from "lucide-react";
import {
    getStudentProfile,
    signInSchoolPupil,
    signInStudent,
    studentSignOut,
} from "@/lib/authService";
import { supabase } from "@/lib/supabase";
import LoginMaintenanceGate from "@/components/LoginMaintenanceGate";

const inputClass = "min-h-12 w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 sm:text-sm";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justCreated = searchParams.get("created") === "1";
    const requestedNext = searchParams.get("next");
    const nextPath = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/student";
    const [schoolCode, setSchoolCode] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [secret, setSecret] = useState("");
    const [showSecret, setShowSecret] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getStudentProfile()
            .then((profile) => {
                if (profile) router.replace("/student");
            })
            .catch(() => {
                // Keep the form available when an old session cannot be resolved.
            });
    }, [router]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const code = schoolCode.trim().toUpperCase();
        const cleanIdentifier = identifier.trim();

        if (!code) {
            setError("Enter the School Code given to you by your teacher.");
            return;
        }
        if (!/^[A-Z0-9]{6,12}$/.test(code)) {
            setError("Enter a valid School Code using 6 to 12 letters or numbers.");
            return;
        }
        if (!cleanIdentifier) {
            setError("Enter your Pupil ID, email, phone number, or username.");
            return;
        }
        if (!secret) {
            setError("Enter your PIN or password.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            // Existing Individual school codes contain 6 characters; new School
            // pupil codes contain 8. The School Code therefore selects the right
            // sign-in route without asking the student to choose an account type.
            const isIndividualCode = code.length === 6;

            if (isIndividualCode) {
                await signInStudent(cleanIdentifier, secret);

                const { data: adminRow } = await supabase
                    .from("admin_profiles")
                    .select("school_code")
                    .eq("school_code", code)
                    .maybeSingle();

                if (!adminRow) {
                    await studentSignOut();
                    throw new Error("Invalid school code. Ask your teacher.");
                }
            } else {
                await signInSchoolPupil(code, cleanIdentifier, secret);
            }

            localStorage.setItem("last_school_code", code);
            router.push(nextPath);
        } catch (caughtError: unknown) {
            setError(caughtError instanceof Error ? caughtError.message : "Could not sign in. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-8 sm:py-10">
            <div className="mb-3 flex w-full max-w-4xl">
                <Link href="/" className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600">
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                    Back to home
                </Link>
            </div>

            <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl shadow-green-900/15 ring-1 ring-black/5">
                <div className="relative hidden min-h-[610px] overflow-hidden bg-green-800 lg:flex lg:w-[45%] lg:flex-col lg:items-center lg:justify-center">
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        <path d="M-60,180 C20,80 160,20 280,60 C400,100 480,220 460,360 C440,500 320,580 200,560 C80,540 -140,440 -60,180Z" fill="rgba(255,255,255,0.07)" />
                        <path d="M200,500 C320,460 480,520 520,640 C560,760 440,820 300,800 C160,780 60,700 80,600 C100,500 80,540 200,500Z" fill="rgba(255,255,255,0.05)" />
                        <path d="M340,20 C440,-20 560,60 580,180 C600,300 520,380 420,360 C320,340 260,240 300,140 C320,80 240,60 340,20Z" fill="rgba(255,255,255,0.06)" />
                    </svg>

                    <div className="relative z-10 flex flex-col items-center px-12 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-xl">
                            <GraduationCap size={32} className="text-white" aria-hidden="true" />
                        </div>
                        <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Assessly</span>
                        <h2 className="mb-3 text-3xl font-bold leading-tight text-white">One form for every student</h2>
                        <p className="max-w-[270px] text-sm leading-relaxed text-green-100/80">
                            Enter the details your school gave you. Assessly will securely recognize the correct student account.
                        </p>
                        <div className="mt-10 flex w-full max-w-[270px] flex-col gap-3">
                            {["School pupils and Individual students", "No account-type switch required", "Secure School Code access"].map((text) => (
                                <div key={text} className="flex items-center gap-2.5 text-left">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-green-300/40 bg-green-400/25">
                                        <Check size={11} className="text-green-200" strokeWidth={3} aria-hidden="true" />
                                    </span>
                                    <span className="text-sm text-green-50/85">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-black/20 px-8 py-4 text-center text-xs font-semibold tracking-wide text-green-100/80">
                        School Code · Student details · PIN or password
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center bg-white px-5 py-8 sm:px-8 sm:py-10">
                    <div className="w-full max-w-[380px]">
                        <div className="mb-7 flex items-center gap-2 lg:hidden">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700">
                                <GraduationCap size={19} className="text-white" aria-hidden="true" />
                            </span>
                            <span className="text-sm font-bold text-gray-900">Assessly</span>
                        </div>

                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-950">Take your CBT</h1>
                            <p className="mt-1.5 text-sm leading-5 text-gray-500">
                                Enter your school details below. We’ll recognize your account automatically.
                            </p>
                        </div>

                        {justCreated && (
                            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800" role="status">
                                <Check size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                                <span>Account created — sign in to get started.</span>
                            </div>
                        )}

                        {error && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div className="space-y-1.5">
                                <label htmlFor="school-code" className="block text-xs font-bold text-gray-700">School Code</label>
                                <div className="relative">
                                    <School size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="school-code"
                                        type="text"
                                        value={schoolCode}
                                        onChange={(event) => setSchoolCode(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 12))}
                                        placeholder="e.g. KF9X2P"
                                        required
                                        minLength={6}
                                        maxLength={12}
                                        autoCapitalize="characters"
                                        autoComplete="organization"
                                        spellCheck={false}
                                        className={`${inputClass} font-mono tracking-[0.15em] uppercase`}
                                    />
                                </div>
                                <p className="text-[11px] leading-4 text-gray-500">Ask your teacher if you do not have this code.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="student-identifier" className="block text-xs font-bold text-gray-700">Pupil ID, email, phone number, or username</label>
                                <div className="relative">
                                    <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="student-identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={(event) => setIdentifier(event.target.value.slice(0, 80))}
                                        placeholder="Pupil ID, email, or legacy username"
                                        required
                                        maxLength={80}
                                        autoCapitalize="none"
                                        autoComplete="username"
                                        spellCheck={false}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="student-secret" className="block text-xs font-bold text-gray-700">PIN or password</label>
                                <div className="relative">
                                    <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="student-secret"
                                        type={showSecret ? "text" : "password"}
                                        value={secret}
                                        onChange={(event) => setSecret(event.target.value)}
                                        placeholder="Enter your PIN or password"
                                        required
                                        autoComplete="current-password"
                                        className={`${inputClass} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret((current) => !current)}
                                        className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600"
                                        aria-label={showSecret ? "Hide PIN or password" : "Show PIN or password"}
                                    >
                                        {showSecret ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                                    </button>
                                </div>
                                <p className="text-[11px] leading-4 text-gray-500">School pupils use the six-digit PIN given by their teacher.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-5 text-sm font-bold text-white shadow-md shadow-green-600/20 transition-colors hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                            >
                                {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
                                {loading ? "Signing in…" : "Sign in to take CBT"}
                            </button>
                        </form>

                        <p className="mt-5 text-center text-xs leading-5 text-gray-500">
                            Missing your school details? Ask your teacher. New Individual student?{" "}
                            <Link href="/student/signup" className="font-semibold text-green-700 hover:underline">Create an account</Link>
                        </p>
                        <p className="mt-2 text-center text-xs text-gray-500">
                            Teacher or administrator?{" "}
                            <Link href="/dashboard/login" className="font-semibold text-green-700 hover:underline">Open Admin Dashboard</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StudentLoginPage() {
    return (
        <Suspense>
            <LoginMaintenanceGate portalLabel="Student sign-in">
                <LoginForm />
            </LoginMaintenanceGate>
        </Suspense>
    );
}
