"use client";

import Link from "next/link";
import { ArrowLeft, ChefHat, Clock3, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

// Shared deadline for every login route. A deployment environment value can
// override this without requiring another code change.
const DEFAULT_MAINTENANCE_END_AT = "2026-08-27T15:53:36.000Z";
const MAINTENANCE_END_AT =
    process.env.NEXT_PUBLIC_MAINTENANCE_END_AT ?? DEFAULT_MAINTENANCE_END_AT;

type RemainingTime = {
    total: number;
    hours: number;
    minutes: number;
    seconds: number;
};

type LoginMaintenanceGateProps = {
    children: ReactNode;
    portalLabel: string;
};

function getRemainingTime(deadline: number): RemainingTime {
    const total = Math.max(0, deadline - Date.now());

    return {
        total,
        hours: Math.floor(total / 3_600_000),
        minutes: Math.floor((total % 3_600_000) / 60_000),
        seconds: Math.floor((total % 60_000) / 1_000),
    };
}

function formatUnit(value: number | undefined) {
    return value === undefined ? "--" : String(value).padStart(2, "0");
}

export default function LoginMaintenanceGate({
    children,
    portalLabel,
}: LoginMaintenanceGateProps) {
    const [remaining, setRemaining] = useState<RemainingTime | null>(null);
    const [expectedBack, setExpectedBack] = useState("");

    useEffect(() => {
        const deadline = Date.parse(MAINTENANCE_END_AT);

        if (Number.isNaN(deadline)) {
            return;
        }

        const updateCountdown = () => setRemaining(getRemainingTime(deadline));
        const initializeCountdown = () => {
            setExpectedBack(
                new Intl.DateTimeFormat(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                }).format(new Date(deadline)),
            );
            updateCountdown();
        };

        const initialTimer = window.setTimeout(initializeCountdown, 0);
        const timer = window.setInterval(updateCountdown, 1_000);
        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(timer);
        };
    }, []);

    if (Number.isNaN(Date.parse(MAINTENANCE_END_AT)) || remaining?.total === 0) {
        return <>{children}</>;
    }

    const units = [
        { label: "Hours", value: remaining?.hours },
        { label: "Minutes", value: remaining?.minutes },
        { label: "Seconds", value: remaining?.seconds },
    ];

    return (
        <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-white px-4 py-8 text-white sm:px-6">
            <div
                aria-hidden="true"
                className="absolute -left-28 top-[-7rem] h-72 w-72 rounded-full bg-emerald-300/35 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-green-300/30 blur-3xl"
            />

            <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-green-700/20 bg-gradient-to-br from-green-700/90 via-emerald-800/90 to-green-900/95 p-5 shadow-2xl shadow-green-950/20 backdrop-blur-2xl sm:p-8">
                <div
                    aria-hidden="true"
                    className="absolute right-5 top-5 text-emerald-200/40"
                >
                    <Sparkles className="h-6 w-6" />
                </div>

                <div className="mb-8 flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Home
                    </Link>
                    <span className="pr-8 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/75">
                        Assessly
                    </span>
                </div>

                <div className="mx-auto flex max-w-md flex-col items-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/15 shadow-lg shadow-black/10">
                        <ChefHat className="h-8 w-8 text-emerald-100" aria-hidden="true" />
                    </div>

                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        24-hour update window
                    </div>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/70">
                        {portalLabel}
                    </p>
                    <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                        We&apos;re cooking up an update.
                    </h1>
                    <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-emerald-50/75 sm:text-base">
                        Sign-in is taking a short break while we put the finishing touches on
                        Assessly. Please visit back later&mdash;we&apos;ll be ready soon.
                    </p>

                    <div
                        role="timer"
                        aria-label="Time remaining until sign-in returns"
                        className="mt-8 grid w-full grid-cols-3 gap-2 sm:gap-3"
                    >
                        {units.map(({ label, value }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-white/15 bg-black/15 px-2 py-4 sm:px-4 sm:py-5"
                            >
                                <div className="font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                                    {formatUnit(value)}
                                </div>
                                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100/60 sm:text-xs">
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-5 min-h-5 text-xs text-emerald-100/65">
                        {expectedBack ? (
                            <>
                                Expected back by{" "}
                                <time dateTime={MAINTENANCE_END_AT} className="font-semibold text-emerald-50">
                                    {expectedBack}
                                </time>
                            </>
                        ) : (
                            "Calculating return time..."
                        )}
                    </p>
                </div>
            </section>
        </main>
    );
}
