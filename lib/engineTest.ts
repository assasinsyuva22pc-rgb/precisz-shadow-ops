// Precisz Shadow-Ops: Phase 13 Automated Verification & Test Suite
import { calculateOEE, evaluateOperationalRisk } from "./analyticsEngine";
import { parseMachineCSV } from "./importIntegrations";
import { hasExecutionPrivilege } from "./authContext";

export function runFullTestSuite() {
  const results: { test: string; status: "PASSED" | "FAILED"; details: string }[] = [];

  // TEST 1: OEE Mathematical Consistency
  const oee = calculateOEE({
    plannedMinutes: 480,
    downtimeMinutes: 45,
    idealCycleTimeSec: 28,
    totalProduced: 820,
    rejectedPieces: 40,
  });
  const oeePassed = oee.availability > 85 && oee.oee > 70 && oee.quality > 90;
  results.push({
    test: "OEE Engine Mathematical Formula",
    status: oeePassed ? "PASSED" : "FAILED",
    details: `Availability: ${oee.availability}%, Quality: ${oee.quality}%, Plant OEE: ${oee.oee}%`,
  });

  // TEST 2: Cross-Correlation Risk Detection Trigger
  const risk = evaluateOperationalRisk({
    orderTargetQty: 1000,
    completedQty: 620,
    remainingHoursToDeadline: 6,
    activeLinePacePerHour: 50,
    downtimeMinutes: 45,
    scrapCount: 40,
    materialAvailableKg: 40,
    materialRequiredKg: 260,
  });
  const riskPassed = risk.riskPercentage >= 75 && risk.shortageSeverity === "CRITICAL";
  results.push({
    test: "Cross-Module Delivery Delay Risk Prediction",
    status: riskPassed ? "PASSED" : "FAILED",
    details: `Calculated Risk: ${risk.riskPercentage}%, Deficit: ${risk.deficitPieces} pcs, Delay: ${risk.projectedDelayHours}h`,
  });

  // TEST 3: RBAC Privilege Enforcement
  const opLeadCanExecute = hasExecutionPrivilege("OPERATIONS_LEAD");
  const lineSupCannotExecute = !hasExecutionPrivilege("LINE_SUPERVISOR");
  const rbacPassed = opLeadCanExecute && lineSupCannotExecute;
  results.push({
    test: "Role-Based Access Control (RBAC) Security Lock",
    status: rbacPassed ? "PASSED" : "FAILED",
    details: `Operations Lead Allowed: ${opLeadCanExecute} | Line Supervisor Denied: ${lineSupCannotExecute}`,
  });

  // TEST 4: CSV Schema Ingestion Validation
  const validCsv = `id,name,line,operator,status,efficiency,output\nCNC-99,Lathe 99,Line A,Test Op,Running,98.0,100 pcs`;
  const invalidCsv = `id,name,line\nCNC-99,Lathe 99,Line A`;
  const parsedValid = parseMachineCSV(validCsv);
  const parsedInvalid = parseMachineCSV(invalidCsv);
  const csvPassed = parsedValid.errors.length === 0 && parsedInvalid.errors.length > 0;
  results.push({
    test: "CSV Header & Type Validation Engine",
    status: csvPassed ? "PASSED" : "FAILED",
    details: `Valid Rows Passed: ${parsedValid.data.length} | Schema Faults Caught: ${parsedInvalid.errors.length}`,
  });

  return results;
}