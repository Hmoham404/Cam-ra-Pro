"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, CircleHelp, HardDrive, ScanLine } from "lucide-react";
import { Sidebar, navigation } from "./Sidebar";
import { MobileNav } from "./MobileNav";
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const label =
    navigation.find((n) => path.startsWith(n.href))?.label ||
    (path === "/guide/" ? "Guide d’utilisation" : "Lecture de fiches");
  return (
    <>
      <Sidebar />
      <div className="min-h-screen lg:ml-[232px]">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8 xl:px-10">
          <div className="flex items-center gap-3 text-[11px]">
            <ScanLine size={19} className="text-blue-600 lg:hidden" />
            <span className="hidden text-slate-400 sm:inline">
              Espace de travail
            </span>
            <ChevronRight
              size={13}
              className="hidden text-slate-300 sm:inline"
            />
            <span className="font-semibold">{label}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Mode local
            </span>
            <span className="hidden items-center gap-1.5 text-[10px] text-slate-400 md:flex">
              <HardDrive size={14} />
              Cet appareil
            </span>
            <Link
              href="/guide"
              aria-label="Guide d’utilisation"
              className="text-slate-400 hover:text-blue-600"
            >
              <CircleHelp size={19} />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1530px] px-4 pt-7 pb-24 sm:px-8 lg:pb-8 xl:px-10">
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
