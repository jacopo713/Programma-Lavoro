"use client";

import { ChevronRight, Clipboard } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { parseCriticismNavFilter } from "@/lib/criticismFilters";
import { getPhotoDataUrl } from "@/lib/criticismDisplay";
import {
  criticismDeepLinkHref,
  getCriticismIndexMeta,
  groupCriticismsBySection,
} from "@/lib/criticismNavigation";
import { formatSectionHeading } from "@/lib/inspectionSections";
import { Footer } from "./Footer";

export function CriticismsIndexPage() {
  const searchParams = useSearchParams();
  const { items, hydrated } = useChecklistContext();
  const filter = useMemo(
    () => parseCriticismNavFilter(searchParams),
    [searchParams],
  );
  const groups = useMemo(
    () => groupCriticismsBySection(items, filter),
    [items, filter],
  );
  const totalCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
  );
  if (!hydrated) {
    return (
      <main className="page-main">
        <p className="page-loading">Caricamento...</p>
      </main>
    );
  }

  return (
    <>
      <main className="page-main">
        <p className="criticisms-index-intro">
          {totalCount === 0
            ? "Nessuna criticità in questa categoria."
            : `${totalCount} ${totalCount === 1 ? "criticità" : "criticità"} — seleziona una voce per aprirla nella checklist.`}
        </p>

        {totalCount === 0 ? (
          <div className="criticisms-index-empty placeholder-card">
            <Clipboard size={36} strokeWidth={1.5} aria-hidden />
            <p>Nessuna criticità in questa categoria</p>
            <Link href="/" className="criticisms-index-checklist-link">
              Vai alla checklist
            </Link>
          </div>
        ) : (
          <div className="criticisms-index-groups">
            {groups.map(({ section, items: sectionItems }) => (
              <section
                key={section.id}
                className="criticisms-index-group"
                aria-label={formatSectionHeading(section)}
              >
                <h2 className="criticisms-index-group-title">
                  {formatSectionHeading(section)}
                </h2>
                <ul className="criticisms-index-list" role="list">
                  {sectionItems.map((item) => {
                    const photo = getPhotoDataUrl(item.photos);
                    const meta = getCriticismIndexMeta(item);

                    return (
                      <li key={item.id}>
                        <Link
                          href={criticismDeepLinkHref(item.id)}
                          scroll={false}
                          className="criticisms-index-row"
                        >
                          {photo ? (
                            <span className="criticisms-index-thumb" aria-hidden>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo} alt="" />
                            </span>
                          ) : (
                            <span
                              className="criticisms-index-thumb criticisms-index-thumb--empty"
                              aria-hidden
                            />
                          )}
                          <span className="criticisms-index-row-body">
                            <span className="criticisms-index-row-title">
                              {item.title}
                            </span>
                            <span
                              className={`criticisms-index-badge criticisms-index-badge--${meta.tone}`}
                            >
                              {meta.label}
                            </span>
                          </span>
                          <ChevronRight
                            size={16}
                            className="criticisms-index-row-chevron"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="criticisms-index-footer">
          <Link href="/" className="criticisms-index-checklist-link">
            Vai alla checklist
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
