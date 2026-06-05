import { DashboardLayout } from "@/components/DashboardLayout";

export default function DashboardLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
