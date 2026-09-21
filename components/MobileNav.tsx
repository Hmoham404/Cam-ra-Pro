"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "./Sidebar";
export function MobileNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {navigation.map(({ href, label, icon: Icon }) => (
        <Link
          aria-current={
            path.startsWith(href) || (path === "/" && href === "/lecture")
              ? "page"
              : undefined
          }
          href={href}
          key={href}
          className={`flex min-h-16 flex-col items-center justify-center gap-1.5 text-[9px] font-bold ${path.startsWith(href) || (path === "/" && href === "/lecture") ? "text-blue-600" : "text-slate-400"}`}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
