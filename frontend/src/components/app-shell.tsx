"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth-provider";
import { FlashJobNotifier } from "@/components/flashcards/job-notifier";
import { Loader } from "@/components/ui/loader";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { api, cacheCredits, peekCredits } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", hint: "Progress and shortcuts", icon: LayoutGrid, tone: "accent" as const },
  { href: "/evaluation", label: "Answer Evaluation", hint: "Score GATE answers", icon: ClipboardList, tone: "accent" as const },
  { href: "/flashcards", label: "Flashcards", hint: "Spaced revision decks", icon: Layers, tone: "flash" as const },
  { href: "/credits", label: "Credits", hint: "Wallet and top-ups", icon: Wallet, tone: "accent" as const },
];

const COLLAPSE_KEY = "lyra.sidebar.collapsed";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/evaluation": "Evaluation",
  "/flashcards": "Flashcards",
  "/credits/history": "Credit history",
  "/credits": "Credits",
  "/settings": "Account",
  "/tutor": "Tutor",
  "/practice": "Practice",
  "/questions": "Questions",
  "/mock-tests": "Mocks",
  "/analytics": "Analytics",
  "/admin": "Admin",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [credits, setCredits] = useState<number | null>(() => peekCredits());
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, place: "above" as "above" | "below" });
  const [tip, setTip] = useState<{ label: string; hint: string; top: number; left: number } | null>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const mobileAvatarRef = useRef<HTMLButtonElement>(null);
  const menuCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (typeof user.credits === "number") {
      setCredits(user.credits);
      cacheCredits(user.credits);
    }
    let cancelled = false;
    api<{ balance: number }>("/api/credits/balance")
      .then((d) => {
        if (cancelled) return;
        setCredits(d.balance);
        cacheCredits(d.balance);
      })
      .catch(() => {
        if (!cancelled && typeof user.credits !== "number") setCredits(peekCredits());
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    function onCredits(event: Event) {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") setCredits(detail);
    }
    window.addEventListener("lyra-credits", onCredits);
    return () => window.removeEventListener("lyra-credits", onCredits);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setTip(null);
  }, [pathname]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuCardRef.current?.contains(target) ||
        avatarRef.current?.contains(target) ||
        mobileAvatarRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function openMenu(from: HTMLButtonElement | null) {
    if (!from) return;
    const rect = from.getBoundingClientRect();
    const width = 240;
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    setMenuPos({
      top: rect.top,
      left,
      place: rect.top > window.innerHeight / 2 ? "above" : "below",
    });
    setMenuOpen((open) => !open);
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
    setTip(null);
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)]">
        <Loader />
      </div>
    );
  }

  const evalsLeft = credits != null ? Math.floor(credits / 10) : null;

  const pageTitle =
    Object.entries(TITLES)
      .sort(([a], [b]) => b.length - a.length)
      .find(([href]) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href)))?.[1] ??
    "Lyra";

  const menu =
    menuOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuCardRef}
            className="fixed z-[80] w-60 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[var(--shadow)]"
            style={
              menuPos.place === "above"
                ? { left: menuPos.left, bottom: `calc(100vh - ${menuPos.top}px + 10px)` }
                : { left: menuPos.left, top: menuPos.top + 42 }
            }
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <UserAvatar name={user.full_name} src={user.avatar_url} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.full_name}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
              </div>
            </div>
            <div className="border-t border-[var(--line)]">
              <Link
                href="/settings"
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition hover:bg-[var(--bg-muted)]"
              >
                <UserRound size={16} />
                Account
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  const flyout =
    tip && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[70] min-w-[168px] -translate-y-1/2 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 shadow-[var(--shadow)]"
            style={{ top: tip.top, left: tip.left }}
          >
            <p className="text-[13px] font-medium text-[var(--text)]">{tip.label}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{tip.hint}</p>
          </div>,
          document.body,
        )
      : null;

  const collapseButton = (compact: boolean) => (
    <button
      type="button"
      onClick={toggleCollapsed}
      className={cn(
        "hidden cursor-pointer items-center gap-2 py-3 text-[13px] text-[var(--text-muted)] transition hover:text-[var(--text)] lg:flex",
        compact ? "w-full justify-center px-2" : "w-full px-4",
      )}
      aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
    >
      <span className="grid h-7 w-7 place-items-center rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] transition group-hover:border-[var(--accent)]">
        {compact ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </span>
      {!compact && "Collapse"}
    </button>
  );

  const nav = (compact: boolean) => (
    <nav className="lyra-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2.5">
      {!compact && (
        <p className="px-2.5 pb-2.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Modules
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={(event) => {
                if (!compact) return;
                const rect = event.currentTarget.getBoundingClientRect();
                setTip({
                  label: item.label,
                  hint: item.hint,
                  top: rect.top + rect.height / 2,
                  left: rect.right + 10,
                });
              }}
              onMouseLeave={() => setTip(null)}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 rounded-xl py-2.5 pr-2.5 pl-2.5 transition-all duration-150",
                compact && "justify-center px-0",
                active
                  ? "bg-[var(--accent-soft)] text-[var(--text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
                  : "text-[var(--text-muted)] hover:bg-white/80 hover:text-[var(--text)] dark:hover:bg-white/10",
              )}
            >
              {active && (
                <span className="absolute top-1/2 left-0 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />
              )}
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                  item.tone === "flash"
                    ? active
                      ? "bg-[var(--flash-soft)] text-[var(--flash)] shadow-sm"
                      : "bg-[var(--flash-soft)]/80 text-[var(--flash)]"
                    : active
                      ? "bg-white text-[var(--accent)] shadow-sm dark:bg-white/10"
                      : "bg-white/70 text-[var(--accent)] dark:bg-white/10",
                )}
              >
                <Icon size={16} />
              </span>
              {!compact && (
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium leading-snug">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] leading-snug text-[var(--text-muted)]">
                    {item.hint}
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  const footer = (compact: boolean, avatarButtonRef: typeof avatarRef) => (
    <div className="shrink-0">
      {!compact && (
        <>
          {collapseButton(false)}
          <div className="mx-3 h-px bg-[var(--line)]" />
        </>
      )}
      {compact ? <div className="mx-3 h-px bg-[var(--line)]" /> : null}

      {compact ? (
        <Link
          href="/credits"
          className="mx-2 mt-2 block rounded-md bg-[linear-gradient(180deg,#ffffff,var(--accent-soft))] px-1 py-2.5 text-center dark:bg-[linear-gradient(180deg,var(--bg-elevated),var(--accent-soft))]"
        >
          <p className="text-lg font-semibold leading-none tracking-tight">
            {credits ?? <span className="inline-block h-5 w-10 animate-pulse rounded bg-[var(--line)] align-middle" />}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">credits</p>
        </Link>
      ) : (
        <div className="mx-3 mt-3 rounded-md bg-[linear-gradient(180deg,#ffffff,var(--accent-soft))] p-3.5 dark:bg-[linear-gradient(180deg,var(--bg-elevated),var(--accent-soft))]">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Credits
            </p>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-white/80 text-[var(--accent)] dark:bg-white/10">
              <Wallet size={15} />
            </span>
          </div>
          <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight">
            {credits ?? <span className="inline-block h-7 w-16 animate-pulse rounded bg-[var(--line)] align-middle" />}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {evalsLeft != null ? `≈ ${evalsLeft} evals left` : "Wallet"}
          </p>
          <Link
            href="/credits"
            className="mt-3 flex w-full cursor-pointer items-center justify-center rounded-md bg-white py-2 text-[13px] font-medium text-[var(--text)] shadow-sm transition hover:bg-[var(--bg-muted)] dark:bg-[var(--bg-elevated)]"
          >
            + Buy credits
          </Link>
        </div>
      )}

      <div className="p-3">
        <div
          className={cn(
            "flex h-10 items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-1.5",
            compact && "h-auto flex-col justify-center gap-2 px-1.5 py-2",
          )}
        >
          <ThemeToggle variant="ghost" />
          <button
            ref={avatarButtonRef}
            type="button"
            onClick={(e) => openMenu(e.currentTarget)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full p-0 leading-none transition hover:opacity-90"
            aria-label="Account menu"
          >
            <UserAvatar name={user.full_name} src={user.avatar_url} size={28} />
          </button>
        </div>
      </div>
    </div>
  );

  const sidebar = (compact: boolean, forMobile = false) => (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,var(--bg-sidebar),color-mix(in_srgb,var(--accent-soft)_55%,var(--bg-sidebar)))]",
        forMobile ? "h-full w-full" : "h-full",
      )}
    >
      <div className={cn("shrink-0 border-b border-[var(--line)]/70 px-4 py-4", compact && "flex justify-center px-2")}>
        <Logo compact={compact} subtitle="Workspace" />
      </div>
      {compact && !forMobile ? collapseButton(true) : null}
      {nav(compact)}
      {footer(compact, forMobile ? mobileAvatarRef : avatarRef)}
    </aside>
  );

  const lockViewport =
    pathname.startsWith("/flashcards") || pathname.startsWith("/evaluation");

  return (
    <div
      className={cn(
        "bg-[var(--bg)] transition-[grid-template-columns] duration-300 ease-out lg:grid lg:grid-rows-[minmax(0,1fr)]",
        lockViewport ? "h-dvh max-h-dvh overflow-hidden" : "min-h-screen",
        collapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[260px_minmax(0,1fr)]",
      )}
    >
      <FlashJobNotifier />
      <div className="sticky top-0 z-20 hidden h-dvh min-h-0 overflow-clip border-r border-[var(--line)] bg-[var(--bg-sidebar)] lg:block">
        {sidebar(collapsed)}
      </div>

      <MobileDrawer open={mobileOpen} onClose={closeMobile} title="Menu" side="left">
        {sidebar(false, true)}
      </MobileDrawer>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-col",
          lockViewport ? "h-dvh max-h-dvh overflow-hidden" : "min-h-screen",
        )}
      >
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/90 px-3 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md border border-[var(--line)] bg-[var(--bg-elevated)]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <p className="text-sm font-semibold tracking-tight">{pageTitle}</p>
          <div className="flex h-9 items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-1.5">
            <ThemeToggle variant="ghost" />
            <button
              ref={mobileAvatarRef}
              type="button"
              onClick={(e) => openMenu(e.currentTarget)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full p-0 leading-none transition hover:opacity-90"
              aria-label="Account menu"
            >
              <UserAvatar name={user.full_name} src={user.avatar_url} size={28} />
            </button>
          </div>
        </header>
        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            lockViewport
              ? "overflow-hidden p-0"
              : "overflow-x-hidden px-4 py-6 md:px-8 lg:px-10",
          )}
        >
          {children}
        </main>
      </div>
      {menu}
      {flyout}
    </div>
  );
}
