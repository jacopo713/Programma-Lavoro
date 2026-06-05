"use client";

import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Menu,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { ResponsiveAccountBar } from "@/components/ResponsiveAccountBar";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { MOBILE_NAV_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import {
  countCriticismNav,
  isSameCriticismFilter,
  parseCriticismNavFilter,
  type CriticismNavFilter,
} from "@/lib/criticismFilters";
import {
  CRITICISM_INDEX_PATH,
  criticismIndexHref,
} from "@/lib/criticismNavigation";

const CRITICISM_SUBNAV: {
  filter: CriticismNavFilter;
  label: string;
  countKey: "open" | "monitor" | "moderate" | "grave" | "resolved";
}[] = [
  { filter: { type: "all" }, label: "Tutti", countKey: "open" },
  { filter: { type: "severity", level: 1 }, label: "Monitoraggio", countKey: "monitor" },
  {
    filter: { type: "severity", level: 2 },
    label: "Criticità moderata",
    countKey: "moderate",
  },
  {
    filter: { type: "severity", level: 3 },
    label: "Criticità grave",
    countKey: "grave",
  },
  { filter: { type: "resolved" }, label: "Risolti", countKey: "resolved" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);
  const { items, hydrated } = useChecklistContext();
  const activeFilter = parseCriticismNavFilter(searchParams);
  const counts = useMemo(() => countCriticismNav(items), [items]);
  const onCriticismIndexRoute = pathname === CRITICISM_INDEX_PATH;
  const onChecklistRoute = pathname === "/";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [criticismOpen, setCriticismOpen] = useState(
    () => onCriticismIndexRoute || onChecklistRoute,
  );

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile) {
      setCriticismOpen(onCriticismIndexRoute || onChecklistRoute);
      return;
    }
    setCriticismOpen(onCriticismIndexRoute);
  }, [isMobile, onCriticismIndexRoute, onChecklistRoute]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const toggleMobileNav = useCallback(() => {
    setMobileNavOpen((open) => !open);
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const toggleCriticismSubnav = useCallback(() => {
    setCriticismOpen((open) => !open);
  }, []);

  const handleCriticismClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onCriticismIndexRoute || onChecklistRoute) {
      e.preventDefault();
    }
    toggleCriticismSubnav();
  };

  const handleNavLinkClick = () => {
    if (isMobile) {
      closeMobileNav();
    }
  };

  return (
    <aside
      className={`app-sidebar${mobileNavOpen ? " app-sidebar--nav-open" : ""}`}
      aria-label="Menu principale"
    >
      <div className="app-sidebar-brand">
        <Link href="/" className="app-sidebar-brand-link">
          <Image
            src="/app-logo.svg"
            alt=""
            width={36}
            height={36}
            className="app-sidebar-logo"
            priority
            aria-hidden
          />
          <span className="app-sidebar-brand-text">
            <span className="app-sidebar-brand-title">{APP_NAME}</span>
            <span className="app-sidebar-brand-sub">{APP_TAGLINE}</span>
          </span>
        </Link>
        <div className="app-sidebar-brand-actions">
          <button
            type="button"
            className="app-sidebar-menu-toggle"
            aria-expanded={mobileNavOpen}
            aria-controls="app-sidebar-nav"
            aria-label={mobileNavOpen ? "Chiudi menu" : "Apri menu"}
            onClick={toggleMobileNav}
          >
            {mobileNavOpen ? (
              <X size={20} aria-hidden />
            ) : (
              <Menu size={20} aria-hidden />
            )}
          </button>
          <div className="app-sidebar-account">
            <ResponsiveAccountBar placement="header" />
          </div>
        </div>
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Chiudi menu"
          onClick={closeMobileNav}
        />
      ) : null}

      <nav
        id="app-sidebar-nav"
        className="app-sidebar-nav"
        aria-hidden={isMobile && !mobileNavOpen ? true : undefined}
      >
        <Link
          href="/profilo"
          className={`app-sidebar-link${pathname === "/profilo" ? " active" : ""}`}
          onClick={handleNavLinkClick}
        >
          <User size={18} aria-hidden />
          <span>Il mio Profilo</span>
        </Link>

        <Link
          href="/stazioni"
          className={`app-sidebar-link${pathname === "/stazioni" ? " active" : ""}`}
          onClick={handleNavLinkClick}
        >
          <Building2 size={18} aria-hidden />
          <span>Sedi</span>
        </Link>

        <div className="app-sidebar-group">
          <div className="app-sidebar-link app-sidebar-link--parent">
            <Link
              href={CRITICISM_INDEX_PATH}
              className="app-sidebar-parent-main"
              aria-expanded={criticismOpen}
              onClick={handleCriticismClick}
            >
              <AlertTriangle size={18} aria-hidden />
              <span className="app-sidebar-link-label">Criticità</span>
            </Link>
            <button
              type="button"
              className="app-sidebar-chevron-btn"
              aria-expanded={criticismOpen}
              aria-label={
                criticismOpen
                  ? "Comprimi sottomenu criticità"
                  : "Espandi sottomenu criticità"
              }
              onClick={toggleCriticismSubnav}
            >
              {criticismOpen ? (
                <ChevronDown size={16} aria-hidden />
              ) : (
                <ChevronRight size={16} aria-hidden />
              )}
            </button>
          </div>

          {criticismOpen ? (
            <ul className="app-sidebar-subnav" role="list">
              {CRITICISM_SUBNAV.map(({ filter, label, countKey }) => {
                const href = criticismIndexHref(filter);
                const isActive =
                  onCriticismIndexRoute &&
                  isSameCriticismFilter(activeFilter, filter);
                const count = hydrated ? counts[countKey] : "—";

                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`app-sidebar-sublink${isActive ? " active" : ""}`}
                      onClick={handleNavLinkClick}
                    >
                      <span>{label}</span>
                      <span className="app-sidebar-count">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
