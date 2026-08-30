"use client";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  updateSchoolProfile,
  type School,
  type SchoolProfileInput,
} from "@/lib/schoolService";

const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-wait disabled:bg-slate-100 sm:text-sm";

const schoolTypeOptions: Array<{ value: School["school_type"]; label: string }> = [
  { value: "primary", label: "Primary school" },
  { value: "secondary", label: "Secondary school" },
  { value: "combined", label: "Primary and secondary school" },
  { value: "tertiary", label: "Tertiary institution" },
  { value: "academy", label: "Academy or training centre" },
  { value: "other", label: "Other" },
];

function isGeneratedName(name: string, adminName: string): boolean {
  return name.trim().toLowerCase() === `${adminName.trim()}'s school`.toLowerCase();
}

export default function SchoolOnboarding({
  school,
  adminName,
  onBack,
  onCompleted,
}: {
  school: School;
  adminName: string;
  onBack: () => void;
  onCompleted: (school: School) => void;
}) {
  const [form, setForm] = useState<SchoolProfileInput>({
    name: isGeneratedName(school.name, adminName) ? "" : school.name,
    short_name: school.short_name?.trim().toLowerCase() === adminName.trim().toLowerCase()
      ? null
      : school.short_name,
    school_type: school.school_type,
    description: school.description,
    email: school.email,
    phone: school.phone,
    website: school.website,
    country_code: school.country_code || "NG",
    state: school.state,
    city: school.city,
    address_line1: school.address_line1,
    timezone: school.timezone || "Africa/Lagos",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof SchoolProfileInput>(key: K, value: SchoolProfileInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Enter the real name of your School.");
      nameRef.current?.focus();
      return;
    }

    setSaving(true);
    setError("");
    try {
      onCompleted(await updateSchoolProfile(school.id, form));
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create the School profile. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cbt-shell min-h-dvh bg-[var(--cbt-background)]">
      <header className="border-b border-[var(--cbt-border)] bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cbt-sidebar)] text-emerald-200"><ClipboardCheck size={20} aria-hidden="true" /></span>
            <div className="min-w-0"><p className="text-sm font-extrabold text-slate-950">Assessly School</p><p className="truncate text-[11px] text-[var(--cbt-muted)]">First-time setup</p></div>
          </div>
          <button type="button" onClick={onBack} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--cbt-border)] bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50 sm:px-4 sm:text-sm">
            <ArrowLeft size={16} aria-hidden="true" /> Individual mode
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)] lg:px-8 lg:py-12">
        <aside className="h-fit overflow-hidden rounded-3xl bg-[var(--cbt-sidebar)] p-6 text-white shadow-xl sm:p-8 lg:sticky lg:top-8" aria-labelledby="school-setup-heading">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-100">One-time setup</span>
          <h1 id="school-setup-heading" className="cbt-balance mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Create your School profile</h1>
          <p className="mt-3 text-sm leading-6 text-emerald-50/75">Tell us about your School before opening the management dashboard. You can update these details later in Settings.</p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-200">Already prepared for you</p>
            <ul className="mt-4 space-y-4 text-sm text-emerald-50/85">
              <li className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" /><span>Your secure School workspace and owner account</span></li>
              <li className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" /><span>A unique code for pupil sign-in</span></li>
              <li className="flex items-start gap-3"><GraduationCap size={18} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" /><span>A current First Term ready for classes and assessments</span></li>
            </ul>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-label="Create School profile">
          <div className="border-b border-[var(--cbt-border)] px-5 py-5 sm:px-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]"><Building2 size={20} aria-hidden="true" /></span>
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--cbt-primary)]">School details</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">Complete your profile</h2><p className="mt-1 text-xs leading-5 text-[var(--cbt-muted)]"><span className="text-red-600" aria-hidden="true">*</span> Required information</p></div>
            </div>
          </div>

          {error && <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 sm:mx-7" role="alert">{error}</div>}

          <fieldset disabled={saving} className="space-y-7 p-5 sm:p-7">
            <section aria-labelledby="school-identity-heading">
              <h3 id="school-identity-heading" className="text-sm font-extrabold text-slate-950">School identity</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">School name <span className="text-red-600" aria-hidden="true">*</span><input ref={nameRef} required minLength={2} maxLength={160} value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} placeholder="Example: Bright Future Secondary School" autoComplete="organization" autoFocus /></label>
                <label className="text-xs font-bold text-slate-700">Short name <span className="font-normal text-slate-500">(optional)</span><input minLength={2} maxLength={60} value={form.short_name ?? ""} onChange={(event) => setField("short_name", event.target.value)} className={inputClass} placeholder="Example: BFSS" /><span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-500">Used where the full name is too long.</span></label>
                <label className="text-xs font-bold text-slate-700">School type <span className="text-red-600" aria-hidden="true">*</span><select required value={form.school_type} onChange={(event) => setField("school_type", event.target.value as School["school_type"])} className={inputClass}>{schoolTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-6" aria-labelledby="school-location-heading">
              <div className="flex items-center gap-2"><MapPin size={17} className="text-[var(--cbt-primary)]" aria-hidden="true" /><h3 id="school-location-heading" className="text-sm font-extrabold text-slate-950">Location</h3></div>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Country code<input list="school-country-codes" required maxLength={2} value={form.country_code} onChange={(event) => setField("country_code", event.target.value.toUpperCase())} className={`${inputClass} uppercase`} placeholder="NG" autoComplete="country" /><span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-500">Use NG for Nigeria.</span></label>
                <datalist id="school-country-codes"><option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="KE">Kenya</option><option value="ZA">South Africa</option><option value="GB">United Kingdom</option><option value="US">United States</option></datalist>
                <label className="text-xs font-bold text-slate-700">State or province <span className="font-normal text-slate-500">(optional)</span><input value={form.state ?? ""} onChange={(event) => setField("state", event.target.value)} className={inputClass} placeholder="Example: Lagos" autoComplete="address-level1" /></label>
                <label className="text-xs font-bold text-slate-700">City <span className="font-normal text-slate-500">(optional)</span><input value={form.city ?? ""} onChange={(event) => setField("city", event.target.value)} className={inputClass} placeholder="Example: Ikeja" autoComplete="address-level2" /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">School address <span className="font-normal text-slate-500">(optional)</span><input value={form.address_line1 ?? ""} onChange={(event) => setField("address_line1", event.target.value)} className={inputClass} placeholder="Street address" autoComplete="street-address" /></label>
              </div>
            </section>

            <details className="group rounded-2xl border border-slate-200 bg-slate-50">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 text-sm font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                Contact and description <span className="text-xs font-semibold text-slate-500 group-open:hidden">Optional</span><span className="hidden text-xs font-semibold text-[var(--cbt-primary)] group-open:inline">Hide</span>
              </summary>
              <div className="grid gap-5 border-t border-slate-200 p-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Official email<input type="email" value={form.email ?? ""} onChange={(event) => setField("email", event.target.value)} className={inputClass} placeholder="school@example.com" autoComplete="email" /></label>
                <label className="text-xs font-bold text-slate-700">Phone number<input type="tel" value={form.phone ?? ""} onChange={(event) => setField("phone", event.target.value)} className={inputClass} autoComplete="tel" /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Website<input type="url" value={form.website ?? ""} onChange={(event) => setField("website", event.target.value)} className={inputClass} placeholder="https://example.com" autoComplete="url" /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">About the School<textarea rows={4} maxLength={600} value={form.description ?? ""} onChange={(event) => setField("description", event.target.value)} className={`${inputClass} min-h-28 py-3 leading-6`} placeholder="A short description of your School" /></label>
              </div>
            </details>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs leading-5 text-[var(--cbt-muted)]">You can edit this information later in School Settings.</p>
            <button type="submit" disabled={saving} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-6 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
              {saving ? "Creating profile…" : "Create School profile"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
