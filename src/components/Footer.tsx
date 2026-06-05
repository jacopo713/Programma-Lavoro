import { APP_NAME } from "@/lib/constants";
import { LegalLinks } from "@/components/LegalLinks";

export function Footer() {
  return (
    <footer className="app-footer">
      <span>
        {APP_NAME}
      </span>
      <LegalLinks variant="footer" />
    </footer>
  );
}
