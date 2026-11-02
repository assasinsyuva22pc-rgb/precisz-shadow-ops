// Precisz Shadow-Ops: Deterministic Operations Engine (No Fake AI/Probabilities)

export interface MachineRecord {
  id: string;
  name: string;
  tenantId: string;
  status: "RUNNING" | "IDLE" | "MAINTENANCE" | "OFFLINE";
  downtimeMinutes: number;
  source: "MANUALLY RECORDED" | "SIMULATED SENSOR" | "DEMO DATASET";
  lastLogged: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  tenantId: string;
  targetQty: number;
  producedQty: number;
  rejectedQty: number;
  plannedDowntimeMinutes: number;
  deadlineHoursRemaining: number;
  materialAvailable: boolean;
}

export interface OperationalRiskEvaluation {
  orderNumber: string;
  riskScore: number; // 0 - 100 deterministic index
  riskLevel: "NORMAL" | "WATCH" | "HIGH" | "CRITICAL";
  isDeficit: boolean;
  deficitUnits: number;
  rejectionRatePercent: number;
  productionAchievementPercent: number;
  factors: {
    downtimeImpact: number;
    rejectionImpact: number;
    inventoryShortageImpact: number;
    scheduleCompressionImpact: number;
  };
  rootCauses: string[];
  recommendedAction: string;
}

// 1. Transparent KPI Calculator
export function calculateTenantKPIs(order: ProductionOrder, machines: MachineRecord[]) {
  const goodProduction = Math.max(0, order.producedQty - order.rejectedQty);
  const achievement = order.targetQty > 0 ? (goodProduction / order.targetQty) * 100 : 0;
  const inspectedUnits = order.producedQty;
  const rejectionRate = inspectedUnits > 0 ? (order.rejectedQty / inspectedUnits) * 100 : 0;
  const deficit = Math.max(0, order.targetQty - goodProduction);
  const totalDowntime = machines.reduce((sum, m) => sum + m.downtimeMinutes, 0);

  return {
    plannedTarget: order.targetQty,
    producedGood: goodProduction,
    rejectedUnits: order.rejectedQty,
    achievementPercent: Number(achievement.toFixed(1)),
    rejectionRatePercent: Number(rejectionRate.toFixed(1)),
    deficitUnits: deficit,
    totalDowntimeMinutes: totalDowntime,
  };
}

// 2. Transparent Rule-Based Risk Engine (Replacing Unsupported "92% Probability")
export function evaluateOrderCommitmentRisk(
  order: ProductionOrder,
  machines: MachineRecord[]
): OperationalRiskEvaluation {
  const kpis = calculateTenantKPIs(order, machines);
  const rootCauses: string[] = [];
  
  // Factor 1: Machine Downtime
  let downtimeImpact = 0;
  if (kpis.totalDowntimeMinutes > 30) {
    downtimeImpact = Math.min(30, (kpis.totalDowntimeMinutes / 60) * 20);
    rootCauses.push(`Machinery cumulative downtime at ${kpis.totalDowntimeMinutes} mins.`);
  }

  // Factor 2: Rejection Threshold (Tolerance: 2.0%)
  let rejectionImpact = 0;
  if (kpis.rejectionRatePercent > 2.0) {
    rejectionImpact = Math.min(30, (kpis.rejectionRatePercent - 2.0) * 10);
    rootCauses.push(`Rejection rate ${kpis.rejectionRatePercent}% breaches 2.0% customer tolerance.`);
  }

  // Factor 3: Inventory Shortage
  let inventoryShortageImpact = 0;
  if (!order.materialAvailable) {
    inventoryShortageImpact = 25;
    rootCauses.push("SS304 raw billet buffer stock insufficient for replacement batch.");
  }

  // Factor 4: Schedule / Output Deficit
  let scheduleImpact = 0;
  if (kpis.deficitUnits > 0 && order.deadlineHoursRemaining < 6) {
    scheduleImpact = 15;
    rootCauses.push(`Deficit of ${kpis.deficitUnits} units with only ${order.deadlineHoursRemaining}h before dispatch window.`);
  }

  // Deterministic Score out of 100
  const rawScore = Math.min(100, Math.round(downtimeImpact + rejectionImpact + inventoryShortageImpact + scheduleImpact));

  let riskLevel: OperationalRiskEvaluation["riskLevel"] = "NORMAL";
  if (rawScore >= 75) riskLevel = "CRITICAL";
  else if (rawScore >= 50) riskLevel = "HIGH";
  else if (rawScore >= 25) riskLevel = "WATCH";

  return {
    orderNumber: order.orderNumber,
    riskScore: rawScore,
    riskLevel,
    isDeficit: kpis.deficitUnits > 0,
    deficitUnits: kpis.deficitUnits,
    rejectionRatePercent: kpis.rejectionRatePercent,
    productionAchievementPercent: kpis.achievementPercent,
    factors: {
      downtimeImpact: Math.round(downtimeImpact),
      rejectionImpact: Math.round(rejectionImpact),
      inventoryShortageImpact,
      scheduleCompressionImpact: scheduleImpact,
    },
    rootCauses,
    recommendedAction:
      rawScore >= 75
        ? "Authorize Shift 2 CNC-04 reroute + allocate 120kg SS304 emergency buffer."
        : "Maintain standard shift cycle.",
  };
}