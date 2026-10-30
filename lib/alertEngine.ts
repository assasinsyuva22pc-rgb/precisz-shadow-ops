// Precisz Shadow-Ops: Phase 8 Autonomous Risk Detection & Alert Engine
// Correlates operational events across Machine lines, Stock depletion, and Customer deadlines

export type AlertSeverity = "CRITICAL" | "WARNING" | "NOTICE";

export interface FactoryAlert {
  id: string;
  category: "EQUIPMENT" | "INVENTORY" | "QUALITY" | "CROSS_MODULE";
  severity: AlertSeverity;
  title: string;
  description: string;
  impactMetrics: string;
  recommendedAction: string;
  timestamp: string;
  isRead: boolean;
}

export interface FactoryStateInput {
  downtimeMinutes: number;
  brokenMachineId: string;
  scrapPercentage: number;
  availableMaterialKg: number;
  requiredMaterialKg: number;
  customerOrderDueHours: number;
  orderNumber: string;
  customerName: string;
}

export function runRiskDetectionEngine(state: FactoryStateInput): FactoryAlert[] {
  const alerts: FactoryAlert[] = [];

  // 1. Cross-Module Delivery Deadline Critical Risk
  if (state.downtimeMinutes > 30 && state.availableMaterialKg < state.requiredMaterialKg) {
    alerts.push({
      id: "ALT-RISK-01",
      category: "CROSS_MODULE",
      severity: "CRITICAL",
      title: "Imminent Shipment Delay Risk (92%)",
      description: `${state.brokenMachineId} offline (${state.downtimeMinutes}m) + ${state.requiredMaterialKg - state.availableMaterialKg}kg raw material deficit puts Order #${state.orderNumber} for ${state.customerName} in critical delay risk.`,
      impactMetrics: "Penalties: ₹25,000 | Est. Delay: 2.2 hrs",
      recommendedAction: "Authorize emergency overtime on Line A (CNC Lathe #02) and expedite logistics callback.",
      timestamp: "10 mins ago",
      isRead: false,
    });
  }

  // 2. Equipment Breakdown Severity Warning
  if (state.downtimeMinutes > 0) {
    alerts.push({
      id: "ALT-MACH-02",
      category: "EQUIPMENT",
      severity: "CRITICAL",
      title: `${state.brokenMachineId} Spindle Pressure Failure`,
      description: "Hydraulic pressure dropped below 45 bar on chuck clamp engagement. Machine locked out by maintenance PLC.",
      impactMetrics: "85 units behind planned shift pace",
      recommendedAction: "Replace secondary valve O-ring kit. Maintenance lead Selvam on site.",
      timestamp: "28 mins ago",
      isRead: false,
    });
  }

  // 3. Raw Material Shortage Alert
  if (state.availableMaterialKg < state.requiredMaterialKg) {
    alerts.push({
      id: "ALT-MAT-03",
      category: "INVENTORY",
      severity: "WARNING",
      title: "Raw Material Buffer Breach: SS-304 Round Bar",
      description: `Only ${state.availableMaterialKg} kg remaining in ready storage. Shift requirement is ${state.requiredMaterialKg} kg. Supplier dispatch delayed in transit.`,
      impactMetrics: "Line stoppage in ~3.5 hours",
      recommendedAction: "Dispatch local Ambattur backup runner or reassign material batch from TVS Pinion buffer.",
      timestamp: "45 mins ago",
      isRead: false,
    });
  }

  // 4. Quality Tolerance Drift
  if (state.scrapPercentage > 2.0) {
    alerts.push({
      id: "ALT-QUAL-04",
      category: "QUALITY",
      severity: "NOTICE",
      title: `Scrap Rate Above Limit (${state.scrapPercentage}%)`,
      description: "Surface finish roughness on Drive Shaft OD batch exceeding DIN ISO 1302 tolerance.",
      impactMetrics: "Scrap Loss: ₹12,600 (40 pieces)",
      recommendedAction: "Inspect insert wear on tool turret station #04.",
      timestamp: "1 hr ago",
      isRead: true,
    });
  }

  return alerts;
}