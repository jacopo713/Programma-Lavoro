"use client";

import { Suspense } from "react";
import { AppSidebar } from "./AppSidebar";
import { ChecklistShell } from "./ChecklistShell";
import { PageToolbar } from "./PageToolbar";
import { RequireAuth } from "./RequireAuth";

function SidebarFallback() {
  return (
    <aside className="app-sidebar app-sidebar--loading" aria-hidden>
      <div className="app-sidebar-brand" />
    </aside>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChecklistShell>
      <RequireAuth>
        <div className="app-shell">
          <div className="app-shell-body">
            <Suspense fallback={<SidebarFallback />}>
              <AppSidebar />
            </Suspense>
            <div className="app-main">
              <Suspense fallback={null}>
                <PageToolbar />
              </Suspense>
              {children}
            </div>
          </div>
        </div>
      </RequireAuth>
    </ChecklistShell>
  );
}
