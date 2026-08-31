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
import StudentForgotPasswordModal from "@/components/StudentForgotPasswordModal";

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
    const [showForgotPassword, setShowForgotPassword] = useState(false);

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

        if (!cleanIdentifier) {
            setError("Enter your Pupil ID, email, phone number, or username.");
            return;
        }
        if (!secret) {
            setError("Enter your PIN or password.");
            return;
        }
        if (!code) {
            setError("Enter the School Code given to you by your teacher.");
            return;
        }
        if (!/^[A-Z0-9]{6,12}$/.test(code)) {
            setError("Enter a valid School Code using 6 to 12 letters or numbers.");
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
            {showForgotPassword && (
                <StudentForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
            )}

            <div className="mb-3 flex w-full max-w-3xl">
                <Link href="/" className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600">
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                    Back to home
                </Link>
            </div>

            <div className="flex w-full max-w-3xl overflow-hidden rounded-3xl shadow-xl shadow-green-900/10 ring-1 ring-black/5">
                <div className="relative hidden min-h-[540px] overflow-hidden bg-green-800 lg:flex lg:w-[38%] lg:items-center lg:justify-center">
                    <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5" aria-hidden="true" />
                    <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-white/5" aria-hidden="true" />
                    <div className="relative z-10 px-8 text-center">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                            <GraduationCap size={28} className="text-white" aria-hidden="true" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-green-100/70">Assessly</p>
                        <h2 className="mt-3 text-2xl font-bold text-white">Welcome back</h2>
                        <p className="mt-3 text-sm leading-6 text-green-100/80">
                            Use the login details given to you by your school.
                        </p>
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
                            <h1 className="text-2xl font-bold text-gray-950">Student sign in</h1>
                            <p className="mt-1.5 text-sm leading-5 text-gray-500">
                                Enter your details to continue.
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
                                <label htmlFor="student-identifier" className="block text-xs font-bold text-gray-700">Pupil ID, email, phone or username</label>
                                <div className="relative">
                                    <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="student-identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={(event) => setIdentifier(event.target.value.slice(0, 80))}
                                        placeholder="Enter your pupil ID or email"
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
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="inline-flex min-h-11 items-center rounded-lg px-1 text-xs font-semibold text-green-700 transition-colors hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="school-code" className="block text-xs font-bold text-gray-700">School Code</label>
                                <div className="relative">
                                    <School size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <input
                                        id="school-code"
                                        type="text"
                                        value={schoolCode}
                                        onChange={(event) => setSchoolCode(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 12))}
                                        placeholder="Enter your school code"
                                        required
                                        minLength={6}
                                        maxLength={12}
                                        autoCapitalize="characters"
                                        autoComplete="organization"
                                        aria-describedby="school-code-help"
                                        spellCheck={false}
                                        className={`${inputClass} font-mono tracking-[0.15em] uppercase`}
                                    />
                                </div>
                                <p id="school-code-help" className="text-[11px] leading-4 text-gray-500">Use the code given to you by your teacher.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-5 text-sm font-bold text-white shadow-md shadow-green-600/20 transition-colors hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                            >
                                {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
                                {loading ? "Signing in…" : "Continue"}
                            </button>
                        </form>

                        <p className="mt-5 text-center text-xs leading-5 text-gray-500">
                            New student?{" "}
                            <Link href="/student/signup" className="font-semibold text-green-700 hover:underline">Create an account</Link>
                        </p>
                        <p className="mt-2 text-center text-xs text-gray-500">
                            <Link href="/dashboard/login" className="font-semibold text-green-700 hover:underline">Teacher or admin sign in</Link>
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
            <LoginForm />
        </Suspense>
    );
}
