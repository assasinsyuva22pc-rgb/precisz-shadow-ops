export interface SystemAlert {
  id: string;
  tenantId: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  source: string;
  timestamp: string;
}

// Initial Tenant Data
export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: "ALT-01",
    tenantId: "ABC-AMB",
    title: "CNC Lathe #03 Spindle Thermal Trip",
    severity: "CRITICAL",
    status: "ACTIVE",
    source: "MANUALLY RECORDED",
    timestamp: "10:15 AM",
  },
  {
    id: "ALT-02",
    tenantId: "ABC-AMB",
    title: "SS304 Raw Material Reorder Point Breached",
    severity: "HIGH",
    status: "ACTIVE",
    source: "INVENTORY LOG",
    timestamp: "09:40 AM",
  },
  {
    id: "ALT-03",
    tenantId: "ABC-AMB",
    title: "Batch #B-883 Surface Roughness Tolerance > 2%",
    severity: "HIGH",
    status: "ACTIVE",
    source: "QA STATION 02",
    timestamp: "09:10 AM",
  },
];

// Returns ONLY unresolved alerts for the selected tenant
export function getActiveAlertsCount(alerts: SystemAlert[], tenantId: string): number {
  return alerts.filter((a) => a.tenantId === tenantId && a.status === "ACTIVE").length;
}