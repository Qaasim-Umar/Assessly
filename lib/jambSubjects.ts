export const JAMB_ENGLISH_SUBJECT = "Use of English";

export function normalizeSubjectName(subject: string): string {
    return subject.trim().replace(/\s+/g, " ");
}

export function isEnglishSubject(subject: string): boolean {
    return /\benglish\b/i.test(normalizeSubjectName(subject));
}

export function getSelectableJambSubjects(subjects: string[]): string[] {
    const uniqueSubjects = new Map<string, string>();

    for (const rawSubject of subjects) {
        const subject = normalizeSubjectName(rawSubject);
        if (!subject || isEnglishSubject(subject)) continue;

        const key = subject.toLocaleLowerCase();
        if (!uniqueSubjects.has(key)) uniqueSubjects.set(key, subject);
    }

    return Array.from(uniqueSubjects.values()).sort((a, b) => a.localeCompare(b));
}
