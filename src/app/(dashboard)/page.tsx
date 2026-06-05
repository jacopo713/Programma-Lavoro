import { Suspense } from "react";
import { ChecklistPage } from "@/components/ChecklistPage";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="page-loading">Caricamento...</p>}>
      <ChecklistPage />
    </Suspense>
  );
}
