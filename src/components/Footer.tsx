import { APP_NAME } from "@/lib/constants";
import { LegalLinks } from "@/components/LegalLinks";

export function Footer() {
  return (
    <footer className="app-footer">
      <span>
        {APP_NAME} &middot; Checklist e PDF, uso generico
      </span>
      <LegalLinks variant="footer" />
    </footer>
  );
}
