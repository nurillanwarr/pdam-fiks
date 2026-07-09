// components/layout/Sidebar.tsx
/**
 * @file components/layout/Sidebar.tsx
 * @description Komponen navigasi menu di sisi kiri layar. Link yang ditampilkan menyesuaikan dengan role user yang sedang login.
 * @location Dirender di dalam `DashboardShell.tsx`.
 */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileText, LayoutDashboard, Users, ClipboardList,
  Archive, CheckSquare, BookOpen, LogOut, FileSearch, X, UserCog,
  Mail, MailOpen, Send, Briefcase, Award, Handshake, ScrollText,
  Calendar, Activity, ChevronDown, Search
} from "lucide-react";
import { signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const navByRole: Record<UserRole, NavEntry[]> = {
  ADMIN_STAFF: [
    { label: "Dashboard", href: "/dashboard/staff", icon: LayoutDashboard },
    { label: "Dokumen Saya", href: "/dashboard/staff/dokumen", icon: ClipboardList },
  ],
  AGENDARIS: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    {
      label: "Kelola Dokumen",
      icon: FileText,
      children: [
        { label: "Undangan", href: "/dashboard/admin/undangan", icon: Calendar },
        { label: "Surat Masuk", href: "/dashboard/admin/surat-masuk", icon: MailOpen },
      ],
    },
    { label: "Progres Disposisi", href: "/dashboard/admin/dokumen", icon: BookOpen },
    { label: "Arsip", href: "/dashboard/admin/arsip", icon: Archive },
    { label: "Kelola Pengguna", href: "/dashboard/admin/users", icon: Users },
    { label: "Audit Log", href: "/dashboard/admin/audit", icon: Activity },
  ],
  DIREKTUR: [
    { label: "Dashboard", href: "/dashboard/direktur", icon: LayoutDashboard },
    { label: "Menunggu Keputusan", href: "/dashboard/direktur/antrian", icon: ClipboardList },
    { label: "Riwayat Keputusan", href: "/dashboard/direktur/riwayat", icon: CheckSquare },
    { label: "Semua Dokumen", href: "/dashboard/direktur/dokumen", icon: BookOpen },
  ],
  KABAG: [
    { label: "Dashboard", href: "/dashboard/kabag", icon: LayoutDashboard },
    { label: "Disposisi Masuk", href: "/dashboard/kabag/disposisi", icon: ClipboardList },
    { label: "Semua Dokumen", href: "/dashboard/kabag/dokumen", icon: BookOpen },
  ],
  KASUBAG: [
    { label: "Dashboard", href: "/dashboard/kabag", icon: LayoutDashboard },
    { label: "Disposisi Masuk", href: "/dashboard/kabag/disposisi", icon: ClipboardList },
    { label: "Semua Dokumen", href: "/dashboard/kabag/dokumen", icon: BookOpen },
  ],
};

