import {
  filterCriticisms,
  type CriticismNavFilter,
} from "./criticismFilters";
import {
  INSPECTION_SECTIONS,
  type InspectionSectionDef,
} from "./inspectionSections";
import type { Criticism } from "./types";

export const CRITICISM_INDEX_PATH = "/criticita";

const INDEX_FILTER_LABELS: Record<
  "all" | "resolved" | "severity-1" | "severity-2" | "severity-3",
  string
> = {
  all: "Tutti",
  resolved: "Risolti",
  "severity-1": "Monitoraggio",
  "severity-2": "Criticità moderata",
  "severity-3": "Criticità grave",
};

export function criticismIndexHref(filter: CriticismNavFilter): string {
  if (filter.type === "resolved") return `${CRITICISM_INDEX_PATH}?resolved=1`;
  if (filter.type === "severity") {
    return `${CRITICISM_INDEX_PATH}?severity=${filter.level}`;
  }
  return CRITICISM_INDEX_PATH;
}

export function criticismDeepLinkHref(id: number): string {
  return `/?criticism=${id}`;
}

export function getCriticismDomId(id: number): string {
  return `criticism-${id}`;
}

const CRITICISM_SCROLL_TOP_OFFSET = 88;
const CRITICISM_SCROLL_BOTTOM_PADDING = 16;

export function scrollCriticismIntoView(
  element: HTMLElement,
  behavior: ScrollBehavior = "instant",
): void {
  const rect = element.getBoundingClientRect();
  const viewportBottom = window.innerHeight - CRITICISM_SCROLL_BOTTOM_PADDING;
  let scrollDelta = 0;

  if (rect.top < CRITICISM_SCROLL_TOP_OFFSET) {
    scrollDelta = rect.top - CRITICISM_SCROLL_TOP_OFFSET;
  } else if (rect.bottom > viewportBottom) {
    scrollDelta = rect.bottom - viewportBottom;
  } else {
    return;
  }

  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const nextScroll = Math.min(
    maxScroll,
    Math.max(0, window.scrollY + scrollDelta),
  );

  if (Math.abs(nextScroll - window.scrollY) < 1) return;

  window.scrollTo({ top: nextScroll, behavior });
}

const CRITICISM_LAYOUT_ANIMATION = "fadeUp";

export function scheduleCriticismScroll(element: HTMLElement): () => void {
  let cancelled = false;
  const sectionRoot =
    element.closest<HTMLElement>("[data-section-id]") ?? element;

  const run = (behavior: ScrollBehavior) => {
    if (cancelled) return;
    scrollCriticismIntoView(element, behavior);
  };

  const cards = Array.from(sectionRoot.querySelectorAll(".crit-card"));
  let layoutAnimationsPending = 0;
  for (const card of cards) {
    const { animationName } = getComputedStyle(card);
    if (animationName === CRITICISM_LAYOUT_ANIMATION) {
      layoutAnimationsPending += 1;
    }
  }

  const onLayoutAnimationEnd: EventListener = (event) => {
    if (!(event instanceof AnimationEvent)) return;
    if (event.animationName !== CRITICISM_LAYOUT_ANIMATION) return;
    layoutAnimationsPending = Math.max(0, layoutAnimationsPending - 1);
    if (layoutAnimationsPending === 0) {
      run("instant");
    }
  };

  if (layoutAnimationsPending === 0) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => run("instant"));
    });
  } else {
    for (const card of cards) {
      card.addEventListener("animationend", onLayoutAnimationEnd);
    }
  }

  let resizeRaf = 0;
  let lastHeight = sectionRoot.offsetHeight;
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      if (cancelled) return;
      const nextHeight = sectionRoot.offsetHeight;
      if (nextHeight === lastHeight) return;
      lastHeight = nextHeight;
      run("instant");
    });
  });
  resizeObserver.observe(sectionRoot);

  let docResizeRaf = 0;
  let lastDocHeight = document.documentElement.scrollHeight;
  const docResizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(docResizeRaf);
    docResizeRaf = requestAnimationFrame(() => {
      if (cancelled) return;
      const nextDocHeight = document.documentElement.scrollHeight;
      if (nextDocHeight === lastDocHeight) return;
      lastDocHeight = nextDocHeight;
      run("instant");
    });
  });
  const checklistRoot = document.querySelector(".inspection-sections");
  if (checklistRoot) docResizeObserver.observe(checklistRoot);

  const onImageSettled = () => run("instant");
  const images = Array.from(sectionRoot.querySelectorAll("img"));
  for (const img of images) {
    if (img.complete) continue;
    img.addEventListener("load", onImageSettled, { once: true });
    img.addEventListener("error", onImageSettled, { once: true });
  }

  const sectionImageSet = new Set(images);
  const allImages = Array.from(
    document.querySelectorAll<HTMLImageElement>(".inspection-sections img"),
  );
  for (const img of allImages) {
    if (img.complete || sectionImageSet.has(img)) continue;
    img.addEventListener("load", onImageSettled, { once: true });
  }

  return () => {
    cancelled = true;
    cancelAnimationFrame(resizeRaf);
    cancelAnimationFrame(docResizeRaf);
    resizeObserver.disconnect();
    docResizeObserver.disconnect();
    for (const card of cards) {
      card.removeEventListener("animationend", onLayoutAnimationEnd);
    }
    for (const img of images) {
      img.removeEventListener("load", onImageSettled);
      img.removeEventListener("error", onImageSettled);
    }
    for (const img of allImages) {
      if (sectionImageSet.has(img)) continue;
      img.removeEventListener("load", onImageSettled);
    }
  };
}

export function parseCriticismFocusId(
  searchParams: URLSearchParams,
): number | null {
  const raw = searchParams.get("criticism");
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export function getChecklistVisibleItems(
  items: Criticism[],
  focusId: number | null,
): Criticism[] {
  if (focusId !== null) return items;
  return items;
}

export function getCriticismIndexTitle(filter: CriticismNavFilter): string {
  if (filter.type === "resolved") return INDEX_FILTER_LABELS.resolved;
  if (filter.type === "severity") {
    return INDEX_FILTER_LABELS[`severity-${filter.level}`];
  }
  return INDEX_FILTER_LABELS.all;
}

export interface CriticismSectionGroup {
  section: InspectionSectionDef;
  items: Criticism[];
}

export function sortCriticismsForIndex(items: Criticism[]): Criticism[] {
  return [...items].sort((a, b) => {
    const sectionA = INSPECTION_SECTIONS.findIndex((s) => s.id === a.sectionId);
    const sectionB = INSPECTION_SECTIONS.findIndex((s) => s.id === b.sectionId);
    if (sectionA !== sectionB) return sectionA - sectionB;
    return a.id - b.id;
  });
}

export function groupCriticismsBySection(
  items: Criticism[],
  filter: CriticismNavFilter,
): CriticismSectionGroup[] {
  const filtered = filterCriticisms(items, filter);
  const sorted = sortCriticismsForIndex(filtered);

  return INSPECTION_SECTIONS.map((section) => ({
    section,
    items: sorted.filter((item) => item.sectionId === section.id),
  })).filter((group) => group.items.length > 0);
}

export { getCriticismIndexMeta } from "./criticismStatus";
