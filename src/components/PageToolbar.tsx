"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AuthBar } from "@/components/AuthBar";
import { ChecklistToolbarActions } from "@/components/ChecklistToolbarActions";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { parseCriticismNavFilter } from "@/lib/criticismFilters";
import {
  CRITICISM_INDEX_PATH,
  getCriticismIndexTitle,
} from "@/lib/criticismNavigation";

function PageToolbarLeading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { stationName, hydrated } = useChecklistContext();

  if (pathname === "/") {
    return (
      <nav className="breadcrumb" aria-label="Percorso di navigazione">
        <Link href="/">Checklist</Link>
        <ChevronRight size={10} className="sep" aria-hidden />
        <span className="breadcrumb-station">
          {hydrated ? stationName : "…"}
        </span>
      </nav>
    );
  }

  if (pathname === CRITICISM_INDEX_PATH) {
    const filter = parseCriticismNavFilter(searchParams);
    const title = getCriticismIndexTitle(filter);
    return (
      <div>
        <h1 className="page-toolbar-title">{title}</h1>
        <p className="criticisms-index-subtitle">
          Stazione: <strong>{hydrated ? stationName : "…"}</strong>
        </p>
      </div>
    );
  }

  if (pathname === "/stazioni") {
    return <h1 className="page-toolbar-title">Stazioni di riferimento</h1>;
  }

  if (pathname === "/profilo") {
    return <h1 className="page-toolbar-title">Il mio Profilo</h1>;
  }

  return null;
}

export function PageToolbar() {
  const pathname = usePathname();
  const isChecklist = pathname === "/";

  const actions = useMemo(() => {
    if (isChecklist) return <ChecklistToolbarActions />;
    return null;
  }, [isChecklist]);

  return (
    <header className="page-toolbar">
      <div className="page-toolbar-leading">
        <PageToolbarLeading />
      </div>
      {actions ? <div className="page-toolbar-actions">{actions}</div> : null}
      <div className="page-toolbar-account">
        <AuthBar />
      </div>
    </header>
  );
}
