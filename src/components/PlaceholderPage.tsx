"use client";

import { Footer } from "./Footer";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ description }: PlaceholderPageProps) {
  return (
    <>
      <main className="page-main">
        <div className="placeholder-card">
          <p>{description}</p>
          <p className="placeholder-hint">Sezione in preparazione.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
