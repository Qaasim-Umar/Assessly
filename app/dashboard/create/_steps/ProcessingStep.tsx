"use client";

import { useEffect, useState } from "react";

interface Props {
    subject: string;
    questionCount: number;
    onComplete: () => void;
}

const STEPS = [
    { label: "Extracting text from PDF", detail: "Reading document structure and raw content..." },
    { label: "Detecting question structure", detail: "Identifying question numbers, answers and headings..." },
    { label: "Classifying difficulty levels", detail: "Applying AI semantic analysis to each question..." },
    { label: "Applying rule-based validation", detail: "Validating command words, length, and option similarity..." },
    { label: "Preparing review interface", detail: "Structuring questions for your approval..." },
];

export default function ProcessingStep({ subject, questionCount, onComplete }: Props) {
    const [current, setCurrent] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (current < STEPS.length) {
            const t = setTimeout(() => setCurrent((c) => c + 1), 900);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => { setDone(true); }, 400);
            return () => clearTimeout(t);
        }
    }, [current]);

    useEffect(() => {
        if (done) {
            const t = setTimeout(onComplete, 600);
            return () => clearTimeout(t);
        }
    }, [done, onComplete]);

    return (
        <div className="flex flex-col items-center justify-center py-10 px-6">
            {/* AI Brain Icon */}
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6 relative">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                    />
                </svg>
                {!done && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                )}
            </div>

            <h2 className="text-base font-bold text-gray-900 mb-1">AI Processing PDF</h2>
            <p className="text-xs text-gray-500 mb-8 text-center">
                Analysing <strong>{subject}</strong> paper — generating {questionCount} questions
            </p>

            {/* Steps */}
            <div className="w-full max-w-sm space-y-3">
                {STEPS.map((step, i) => {
                    const isComplete = i < current;
                    const isActive = i === current;
                    const isPending = i > current;
                    return (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isComplete ? "bg-green-50 border-green-200" : isActive ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"
                            }`}>
                            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${isComplete ? "bg-green-500" : isActive ? "bg-blue-600" : "bg-gray-200"
                                }`}>
                                {isComplete ? (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : isActive ? (
                                    <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${isComplete ? "text-green-700" : isActive ? "text-blue-700" : "text-gray-400"}`}>{step.label}</p>
                                {isActive && <p className="text-[10px] text-blue-500 mt-0.5">{step.detail}</p>}
                                {isComplete && <p className="text-[10px] text-green-500 mt-0.5">Completed</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {done && (
                <div className="mt-6 flex items-center gap-2 text-sm text-green-700 font-semibold bg-green-50 border border-green-200 px-4 py-2.5 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Processing complete — loading review...
                </div>
            )}
        </div>
    );
}
