"use client";

import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { useChecklistContext } from "@/contexts/ChecklistContext";
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
  const { items, hydrated } = useChecklistContext();
  const activeFilter = parseCriticismNavFilter(searchParams);
  const counts = useMemo(() => countCriticismNav(items), [items]);
  const onCriticismIndexRoute = pathname === CRITICISM_INDEX_PATH;
  const onChecklistRoute = pathname === "/";
  const [criticismOpen, setCriticismOpen] = useState(
    () => onCriticismIndexRoute || onChecklistRoute,
  );

  const toggleCriticismSubnav = useCallback(() => {
    setCriticismOpen((open) => !open);
  }, []);

  const handleCriticismClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onCriticismIndexRoute || onChecklistRoute) {
      e.preventDefault();
    }
    toggleCriticismSubnav();
  };

  return (
    <aside className="app-sidebar" aria-label="Menu principale">
      <div className="app-sidebar-brand">
        <Link href="/" className="app-sidebar-logo-link">
          <Image
            src="/sanatec-logo.png"
            alt="sanatec Piemonte"
            width={150}
            height={40}
            className="app-sidebar-logo"
            priority
          />
        </Link>
      </div>

      <nav className="app-sidebar-nav">
        <Link
          href="/profilo"
          className={`app-sidebar-link${pathname === "/profilo" ? " active" : ""}`}
        >
          <User size={18} aria-hidden />
          <span>Il mio Profilo</span>
        </Link>

        <Link
          href="/stazioni"
          className={`app-sidebar-link${pathname === "/stazioni" ? " active" : ""}`}
        >
          <Building2 size={18} aria-hidden />
          <span>Stazioni di riferimento</span>
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
