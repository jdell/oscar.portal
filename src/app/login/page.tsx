import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  const { from } = await searchParams;

  if (session) {
    redirect(from && from.startsWith("/") ? from : "/agencies");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand panel — compact horizontal strip on mobile, full left panel on desktop */}
      <div className="relative flex items-center gap-4 overflow-hidden bg-gradient-to-br from-sky-600 to-sky-900 p-6 text-white lg:w-1/2 lg:flex-col lg:items-start lg:justify-between lg:p-12">
        {/* Dot-grid background pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Logo */}
        <div className="relative z-10 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 156.17 141.78"
            className="h-14 w-auto drop-shadow-lg lg:h-24"
            aria-label="Oscar logo"
          >
            <circle fill="#fff" fillOpacity="0.25" cx="83.45" cy="61.23" r="50.52" />
            <circle fill="none" stroke="#fff" strokeOpacity="0.6" strokeMiterlimit="10" strokeWidth="2" cx="83.45" cy="61.23" r="50.52" />
            <line stroke="#fff" strokeOpacity="0.5" strokeMiterlimit="10" strokeWidth="2" x1="110.85" y1="32.83" x2="154.08" y2="2.17" />
            <line stroke="#fff" strokeOpacity="0.5" strokeMiterlimit="10" strokeWidth="2" x1="80.42" y1="87.05" x2="76.98" y2="133.05" />
            <line stroke="#fff" strokeOpacity="0.5" strokeMiterlimit="10" strokeWidth="2" x1="106.82" y1="93.66" x2="146.54" y2="139.91" />
            <line stroke="#fff" strokeOpacity="0.5" strokeMiterlimit="10" strokeWidth="2" x1="63.09" y1="27.8" x2="48.01" y2="8.7" />
            <line stroke="#fff" strokeOpacity="0.5" strokeMiterlimit="10" strokeWidth="2" x1="49.69" y1="85.58" x2="19.97" y2="101.71" />
            <line stroke="#fff" strokeOpacity="0.5" strokeMiterlimit="10" strokeWidth="2" x1="41.98" y1="43.89" x2="2.26" y2="35.34" />
            <circle fill="#de761c" cx="153.91" cy="2.26" r="2.26" />
            <circle fill="#de761c" cx="19.99" cy="101.59" r="2.26" />
            <circle fill="#de761c" cx="146.21" cy="139.52" r="2.26" />
            <circle fill="#de761c" cx="48.12" cy="8.89" r="2.26" />
            <circle fill="#de761c" cx="2.26" cy="35.34" r="2.26" />
            <circle fill="#de761c" cx="76.93" cy="133.05" r="2.26" />
            <g>
              <path fill="#fff" d="M36.98,62.1c0-1.4.26-2.71.79-3.92.53-1.21,1.25-2.27,2.16-3.19s1.99-1.64,3.23-2.16c1.24-.52,2.57-.79,4-.79s2.76.26,4,.79c1.24.52,2.32,1.25,3.23,2.16s1.64,1.98,2.16,3.19c.53,1.21.79,2.52.79,3.92s-.26,2.71-.79,3.94c-.52,1.23-1.25,2.29-2.16,3.19-.92.9-1.99,1.62-3.23,2.14-1.24.52-2.57.79-4,.79s-2.76-.26-4-.79-2.32-1.24-3.23-2.14c-.92-.9-1.64-1.97-2.16-3.19-.52-1.23-.79-2.54-.79-3.94ZM40.85,62.1c0,.97.15,1.86.44,2.69.30.82.71,1.52,1.25,2.1s1.2,1.04,1.98,1.37c.78.34,1.66.5,2.62.5s1.84-.17,2.63-.5c.78-.34,1.44-.79,1.98-1.37s.96-1.28,1.25-2.1.44-1.72.44-2.69-.15-1.86-.44-2.69c-.30-.82-.71-1.52-1.25-2.1-.54-.58-1.2-1.04-1.98-1.37-.78-.34-1.66-.5-2.63-.5s-1.84.17-2.62.5c-.78.34-1.44.79-1.98,1.37-.54.58-.96,1.28-1.25,2.1-.30.82-.44,1.72-.44,2.69Z" />
              <path fill="#fff" d="M71.67,57.33c-.43-.54-.96-.99-1.6-1.35-.63-.36-1.41-.55-2.32-.55-.86,0-1.61.18-2.24.55-.63.36-.95.9-.95,1.6,0,.57.18,1.02.55,1.37.36.35.79.63,1.29.85.5.22,1.03.38,1.6.48.57.11,1.05.2,1.45.28.78.19,1.51.42,2.2.69.69.27,1.28.62,1.78,1.05s.89.96,1.17,1.58.42,1.37.42,2.26c0,1.08-.23,2-.69,2.77s-1.05,1.39-1.78,1.88c-.73.48-1.56.83-2.48,1.05-.93.22-1.86.32-2.81.32-1.59,0-2.98-.24-4.18-.73-1.2-.48-2.27-1.37-3.21-2.67l2.75-2.26c.59.59,1.25,1.12,1.98,1.58s1.62.69,2.67.69c.46,0,.92-.05,1.39-.14s.89-.24,1.25-.44c.36-.2.66-.46.89-.77.23-.31.34-.67.34-1.07,0-.54-.17-.98-.5-1.33-.34-.35-.74-.63-1.21-.83-.47-.2-.97-.36-1.49-.48s-.99-.22-1.39-.3c-.78-.19-1.52-.4-2.22-.65-.7-.24-1.32-.57-1.86-.97s-.97-.92-1.29-1.53c-.32-.62-.48-1.39-.48-2.3,0-1,.21-1.86.63-2.6.42-.74.97-1.35,1.66-1.84s1.47-.85,2.34-1.09,1.76-.36,2.65-.36c1.29,0,2.53.24,3.72.73,1.18.48,2.13,1.29,2.83,2.42l-2.83,2.14-.03-.03Z" />
              <path fill="#fff" d="M92.71,57.61c-.67-.7-1.38-1.23-2.12-1.6-.74-.36-1.62-.55-2.65-.55s-1.87.18-2.61.55c-.74.36-1.36.86-1.86,1.49s-.88,1.36-1.13,2.18c-.26.82-.38,1.68-.38,2.56s.15,1.73.44,2.52c.30.79.71,1.49,1.25,2.08s1.18,1.06,1.94,1.39c.75.34,1.6.5,2.54.5,1.02,0,1.9-.18,2.63-.54.73-.36,1.4-.9,2.02-1.6l2.58,2.58c-.94,1.05-2.04,1.8-3.29,2.26s-2.58.69-3.98.69c-1.48,0-2.83-.24-4.06-.73-1.23-.48-2.28-1.16-3.17-2.04-.89-.87-1.58-1.92-2.06-3.15-.48-1.22-.73-2.58-.73-4.06s.24-2.84.73-4.08c.48-1.24,1.16-2.3,2.04-3.19s1.93-1.58,3.15-2.08c1.23-.5,2.59-.75,4.1-.75,1.4,0,2.74.25,4.02.75s2.39,1.26,3.33,2.28l-2.75,2.5.02.04Z" />
              <path fill="#fff" d="M98.97,54.87c1.02-.94,2.21-1.65,3.55-2.12,1.35-.47,2.69-.71,4.04-.71s2.61.18,3.62.52c1.01.35,1.84.82,2.48,1.41.65.59,1.12,1.27,1.43,2.04s.46,1.57.46,2.4v9.77c0,.67.01,1.29.04,1.86s.07,1.1.12,1.62h-3.23c-.08-.97-.12-1.94-.12-2.91h-.08c-.81,1.24-1.76,2.11-2.87,2.63-1.1.51-2.38.77-3.84.77-.89,0-1.74-.12-2.54-.36-.81-.24-1.51-.61-2.12-1.09-.61-.48-1.08-1.08-1.43-1.8-.35-.71-.53-1.54-.53-2.48,0-1.24.28-2.28.83-3.11s1.31-1.51,2.26-2.04c.96-.52,2.07-.9,3.35-1.13s2.65-.34,4.1-.34h2.67v-.81c0-.48-.09-.97-.28-1.45s-.47-.92-.85-1.31c-.38-.39-.85-.7-1.41-.93-.57-.23-1.24-.34-2.02-.34-.7,0-1.31.07-1.84.2-.52.14-1,.3-1.43.5s-.82.44-1.17.71-.69.52-1.01.77l-2.18-2.26h0ZM109.23,62.46c-.86,0-1.74.05-2.65.14-.9.09-1.72.28-2.46.55s-1.35.65-1.82,1.13c-.47.48-.71,1.1-.71,1.86,0,1.1.37,1.9,1.11,2.38.74.48,1.74.73,3.01.73,1,0,1.84-.17,2.54-.5.7-.34,1.27-.77,1.7-1.31s.74-1.14.93-1.8.28-1.31.28-1.96v-1.21h-1.94.01Z" />
              <path fill="#fff" d="M119.45,52.53h3.63v2.95h.08c.24-.51.57-.98.97-1.39.4-.42.85-.77,1.35-1.07s1.04-.53,1.64-.71c.59-.17,1.18-.26,1.78-.26s1.13.08,1.62.24l-.16,3.92c-.30-.08-.59-.15-.89-.2s-.59-.08-.89-.08c-1.78,0-3.14.5-4.08,1.49-.94,1-1.41,2.54-1.41,4.64v9.61h-3.63v-19.14h0Z" />
            </g>
          </svg>
          <p className="mt-2 hidden text-xs font-medium text-sky-200 tracking-widest uppercase lg:block">
            Admin Portal
          </p>
        </div>

        {/* Mobile: org name shown inline next to logo */}
        <div className="relative z-10 lg:hidden">
          <p className="text-sm font-semibold leading-tight">Oscar Admin</p>
          <a
            href="https://www.cpccommunityhealth.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-200 hover:text-white transition-colors hover:underline underline-offset-2"
          >
            CPC Community Health
          </a>
        </div>

        {/* Centre copy — desktop only */}
        <div className="relative z-10 hidden lg:block">
          <p className="text-3xl font-semibold leading-snug">
            Colorado Heart Healthy Solutions
          </p>
          <p className="mt-3 text-sky-100 text-sm leading-relaxed">
            A statewide program reducing the burden of cardiovascular disease
            and diabetes through a network of community health workers — providing
            assessments, education, coaching, and referrals at no cost.
          </p>
          <p className="mt-4 text-sky-200 text-sm font-medium">
            Serving over 40,000 Coloradans since 2008.
          </p>
        </div>

        {/* Footer — desktop only */}
        <div className="relative z-10 hidden lg:block">
          <a
            href="https://www.cpccommunityhealth.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-200 text-xs font-medium hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            CPC Community Health
          </a>
          <p className="text-sky-300 text-xs mt-0.5">
            © 2008–{new Date().getFullYear()} CPC Community Health
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 to-white">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-8">
            <div className="w-8 h-1 rounded-full bg-[#00b0db] mb-4" />
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to your account
            </p>
          </div>

          <LoginForm redirectTo={from} />
        </div>
      </div>
    </div>
  );
}
