import { Suspense } from "react";
import { CriticismsIndexPage } from "@/components/CriticismsIndexPage";

function CriticismsIndexFallback() {
  return (
    <main className="page-main">
      <p className="page-loading">Caricamento...</p>
    </main>
  );
}

export default function CriticitaRoutePage() {
  return (
    <Suspense fallback={<CriticismsIndexFallback />}>
      <CriticismsIndexPage />
    </Suspense>
  );
}
