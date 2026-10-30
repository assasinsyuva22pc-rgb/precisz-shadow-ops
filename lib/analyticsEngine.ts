// Precisz Shadow-Ops: Phase 7 Autonomous Operational Intelligence Engine
// Mathematical models for OEE, Defect Cost, and Cross-Correlation Risk

export interface MachineMetrics {
  plannedMinutes: number;
  downtimeMinutes: number;
  idealCycleTimeSec: number; // in seconds per piece
  totalProduced: number;
  rejectedPieces: number;
}

export interface OEEBreakdown {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

/**
 * 1. Standard Factory OEE Formula (Availability x Performance x Quality)
 */
export function calculateOEE(metrics: MachineMetrics): OEEBreakdown {
  const operatingMinutes = Math.max(0, metrics.plannedMinutes - metrics.downtimeMinutes);

  // Availability = Operating Time / Planned Production Time
  const availability = metrics.plannedMinutes > 0 ? (operatingMinutes / metrics.plannedMinutes) * 100 : 0;

  // Performance = (Total Produced * Ideal Cycle Time in min) / Operating Time
  const idealOperatingMinutesNeeded = (metrics.totalProduced * metrics.idealCycleTimeSec) / 60;
  const performance = operatingMinutes > 0 
    ? Math.min(100, (idealOperatingMinutesNeeded / operatingMinutes) * 100) 
    : 0;

  // Quality = Good Parts / Total Produced
  const goodParts = Math.max(0, metrics.totalProduced - metrics.rejectedPieces);
  const quality = metrics.totalProduced > 0 ? (goodParts / metrics.totalProduced) * 100 : 0;

  // Total OEE
  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return {
    availability: Number(availability.toFixed(1)),
    performance: Number(performance.toFixed(1)),
    quality: Number(quality.toFixed(1)),
    oee: Number(oee.toFixed(1)),
  };
}

/**
 * 2. Scrap Financial Cost Calculation
 */
export function calculateScrapLoss(rejectedQty: number, unitMaterialCost: number, overheadMarkup: number = 1.15): number {
  return Math.round(rejectedQty * unitMaterialCost * overheadMarkup);
}

/**
 * 3. Cross-Module Delivery Delay Risk Prediction
 * Correlates Machine Loss + Scrap Loss + Material Deficit against Delivery Commitment
 */
export interface CrossCorrelationInputs {
  orderTargetQty: number;
  completedQty: number;
  remainingHoursToDeadline: number;
  activeLinePacePerHour: number;
  downtimeMinutes: number;
  scrapCount: number;
  materialAvailableKg: number;
  materialRequiredKg: number;
}

export interface CorrelationResult {
  riskPercentage: number;
  deficitPieces: number;
  shortageSeverity: "LOW" | "ELEVATED" | "CRITICAL";
  projectedDelayHours: number;
  recoveryOvertimeHoursNeeded: number;
  recoveryCostInr: number;
}

export function evaluateOperationalRisk(inputs: CrossCorrelationInputs): CorrelationResult {
  const remainingPiecesNeeded = inputs.orderTargetQty - inputs.completedQty;
  
  // Normal achievable output with remaining working hours
  const projectedNormalOutput = inputs.remainingHoursToDeadline * inputs.activeLinePacePerHour;
  
  // Losses introduced by downtime (in terms of pieces)
  const downtimePieceLoss = (inputs.downtimeMinutes / 60) * inputs.activeLinePacePerHour;
  
  // Total Deficit considering current deficit, scrap replacement, and downtime loss
  const totalDeficit = remainingPiecesNeeded + inputs.scrapCount - projectedNormalOutput;

  let risk = 0;
  let severity: "LOW" | "ELEVATED" | "CRITICAL" = "LOW";

  if (totalDeficit <= 0) {
    risk = 8; // Baseline operational buffer risk
    severity = "LOW";
  } else {
    // If deficit exists, calculate risk percentage
    const baseRisk = (totalDeficit / inputs.orderTargetQty) * 100;
    
    // Additional risk multiplier if raw material is deficient
    const materialShortage = Math.max(0, inputs.materialRequiredKg - inputs.materialAvailableKg);
    const materialPenalty = materialShortage > 0 ? 25 : 0;
    
    risk = Math.min(96, Math.round(baseRisk + materialPenalty + 40));
    severity = risk > 75 ? "CRITICAL" : "ELEVATED";
  }

  // Calculate required recovery intervention
  const overtimeHoursNeeded = Math.ceil(Math.max(0, totalDeficit) / inputs.activeLinePacePerHour);
  const projectedDelay = totalDeficit > 0 ? Number((totalDeficit / inputs.activeLinePacePerHour).toFixed(1)) : 0;
  const recoveryCost = overtimeHoursNeeded * 1200; // ₹1,200/hr (overtime labor + machine power)

  return {
    riskPercentage: risk,
    deficitPieces: Math.max(0, Math.round(totalDeficit)),
    shortageSeverity: severity,
    projectedDelayHours: projectedDelay,
    recoveryOvertimeHoursNeeded: overtimeHoursNeeded,
    recoveryCostInr: recoveryCost,
  };
}