// Precisz Shadow-Ops: Phase 9 Human Governance & Action Workflow Engine

export type WorkflowStatus = "PENDING_APPROVAL" | "EXECUTING" | "COMPLETED" | "REJECTED";

export interface FactoryIntervention {
  id: string;
  title: string;
  category: "LINE_REROUTE" | "SUPPLY_CHAIN" | "MAINTENANCE" | "QUALITY_HOLD";
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  status: WorkflowStatus;
  summary: string;
  impact: {
    estimatedCostInr: number;
    avoidedLossInr: number;
    recoveryTimeHrs: number;
    affectedLine: string;
    targetMachine: string;
  };
  safetyChecklist: string[];
  recommendedBy: string;
  createdAt: string;
}

export const INITIAL_INTERVENTIONS: FactoryIntervention[] = [
  {
    id: "ACT-OPT-901",
    title: "Overtime Authorization & Batch Reroute to CNC-02",
    category: "LINE_REROUTE",
    priority: "CRITICAL",
    status: "PENDING_APPROVAL",
    summary: "Compensate for CNC-03 downtime (45m) and 40 scrapped shafts to preserve Orion Systems Friday 17:00 dispatch deadline.",
    impact: {
      estimatedCostInr: 2400,
      avoidedLossInr: 25000,
      recoveryTimeHrs: 2.0,
      affectedLine: "Line B - Drive Shafts",
      targetMachine: "CNC Lathe #02"
    },
    safetyChecklist: [
      "Target machine (CNC-02) collet chuck verified for 25mm SS-304 stock",
      "Operator R. Suresh notified and overtime allowance confirmed (2 hrs)",
      "Hydraulic tool turret offsets cross-calibrated with CNC-03 program",
      "Line supervisor sign-off recorded"
    ],
    recommendedBy: "Shadow-Ops Autonomous Engine (Correlation Core)",
    createdAt: "12:55 PM"
  },
  {
    id: "ACT-SUP-902",
    title: "Emergency SS-304 Bar Stock Dispatch Escalation",
    category: "SUPPLY_CHAIN",
    priority: "HIGH",
    status: "PENDING_APPROVAL",
    summary: "Issue expedited courier PO to Madras Steel Stockholders for 260 kg SS-304 round bars with guaranteed morning arrival.",
    impact: {
      estimatedCostInr: 3500,
      avoidedLossInr: 45000,
      recoveryTimeHrs: 4.5,
      affectedLine: "Central Inventory Store",
      targetMachine: "Store Bay-3"
    },
    safetyChecklist: [
      "Vendor GST compliance and raw material test certificates (MTC) validated",
      "Procurement emergency fund authorization within budget",
      "Security gate pass pre-registered for overnight courier vehicle"
    ],
    recommendedBy: "Inventory Depletion Forecast Agent",
    createdAt: "12:50 PM"
  },
  {
    id: "ACT-MNT-903",
    title: "Tool Turret Insert Recalibration on CNC-01",
    category: "QUALITY_HOLD",
    priority: "MEDIUM",
    status: "COMPLETED",
    summary: "Replace worn carbide insert on Line A pinions to arrest surface finish drift before exceeding 2.0% scrap threshold.",
    impact: {
      estimatedCostInr: 850,
      avoidedLossInr: 8000,
      recoveryTimeHrs: 0.5,
      affectedLine: "Line A - Pinions",
      targetMachine: "CNC Lathe #01"
    },
    safetyChecklist: [
      "Spindle lockout/tagout (LOTO) procedure followed",
      "Trial cut piece inspected with digital micrometer"
    ],
    recommendedBy: "Quality Deviation Observer",
    createdAt: "11:30 AM"
  }
];