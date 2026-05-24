import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-[#16a34a] leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Page not found
        </h1>
        <p className="mt-3 text-base text-gray-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#16a34a] text-white text-sm font-semibold hover:bg-[#15803d] transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/general/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
