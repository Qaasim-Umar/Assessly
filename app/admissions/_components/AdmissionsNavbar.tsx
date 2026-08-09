"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, BookOpen, ChevronDown, Menu, PenLine, X } from "lucide-react";

type MenuId = "updates" | "more" | null;

const updates = [
  { href: "/admissions/category/gists", label: "School gists" },
  { href: "/admissions/category/deadlines", label: "Admission deadlines" },
];

const more = [{ href: "/admissions/category/nysc", label: "NYSC updates" }];

function routeIsActive(pathname: string, href: string) {
  if (href === "/admissions") return pathname === href;
  if (href === "/admissions/category/gists") {
    return pathname.startsWith(href) || pathname.startsWith("/admissions/gists/");
  }
  if (href === "/admissions/category/cutoffs") {
    return pathname.startsWith(href) || pathname.startsWith("/admissions/cutoffs/");
  }
  if (href === "/admissions/category/nysc") {
    return pathname.startsWith(href) || pathname.startsWith("/admissions/nysc/");
  }
  if (href === "/admissions/category/scholarships") {
    return pathname.startsWith(href) || pathname.startsWith("/admissions/scholarships/");
  }
  return pathname.startsWith(href);
}

export default function AdmissionsNavbar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const updatesActive = updates.some((item) => routeIsActive(pathname, item.href));
  const moreActive = more.some((item) => routeIsActive(pathname, item.href));

  function closeAllMenus() {
    setOpenMenu(null);
    setMobileOpen(false);
  }

  const navLinkClass = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
      active
        ? "bg-green-50 text-green-700"
        : "text-[#4a5e4e] hover:bg-[#f3f8f4] hover:text-[#0d1a0f]"
    }`;

  return (
    <>
      <div className="border-b border-white/10 bg-[#0d1a0f] text-white">
        <div className="mx-auto flex min-h-11 max-w-[1100px] items-stretch justify-center px-3 sm:justify-end sm:px-6">
          <span className="hidden items-center pr-3 text-xs font-bold uppercase tracking-[0.12em] text-white/45 sm:flex">
            More from Assessly
          </span>
          <Link
            href="/general"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 border-l border-white/10 px-3 text-xs font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-400 sm:flex-none sm:text-sm"
          >
            <BookOpen size={16} aria-hidden="true" />
            Practise free
          </Link>
          <Link
            href="/"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 border-x border-white/10 px-3 text-xs font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-400 sm:flex-none sm:text-sm"
          >
            <PenLine size={16} aria-hidden="true" />
            Create exams
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#dfe9e2] bg-white/95 shadow-[0_1px_12px_rgba(13,26,15,0.05)] backdrop-blur">
        <div ref={navRef} className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <nav className="flex min-h-16 items-center gap-5" aria-label="Admissions navigation">
            <div className="flex min-w-0 items-center gap-2.5">
              <Link
                href="/"
                aria-label="Assessly home"
                onClick={closeAllMenus}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                <Image src="/assessly-icon.svg" alt="" width={30} height={30} priority />
                <span className="inline text-base font-extrabold tracking-tight text-[#0d1a0f] sm:text-lg">
                  Assessly
                </span>
              </Link>
              <span className="h-6 w-px bg-[#dfe9e2]" aria-hidden="true" />
              <Link
                href="/admissions"
                onClick={closeAllMenus}
                className="flex min-h-11 items-center rounded-lg text-sm font-extrabold text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:text-base"
              >
                Admissions
              </Link>
            </div>

            <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              <Link href="/admissions" onClick={closeAllMenus} className={navLinkClass(routeIsActive(pathname, "/admissions"))}>
                Home
              </Link>

              <div className="relative">
                <button
                  type="button"
                  aria-expanded={openMenu === "updates"}
                  aria-haspopup="menu"
                  onClick={() => setOpenMenu((current) => (current === "updates" ? null : "updates"))}
                  className={`${navLinkClass(updatesActive)} gap-1.5`}
                >
                  News &amp; Updates
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={`transition-transform ${openMenu === "updates" ? "rotate-180" : ""}`}
                  />
                </button>
                {openMenu === "updates" && (
                  <div
                    role="menu"
                    className="absolute left-0 top-[calc(100%+8px)] w-56 rounded-xl border border-[#dfe9e2] bg-white p-2 shadow-[0_14px_35px_rgba(13,26,15,0.14)]"
                  >
                    {updates.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={closeAllMenus}
                        className="flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-[#4a5e4e] hover:bg-[#f3f8f4] hover:text-[#0d1a0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/admissions/category/scholarships"
                onClick={closeAllMenus}
                className={navLinkClass(routeIsActive(pathname, "/admissions/category/scholarships"))}
              >
                Scholarships
              </Link>
              <Link
                href="/admissions/category/cutoffs"
                onClick={closeAllMenus}
                className={navLinkClass(routeIsActive(pathname, "/admissions/category/cutoffs"))}
              >
                Cut-off Marks
              </Link>

              <div className="relative">
                <button
                  type="button"
                  aria-expanded={openMenu === "more"}
                  aria-haspopup="menu"
                  onClick={() => setOpenMenu((current) => (current === "more" ? null : "more"))}
                  className={`${navLinkClass(moreActive)} gap-1.5`}
                >
                  More
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={`transition-transform ${openMenu === "more" ? "rotate-180" : ""}`}
                  />
                </button>
                {openMenu === "more" && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-xl border border-[#dfe9e2] bg-white p-2 shadow-[0_14px_35px_rgba(13,26,15,0.14)]"
                  >
                    {more.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={closeAllMenus}
                        className="flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-[#4a5e4e] hover:bg-[#f3f8f4] hover:text-[#0d1a0f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/admissions/question-bank"
              onClick={closeAllMenus}
              className={`ml-auto hidden min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:inline-flex ${
                routeIsActive(pathname, "/admissions/question-bank")
                  ? "bg-[#0d1a0f] text-white"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <BookOpen size={17} aria-hidden="true" />
              Question Bank
            </Link>

            <button
              type="button"
              aria-label={mobileOpen ? "Close Admissions menu" : "Open Admissions menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((current) => !current)}
              className="ml-auto flex size-11 items-center justify-center rounded-lg text-[#0d1a0f] hover:bg-[#f3f8f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:ml-0 lg:hidden"
            >
              {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </nav>

          {mobileOpen && (
            <div className="border-t border-[#e7eee9] pb-5 pt-3 lg:hidden">
              <div className="grid gap-1">
                <Link href="/admissions" onClick={closeAllMenus} className={navLinkClass(routeIsActive(pathname, "/admissions"))}>
                  Home
                </Link>
                <p className="mb-1 mt-3 px-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#829187]">
                  News &amp; Updates
                </p>
                {updates.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAllMenus}
                    className={`${navLinkClass(routeIsActive(pathname, item.href))} pl-6`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/admissions/category/scholarships"
                  onClick={closeAllMenus}
                  className={navLinkClass(routeIsActive(pathname, "/admissions/category/scholarships"))}
                >
                  Scholarships
                </Link>
                <Link
                  href="/admissions/category/cutoffs"
                  onClick={closeAllMenus}
                  className={navLinkClass(routeIsActive(pathname, "/admissions/category/cutoffs"))}
                >
                  Cut-off Marks
                </Link>
                <Link
                  href="/admissions/category/nysc"
                  onClick={closeAllMenus}
                  className={navLinkClass(routeIsActive(pathname, "/admissions/category/nysc"))}
                >
                  NYSC updates
                </Link>
                <Link
                  href="/admissions/question-bank"
                  onClick={closeAllMenus}
                  className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-extrabold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                >
                  <BookOpen size={18} aria-hidden="true" />
                  Browse Question Bank
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
