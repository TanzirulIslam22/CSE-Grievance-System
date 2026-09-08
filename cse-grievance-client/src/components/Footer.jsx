import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-200 bg-white px-4 py-4 md:px-8">
      <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-surface-500 sm:flex-row sm:text-left">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
          <span>
            Developed by <span className="font-medium text-surface-700">Tanzirul Islam</span> — Dept. of CSE, RUET •{" "}
            ID: 2203054 •{" "}
            <a href="mailto:tanzirul.islam56@gmail.com" className="text-primary-600 hover:text-primary-700">
              tanzirul.islam56@gmail.com
            </a>
          </span>
        </div>
        <span>© {new Date().getFullYear()} CSE Grievance System. All rights reserved.</span>
      </div>
    </footer>
  );
}