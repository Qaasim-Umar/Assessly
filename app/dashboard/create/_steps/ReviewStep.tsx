"use client";

import { useState } from "react";
import type { Question, Difficulty } from "../types";

interface Props {
    questions: Question[];
    onChange: (questions: Question[]) => void;
    onApproveAll: () => void;
    onNext: () => void;
}

const difficultyColors: Record<Difficulty, string> = {
    Simple: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Medium: "bg-amber-100 text-amber-700 border-amber-300",
    Hard: "bg-red-100 text-red-700 border-red-300",
};

export default function ReviewStep({ questions, onChange, onApproveAll, onNext }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");

    const approvedCount = questions.filter((q) => q.approved).length;

    const setDifficulty = (id: number, diff: Difficulty) => {
        onChange(questions.map((q) => (q.id === id ? { ...q, userDifficulty: diff } : q)));
    };

    const toggleApprove = (id: number) => {
        onChange(questions.map((q) => (q.id === id ? { ...q, approved: !q.approved } : q)));
    };

    const deleteQuestion = (id: number) => {
        onChange(questions.filter((q) => q.id !== id));
    };

    const startEdit = (q: Question) => {
        setEditingId(q.id);
        setEditText(q.text);
    };

    const saveEdit = () => {
        if (editingId === null) return;
        onChange(questions.map((q) => (q.id === editingId ? { ...q, text: editText } : q)));
        setEditingId(null);
    };

    return (
        <div className="space-y-4">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div>
                    <p className="text-sm font-bold text-blue-800">{questions.length} questions detected by AI</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                        {approvedCount} approved &bull; Review each question and confirm its difficulty before proceeding.
                    </p>
                </div>
                <button
                    onClick={onApproveAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approve All
                </button>
            </div>

            {/* Edit modal */}
            {editingId !== null && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Edit Question</h3>
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={4}
                            className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2 justify-end mt-3">
                            <button onClick={() => setEditingId(null)} className="text-xs font-semibold text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={saveEdit} className="text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-10">#</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Question</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-20">Type</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24">Topic</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24">AI Rating</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-32">Difficulty</th>
                                <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24">Approved</th>
                                <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {questions.map((q) => (
                                <tr key={q.id} className={`transition-colors ${q.approved ? "bg-green-50/40" : "hover:bg-gray-50"}`}>
                                    <td className="px-3 py-3 font-bold text-gray-400">Q{q.id}</td>
                                    <td className="px-3 py-3 max-w-[200px]">
                                        <p className="text-gray-800 font-medium leading-snug line-clamp-2">{q.text}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">{q.commandWord}</p>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${q.type === "MCQ" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                                            {q.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-gray-500 text-[11px]">{q.topic}</td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${difficultyColors[q.aiDifficulty]}`}>
                                            {q.aiDifficulty}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <select
                                            value={q.userDifficulty}
                                            onChange={(e) => setDifficulty(q.id, e.target.value as Difficulty)}
                                            className="text-[11px] font-semibold border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                                        >
                                            <option value="Simple">Simple</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <button
                                            onClick={() => toggleApprove(q.id)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-colors ${q.approved ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
                                                }`}
                                        >
                                            {q.approved && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => startEdit(q)} title="Edit" className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => deleteQuestion(q.id)} title="Delete" className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Proceed */}
            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    disabled={approvedCount === 0}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
                >
                    Proceed to Finalize
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
