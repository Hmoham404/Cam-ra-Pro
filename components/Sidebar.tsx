"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  History,
  Settings2,
  ArrowUpRight,
  ShieldCheck,
  BookOpen,
  ChevronRight,
} from "lucide-react";
export const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lecture", label: "Lecture de fiches", icon: ScanLine },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/parametres", label: "Paramètres", icon: Settings2 },
];
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-[#111f35] text-white lg:flex">
      <Link href="/lecture" className="flex items-center gap-3 px-6 pt-8 pb-9">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500">
          <ScanLine size={25} />
        </div>
        <div className="text-[15px] leading-[1.35] font-extrabold tracking-tight">
          Production
          <span className="block text-[11px] font-medium tracking-[.08em] text-slate-400">
            SHEET READER
          </span>
        </div>
      </Link>
      <p className="px-7 pb-3 text-[9px] font-bold tracking-[.19em] text-slate-500">
        ESPACE DE TRAVAIL
      </p>
      <nav className="space-y-1.5 px-3.5">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            pathname.startsWith(href) ||
            (pathname === "/" && href === "/lecture");
          return (
            <Link
              aria-current={active ? "page" : undefined}
              key={href}
              href={href}
              className={`flex h-12 items-center gap-3 rounded-lg px-3.5 text-xs font-semibold transition ${active ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={18} />
              {label}
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mx-5 mt-auto rounded-xl border border-white/8 bg-white/[.025] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <ShieldCheck size={17} className="text-emerald-400" />
          Vos données, chez vous.
        </div>
        <p className="text-[11px] leading-5 text-slate-400">
          Les fiches sont analysées et conservées sur cet appareil.
        </p>
        <Link
          href="/parametres"
          className="mt-3 flex items-center gap-1 text-[10px] font-bold text-blue-400"
        >
          En savoir plus
          <ArrowUpRight size={13} />
        </Link>
      </div>
      <Link
        href="/guide"
        className="mx-5 mt-5 mb-5 flex items-center gap-2 text-[11px] text-slate-400"
      >
        <BookOpen size={16} />
        Guide d’utilisation
        <ChevronRight size={13} className="ml-auto" />
      </Link>
      <div className="flex items-center gap-3 border-t border-white/8 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-200">
          PS
        </div>
        <div className="text-[11px] font-semibold">
          Espace local
          <p className="mt-1 text-[10px] font-normal text-slate-500">
            Sans compte · Sans cloud
          </p>
        </div>
        <span className="ml-auto size-1.5 rounded-full bg-emerald-400" />
      </div>
    </aside>
  );
}