interface Props {
  role: UserRole;
  userName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Collect all flat hrefs from nav entries (including children)
function getAllHrefs(entries: NavEntry[]): NavItem[] {
  const items: NavItem[] = [];
  for (const entry of entries) {
    if (isNavGroup(entry)) {
      items.push(...entry.children);
    } else {
      items.push(entry);
    }
  }
  return items;
}

export function Sidebar({ role, userName, isOpen = false, onClose }: Props) {
  const pathname = usePathname();
  const navEntries = navByRole[role] ?? [];
  const allItems = getAllHrefs(navEntries);

  const activeHref = allItems
    .filter(item => {
      // Prioritaskan match persis
      if (pathname === item.href) return true;
      
      // Untuk menu utama (Dashboard), jangan biarkan 'startsWith' menangkap semua sub-page.
      // Kecuali jika memang tidak ada menu lain yang lebih spesifik.
      const isRootPath = ["/dashboard/admin", "/dashboard/staff", "/dashboard/direktur", "/dashboard/kabag"].includes(item.href);
      if (isRootPath) return false;
      
      return pathname.startsWith(item.href + "/");
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href || (
      // Fallback: Jika tidak ada yang cocok tapi kita di sub-page dashboard, highlight Dashboard saja
      allItems.find(n => pathname.startsWith(n.href))?.href
    );

  const roleLabel: Record<UserRole, string> = {
    ADMIN_STAFF: "Admin Staff",
    AGENDARIS: "Agendaris",
    DIREKTUR: "Direktur Utama",
    KABAG: "Kepala Bagian",
    KASUBAG: "Kepala Sub Bagian",
  };

  return (
    <aside
      className={cn(
        "print:hidden",
        "bg-blue-900 dark:bg-slate-950 text-white flex flex-col shrink-0 z-40 transition-transform duration-300 ease-in-out border-r border-blue-800 dark:border-slate-900",
        /* Desktop: collapsable */
        "md:relative md:translate-x-0 md:w-64",
        /* Mobile: fixed overlay */
        "fixed inset-y-0 left-0 w-64",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo + close button */}
      <div className="px-5 py-5 border-b border-blue-800 dark:border-slate-900 flex items-center h-[76px] box-border overflow-hidden">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 shrink-0" />
          </div>
          <div className="flex-1 min-w-[140px] transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
            <p className="font-bold text-base leading-tight truncate">SIPAS PDAM</p>
            <p className="text-sm text-blue-300 leading-tight truncate">Arsip Digital</p>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-blue-800 text-blue-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-blue-800 dark:border-slate-900 flex items-center h-[90px] box-border relative overflow-hidden">
        {/* Collapsed Avatar (Desktop only) */}
        <div className="hidden md:flex group-hover:md:hidden absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-800 rounded-full items-center justify-center shrink-0 overflow-hidden border border-blue-700">
          {/* Try to get image from a prop or session if needed, but since Sidebar is a server/client hybrid, I'll use a placeholder or initials for now unless I pass image down. */}
          <span className="font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
        </div>
        {/* Full User Info */}
        <div className="flex-1 min-w-[180px] transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
          <p className="text-sm text-blue-400 mb-1">Login sebagai</p>
          <p className="font-semibold text-base leading-tight truncate">{userName}</p>
          <span className="inline-block mt-1 text-sm bg-blue-700 px-2 py-0.5 rounded-full text-blue-100 truncate">
            {roleLabel[role]}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navEntries.map((entry, idx) => {
          if (isNavGroup(entry)) {
            return (
              <NavGroupItem
                key={`group-${idx}`}
                group={entry}
                activeHref={activeHref}
                pathname={pathname}
                onClose={onClose}
              />
            );
          }

          const Icon = entry.icon;
          const active = entry.href === activeHref;
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
                active
                  ? "bg-blue-700 text-white font-medium"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              )}
              title={entry.label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                {entry.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** Collapsible nav group component */
function NavGroupItem({
  group,
  activeHref,
  pathname,
  onClose,
}: {
  group: NavGroup;
  activeHref: string | undefined;
  pathname: string;
  onClose?: () => void;
}) {
  // Check if any child is active
  const hasActiveChild = group.children.some(
    (child) => child.href === activeHref || pathname.startsWith(child.href + "/")
  );

  // Auto-open if a child is active
  const [open, setOpen] = useState(hasActiveChild);

  const Icon = group.icon;

  return (
    <div>
      {/* Group toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative w-full",
          hasActiveChild
            ? "bg-blue-700/50 text-white font-medium"
            : "text-blue-200 hover:bg-blue-800 hover:text-white"
        )}
        title={group.label}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="whitespace-nowrap flex-1 text-left transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
          {group.label}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200 md:opacity-0 md:group-hover:opacity-100",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      {/* Children */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          "md:hidden md:group-hover:block",
          open ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 pl-3 border-l border-blue-700/50 space-y-0.5">
          {group.children.map((child) => {
            const ChildIcon = child.icon;
            const active = child.href === activeHref;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-blue-700 text-white font-medium"
                    : "text-blue-300 hover:bg-blue-800 hover:text-white"
                )}
                title={child.label}
              >
                <ChildIcon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                  {child.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
