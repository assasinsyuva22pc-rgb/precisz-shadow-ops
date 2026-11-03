"use client";

import React, { useState, useMemo } from "react";

// ==========================================
// 1. DATA TYPES & DETERMINISTIC INTERFACES
// ==========================================
export type TabType =
  | "COMMAND"
  | "PRODUCTION"
  | "INVENTORY"
  | "QUALITY"
  | "ORDERS"
  | "GOVERNANCE";

export interface MachineRecord {
  id: string;
  name: string;
  cell: string;
  status: "RUNNING" | "MAINTENANCE" | "IDLE" | "OFFLINE";
  downtimeMinutes: number;
  temperatureC: number;
  vibrationMmS: number;
  source: "MANUALLY RECORDED" | "SIMULATED SENSOR" | "DEMO DATASET";
  lastLogged: string;
}

export interface MaterialItem {
  id: string;
  sku: string;
  grade: string;
  lot: string;
  availableKg: number;
  allocatedKg: number;
  reorderKg: number;
  unitCost: number;
  status: "OPTIMAL" | "LOW_STOCK" | "CRITICAL_DEFICIT";
}

export interface QualityDefect {
  id: string;
  defectType: string;
  machineId: string;
  count: number;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  scrapCostInr: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  client: string;
  destination: string;
  partName: string;
  targetUnits: number;
  completedUnits: number;
  rejectedUnits: number;
  deadlineHours: number;
  status: "ON_TRACK" | "AT_RISK" | "DISPATCH_READY";
}

export interface GovernanceAuditRecord {
  id: string;
  timestamp: string;
  action: string;
  authorizedBy: string;
  role: string;
  status: "APPROVED" | "EXECUTED" | "REJECTED";
  impactSummary: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  module: "PRODUCTION" | "QUALITY" | "INVENTORY" | "EQUIPMENT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "RESOLVED";
  impactScore: number;
  source: string;
  timestamp: string;
}

// ==========================================
// 2. INITIAL SEED DATA (Tenant: ABC-AMB)
// ==========================================
const INITIAL_MACHINES: MachineRecord[] = [
  {
    id: "MCH-01",
    name: "CNC Lathe #03",
    cell: "Machining Cell A",
    status: "MAINTENANCE",
    downtimeMinutes: 45,
    temperatureC: 68.4,
    vibrationMmS: 4.8,
    source: "MANUALLY RECORDED",
    lastLogged: "10:15 AM",
  },
  {
    id: "MCH-02",
    name: "VMC Milling #01",
    cell: "Milling Cell B",
    status: "RUNNING",
    downtimeMinutes: 0,
    temperatureC: 44.1,
    vibrationMmS: 1.2,
    source: "SIMULATED SENSOR",
    lastLogged: "10:48 AM",
  },
  {
    id: "MCH-03",
    name: "Surface Grinder #02",
    cell: "Finishing Cell",
    status: "IDLE",
    downtimeMinutes: 15,
    temperatureC: 38.0,
    vibrationMmS: 0.8,
    source: "DEMO DATASET",
    lastLogged: "10:30 AM",
  },
  {
    id: "MCH-04",
    name: "CNC Lathe #04 (Standby)",
    cell: "Machining Cell A",
    status: "RUNNING",
    downtimeMinutes: 0,
    temperatureC: 42.5,
    vibrationMmS: 1.1,
    source: "SIMULATED SENSOR",
    lastLogged: "10:50 AM",
  },
];

const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: "MAT-01",
    sku: "SS304-BAR-50MM",
    grade: "SS304 Austenitic Stainless",
    lot: "LOT-SS-2026-88",
    availableKg: 140,
    allocatedKg: 200,
    reorderKg: 250,
    unitCost: 280,
    status: "CRITICAL_DEFICIT",
  },
  {
    id: "MAT-02",
    sku: "EN8-ROD-40MM",
    grade: "EN8 Carbon Construction Steel",
    lot: "LOT-EN-2026-12",
    availableKg: 820,
    allocatedKg: 400,
    reorderKg: 300,
    unitCost: 95,
    status: "OPTIMAL",
  },
  {
    id: "MAT-03",
    sku: "AL6061-BILLET-75MM",
    grade: "Aluminium 6061-T6 Aircraft Grade",
    lot: "LOT-AL-2026-05",
    availableKg: 450,
    allocatedKg: 300,
    reorderKg: 200,
    unitCost: 310,
    status: "OPTIMAL",
  },
];

const INITIAL_DEFECTS: QualityDefect[] = [
  {
    id: "DEF-01",
    defectType: "Surface Roughness Breach (Ra > 1.6µm)",
    machineId: "CNC Lathe #03",
    count: 28,
    severity: "CRITICAL",
    scrapCostInr: 6720,
  },
  {
    id: "DEF-02",
    defectType: "Concentricity Fluctuation (> 0.02mm)",
    machineId: "CNC Lathe #03",
    count: 12,
    severity: "MAJOR",
    scrapCostInr: 2880,
  },
];

const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: "ORD-904",
    poNumber: "ORD-2026-904",
    client: "Hyundai Tier-1 (Sriperumbudur)",
    destination: "Sriperumbudur Hub",
    partName: "Precision Spline Shaft (SS304)",
    targetUnits: 1000,
    completedUnits: 820,
    rejectedUnits: 40,
    deadlineHours: 4,
    status: "AT_RISK",
  },
  {
    id: "ORD-912",
    poNumber: "ORD-2026-912",
    client: "Royal Enfield (Vallam Vadagal)",
    destination: "Oragadam Assembly",
    partName: "Handlebar Clamp Billet (EN8)",
    targetUnits: 500,
    completedUnits: 500,
    rejectedUnits: 8,
    deadlineHours: 24,
    status: "DISPATCH_READY",
  },
];

const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: "ALT-01",
    title: "CNC Lathe #03 Spindle Thermal Excursion (45m Loss)",
    module: "EQUIPMENT",
    severity: "CRITICAL",
    status: "ACTIVE",
    impactScore: 35,
    source: "MANUALLY RECORDED BY SHOPFLOOR LEAD",
    timestamp: "10:15 AM",
  },
  {
    id: "ALT-02",
    title: "SS304 Raw Material Reorder Point Breached (-60kg Net)",
    module: "INVENTORY",
    severity: "HIGH",
    status: "ACTIVE",
    impactScore: 28,
    source: "WAREHOUSE DISPATCH LEDGER",
    timestamp: "09:40 AM",
  },
  {
    id: "ALT-03",
    title: "First-Pass Rejection 4.9% Breaches 2.0% Customer Tolerance",
    module: "QUALITY",
    severity: "HIGH",
    status: "ACTIVE",
    impactScore: 26,
    source: "INLINE QA SAMPLING STATION 02",
    timestamp: "09:10 AM",
  },
];

const INITIAL_AUDIT_LOG: GovernanceAuditRecord[] = [
  {
    id: "AUD-101",
    timestamp: "08:15 AM",
    action: "Shift 01 Telemetry Calibration Check",
    authorizedBy: "Yuvaraj V",
    role: "OPERATIONS_LEAD",
    status: "APPROVED",
    impactSummary: "Calibrated 4 machining cells before line startup.",
  },
];

// ==========================================
// 3. MAIN PRODUCT APPLICATION
// ==========================================
export default function PreciszShadowOpsEnterprise() {
  const [activeTab, setActiveTab] = useState<TabType>("COMMAND");
  const [activeShift] = useState("General Shift (08:00 - 17:00)");
  const [tenantCode] = useState("ABC Precision Components (Ambattur, Chennai)");

  // Interactive Live State
  const [machines, setMachines] = useState<MachineRecord[]>(INITIAL_MACHINES);
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [defects, setDefects] = useState<QualityDefect[]>(INITIAL_DEFECTS);
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_ORDERS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [auditLog, setAuditLog] = useState<GovernanceAuditRecord[]>(INITIAL_AUDIT_LOG);

  // Modals & Sliders
  const [showRecoveryPlanModal, setShowRecoveryPlanModal] = useState(false);
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false);
  const [recoveryExecuted, setRecoveryExecuted] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  // Copilot Input
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotHistory, setCopilotHistory] = useState([
    {
      role: "assistant",
      text: "System grounded to Ambattur Plant telemetry. Ask for root causes, shift deficit formulas, or batch recalculations.",
    },
  ]);

  // ==========================================
  // 4. MATHEMATICAL KPI ENGINE (DETERMINISTIC)
  // ==========================================
  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === "ACTIVE"), [alerts]);

  const kpis = useMemo(() => {
    const primaryOrder = orders[0];
    const goodUnits = primaryOrder.completedUnits - primaryOrder.rejectedUnits;
    const achievementPercent = ((goodUnits / primaryOrder.targetUnits) * 100).toFixed(1);
    const rejectionRate = ((primaryOrder.rejectedUnits / primaryOrder.completedUnits) * 100).toFixed(1);
    const deficitUnits = Math.max(0, primaryOrder.targetUnits - goodUnits);
    const totalDowntimeMinutes = machines.reduce((acc, m) => acc + m.downtimeMinutes, 0);
    const totalScrapCostInr = defects.reduce((acc, d) => acc + d.scrapCostInr, 0);

    return {
      goodUnits,
      targetUnits: primaryOrder.targetUnits,
      achievementPercent: Number(achievementPercent),
      rejectionRate: Number(rejectionRate),
      rejectedUnits: primaryOrder.rejectedUnits,
      deficitUnits,
      totalDowntimeMinutes,
      totalScrapCostInr,
    };
  }, [orders, machines, defects]);

  // Deterministic Risk Score
  const riskEngine = useMemo(() => {
    let score = 0;
    const factors: { name: string; weight: number; formula: string }[] = [];

    if (kpis.totalDowntimeMinutes > 30) {
      const pts = Math.min(35, Math.round((kpis.totalDowntimeMinutes / 60) * 35));
      score += pts;
      factors.push({
        name: "Machinery Cumulative Downtime",
        weight: pts,
        formula: `${kpis.totalDowntimeMinutes} min recorded > 30 min threshold`,
      });
    }

    if (kpis.rejectionRate > 2.0) {
      const pts = Math.min(30, Math.round((kpis.rejectionRate - 2.0) * 10));
      score += pts;
      factors.push({
        name: "Quality Tolerance Breach",
        weight: pts,
        formula: `${kpis.rejectionRate}% rejection exceeds 2.0% contractual limit`,
      });
    }

    const ss304 = materials.find((m) => m.sku.includes("SS304"));
    if (ss304 && ss304.availableKg < ss304.allocatedKg) {
      const pts = 25;
      score += pts;
      factors.push({
        name: "Raw Material Buffer Deficit",
        weight: pts,
        formula: `${ss304.availableKg}kg available vs ${ss304.allocatedKg}kg reserved (-60kg net)`,
      });
    }

    const finalScore = Math.min(100, Math.max(0, score));
    let classification: "CRITICAL" | "HIGH" | "WATCH" | "NORMAL" = "NORMAL";
    if (finalScore >= 75) classification = "CRITICAL";
    else if (finalScore >= 50) classification = "HIGH";
    else if (finalScore >= 25) classification = "WATCH";

    return {
      score: finalScore,
      classification,
      factors,
    };
  }, [kpis, materials]);

  // ==========================================
  // 5. SHIFT COMPLIANCE REPORT EXPORTER (CSV)
  // ==========================================
  const handleExportComplianceReport = () => {
    const reportTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const csvRows = [
      ["PRECISZ SHADOW-OPS - SHIFT COMPLIANCE & AUDIT REPORT"],
      ["Tenant", tenantCode],
      ["Shift Window", activeShift],
      ["Export Timestamp", new Date().toLocaleString()],
      ["Lead Sign-off", "Yuvaraj V (OPERATIONS_LEAD)"],
      ["Environment", "Deterministic Operations Intelligence Model"],
      [],
      ["--- SECTION 1: SHIFT PERFORMANCE & KPI REGISTER ---"],
      ["Metric", "Value", "Baseline / Limit", "Status"],
      ["Planned Target", `${kpis.targetUnits} pcs`, "1000 pcs", "Fixed Target"],
      ["Good Completed Production", `${kpis.goodUnits} pcs`, "-", "Active Run"],
      ["Achievement Percentage", `${kpis.achievementPercent}%`, "100.0%", kpis.achievementPercent >= 80 ? "ON PACE" : "BEHIND"],
      ["First-Pass Rejection Rate", `${kpis.rejectionRate}%`, "Max 2.0%", kpis.rejectionRate > 2.0 ? "CONTRACT BREACH" : "NORMAL"],
      ["Total Shift Machine Downtime", `${kpis.totalDowntimeMinutes} mins`, "< 30 mins", kpis.totalDowntimeMinutes > 30 ? "CRITICAL LOSS" : "OPTIMAL"],
      ["Calculated Scrap Valuation Loss", `INR ${kpis.totalScrapCostInr}`, "INR 0", "Direct Loss"],
      ["Order Commitment Risk Index", `${riskEngine.score} / 100`, "< 25 / 100", riskEngine.classification],
      [],
      ["--- SECTION 2: ACTIVE & RECORDED ALERTS ---"],
      ["Alert ID", "Module", "Title", "Source", "Severity", "Status"],
      ...alerts.map((a) => [a.id, a.module, `"${a.title.replace(/"/g, '""')}"`, a.source, a.severity, a.status]),
      [],
      ["--- SECTION 3: IMMUTABLE AUDIT LOG & AUTHORIZATIONS ---"],
      ["Log ID", "Timestamp", "Operational Directive", "Impact Summary", "Authorized By", "Role", "Status"],
      ...auditLog.map((log) => [
        log.id,
        log.timestamp,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.impactSummary.replace(/"/g, '""')}"`,
        log.authorizedBy,
        log.role,
        log.status,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Precisz_Shift_Compliance_Report_${reportTimestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  // ==========================================
  // 6. INTERACTIVE ACTIONS
  // ==========================================
  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "RESOLVED" } : a))
    );
  };

  const handleExecuteRecoveryAction = () => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === "MCH-01" ? { ...m, status: "RUNNING", downtimeMinutes: 0 } : m
      )
    );

    setMaterials((prev) =>
      prev.map((mat) =>
        mat.sku.includes("SS304") ? { ...mat, availableKg: 320, status: "OPTIMAL" } : mat
      )
    );

    setAlerts((prev) => prev.map((a) => ({ ...a, status: "RESOLVED" })));
    setOrders((prev) =>
      prev.map((o) => (o.id === "ORD-904" ? { ...o, status: "ON_TRACK" } : o))
    );

    const newAudit: GovernanceAuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      action: "Executed Shift-2 Reroute & SS304 Emergency Stock Allocation",
      authorizedBy: "Yuvaraj V",
      role: "OPERATIONS_LEAD",
      status: "EXECUTED",
      impactSummary: "Allocated 180kg SS304 buffer, cleared Lathe #03 downtime, eliminated deficit risk.",
    };
    setAuditLog((prev) => [newAudit, ...prev]);

    setRecoveryExecuted(true);
    setShowRecoveryPlanModal(false);
  };

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;

    const userText = copilotQuery;
    setCopilotHistory((prev) => [...prev, { role: "user", text: userText }]);
    setCopilotQuery("");

    setTimeout(() => {
      let response = `Telemetry answer for "${userText}": `;
      if (userText.toLowerCase().includes("downtime") || userText.toLowerCase().includes("lathe")) {
        response += `CNC Lathe #03 has ${kpis.totalDowntimeMinutes}m cumulative loss recorded. Standby CNC Lathe #04 is available with 0m loss for reroute.`;
      } else if (userText.toLowerCase().includes("report") || userText.toLowerCase().includes("export")) {
        response += `Shift compliance report includes full CSV registers of 3 audit modules, machine health logs, and lead sign-offs.`;
      } else {
        response += `Current Good output is ${kpis.goodUnits} pcs with rule risk index of ${riskEngine.score}/100. Recovery action is ready in Governance tab.`;
      }
      setCopilotHistory((prev) => [...prev, { role: "assistant", text: response }]);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col font-sans selection:bg-orange-600/30">
      {/* Audit Banner */}
      <div className="bg-[#0D141F] border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono uppercase text-[11px] tracking-wider text-slate-300">
            INDUSTRIAL AUDIT ENVIRONMENT: <strong className="text-white">DETERMINISTIC OPERATIONS DEMO</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-400">
            TELEMETRY ORIGIN: <strong className="text-slate-200">SHOPFLOOR EDGE LOGS + DEMO DATASET</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">
            LAST DETERMINISTIC CYCLE: 10:48 AM IST (SYNC VALIDATED)
          </span>
        </div>
      </div>

      {/* App Header */}
      <header className="border-b border-slate-800 bg-[#0B1017]/90 backdrop-blur sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-orange-600 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter shadow-lg shadow-orange-600/20">
              PS
            </div>
            <div>
              <div className="text-base font-bold tracking-wide text-white flex items-center gap-2">
                Precisz <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-normal">Enterprise v1.2</span>
              </div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 -mt-0.5">
                Shadow-Ops Intelligence
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Module Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {[
              { id: "COMMAND", label: "Command Center" },
              { id: "PRODUCTION", label: "Production Intel" },
              { id: "INVENTORY", label: "Inventory & Materials" },
              { id: "QUALITY", label: "Quality & Wastage" },
              { id: "ORDERS", label: "Orders & Dispatches" },
              { id: "GOVERNANCE", label: "Governance & Audit" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tenant Switcher & User Profile */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{tenantCode}</div>
            <div className="text-[10px] text-slate-500 font-mono">Shift: {activeShift}</div>
          </div>

          <button
            onClick={() => setShowCopilotDrawer(true)}
            className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-800 hover:bg-cyan-900/50 text-cyan-300 rounded-md text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>🤖</span> Telemetry Copilot
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
              YU
            </div>
            <div className="text-left text-[11px] leading-tight">
              <div className="font-semibold text-slate-200">Yuvaraj V</div>
              <div className="text-slate-500 text-[10px] font-mono">OPERATIONS_LEAD</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* TAB 1: COMMAND CENTER */}
        {activeTab === "COMMAND" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                  Factory Command Center
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    Live Shift Monitor
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time deterministic telemetry, machine health, and commitment risk ledger.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRecoveryPlanModal(true)}
                  className={`px-3 py-1.5 rounded text-xs font-mono border transition-all flex items-center gap-2 cursor-pointer ${
                    activeAlerts.length > 0
                      ? "bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/50 shadow-lg shadow-rose-950/30"
                      : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  }`}
                >
                  <span>{activeAlerts.length > 0 ? "⚠️" : "✓"}</span>
                  <span>View {activeAlerts.length} Active System Risks</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs uppercase text-slate-400 font-mono">
                  <span>Production Target</span>
                  <span className="text-slate-500 text-[10px]">[Good / Planned]</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {kpis.goodUnits} <span className="text-xs font-normal text-slate-400">/ {kpis.targetUnits} pcs</span>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Achievement: <strong className="text-slate-200">{kpis.achievementPercent}%</strong></span>
                  <span className="text-amber-400 font-mono">Pace: 88%</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs uppercase text-slate-400 font-mono">
                  <span>First-Pass Rejection</span>
                  <span className="text-slate-500 text-[10px]">[Scrap / Output]</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1 flex items-baseline gap-2">
                  {kpis.rejectionRate}%
                  <span className="text-xs text-rose-400 font-mono">
                    ({kpis.rejectedUnits} units scrap)
                  </span>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Contract Tolerance: 2.0%</span>
                  <span className="text-rose-400 font-mono font-bold">+2.9% BREACH</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs uppercase text-slate-400 font-mono">
                  <span>Shift Downtime</span>
                  <span className="text-slate-500 text-[10px]">[Loss Mins]</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1 flex items-baseline gap-2">
                  {kpis.totalDowntimeMinutes} <span className="text-xs font-normal text-slate-400">minutes</span>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Primary: CNC Lathe #03</span>
                  <span className="text-rose-400 font-mono">45m LOSS</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs uppercase text-slate-400 font-mono">
                  <span>Shift Deficit</span>
                  <span className="text-slate-500 text-[10px]">[PO-904 Gap]</span>
                </div>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  {kpis.deficitUnits} <span className="text-xs font-normal text-slate-400">pcs pending</span>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Dispatch Window</span>
                  <span className="text-amber-400 font-mono">4.0 Hours Left</span>
                </div>
              </div>
            </div>

            {/* Risk Box */}
            <div className="p-5 bg-[#0C121C] border border-slate-800 rounded-lg shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2">
                    <span>Order Commitment Risk Evaluation Engine</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      Rule-Based Scoring Model
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    PO #ORD-2026-904 Fulfillment Viability
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                    riskEngine.classification === "CRITICAL"
                      ? "bg-rose-950/60 text-rose-400 border-rose-800"
                      : "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                  }`}
                >
                  {riskEngine.classification} RISK (Index: {riskEngine.score}/100)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 font-mono">
                    Deterministic Score Contributions:
                  </div>
                  <div className="space-y-2">
                    {riskEngine.factors.map((f, i) => (
                      <div key={i} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded flex justify-between items-center text-xs">
                        <div>
                          <div className="font-semibold text-slate-200">{f.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{f.formula}</div>
                        </div>
                        <span className="font-mono text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950/50 border border-rose-900/60">
                          +{f.weight} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-cyan-400 font-mono uppercase tracking-wide">
                      Prescriptive Operational Directive
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {recoveryExecuted
                        ? "✓ Action Authorized: Workload diverted to Standby Lathe #04. 180kg SS304 buffer unlocked. Shift output will hit 1,000 units on schedule."
                        : "Immediate machine bottleneck on CNC-03 combined with 40 units scrap requires diverting 110 units to Standby CNC-04 and releasing 60kg SS304 buffer stock."}
                    </p>
                  </div>

                  {!recoveryExecuted && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Requires Operations Lead Sign-off</span>
                      <button
                        onClick={() => setShowRecoveryPlanModal(true)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold text-xs rounded transition cursor-pointer"
                      >
                        Review & Authorize Action
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Machinery Table */}
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Tenant Machinery & Telemetry Ledger</h3>
                <span className="text-[11px] font-mono text-slate-500">Unit: Ambattur (ABC-AMB)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="py-2.5 px-3">Workstation Name</th>
                      <th className="py-2.5 px-3">Cell</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Recorded Downtime</th>
                      <th className="py-2.5 px-3">Spindle Temp</th>
                      <th className="py-2.5 px-3">Data Origin</th>
                      <th className="py-2.5 px-3">Last Logged</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {machines.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-white">{m.name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{m.cell}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === "RUNNING"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : m.status === "MAINTENANCE"
                                ? "bg-rose-950 text-rose-400 border border-rose-800"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {m.downtimeMinutes > 0 ? (
                            <span className="text-rose-400 font-bold">{m.downtimeMinutes} mins</span>
                          ) : (
                            <span className="text-slate-500">0 mins</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{m.temperatureC} °C</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
                            {m.source}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{m.lastLogged}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setMachines((prev) =>
                                prev.map((item) =>
                                  item.id === m.id
                                    ? {
                                        ...item,
                                        downtimeMinutes: item.downtimeMinutes > 0 ? 0 : 30,
                                        status: item.downtimeMinutes > 0 ? "RUNNING" : "MAINTENANCE",
                                      }
                                    : item
                                )
                              );
                            }}
                            className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            Toggle Downtime
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTION INTEL */}
        {activeTab === "PRODUCTION" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Production Intelligence & Takt Metrics</h1>
                <p className="text-xs text-slate-400 mt-0.5">Cell-level throughput analysis, run-rates, and machine bottleneck breakdown.</p>
              </div>
              <div className="text-xs font-mono text-cyan-400">Target Takt Time: 45.0s / unit</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono uppercase">Average Cycle Time</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">42.8 seconds</div>
                <div className="text-xs text-slate-500 mt-1">5.2% faster than nominal standard</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono uppercase">Spindle Efficiency (OEE)</div>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">79.4%</div>
                <div className="text-xs text-slate-500 mt-1">Affected by Lathe #03 downtime</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono uppercase">Hourly Run Rate</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">102 pcs/hr</div>
                <div className="text-xs text-slate-500 mt-1">Required: 125 pcs/hr</div>
              </div>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-lg">
              <h3 className="text-sm font-bold text-white mb-3">Live Workstation Production Logs</h3>
              <div className="space-y-3 font-mono text-xs">
                {machines.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{m.name} • {m.cell}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Source: {m.source} • Temp: {m.temperatureC}°C • Vib: {m.vibrationMmS} mm/s</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${m.status === "RUNNING" ? "text-emerald-400" : "text-rose-400"}`}>
                        {m.status}
                      </div>
                      <div className="text-[11px] text-slate-400">{m.downtimeMinutes} min loss</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === "INVENTORY" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Inventory & Raw Material Traceability</h1>
                <p className="text-xs text-slate-400 mt-0.5">Billet batches, reserved allocations, and safety threshold ledger.</p>
              </div>
              <button
                onClick={() => {
                  setMaterials((prev) =>
                    prev.map((m) => (m.sku.includes("SS304") ? { ...m, availableKg: m.availableKg + 100 } : m))
                  );
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 rounded border border-slate-700 cursor-pointer"
              >
                + Simulate Inward GRN (+100kg SS304)
              </button>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-3">Item SKU</th>
                    <th className="py-2.5 px-3">Material Grade</th>
                    <th className="py-2.5 px-3">Lot Number</th>
                    <th className="py-2.5 px-3">Available Stock</th>
                    <th className="py-2.5 px-3">Reserved Stock</th>
                    <th className="py-2.5 px-3">Unit Valuation</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-semibold text-cyan-400">{mat.sku}</td>
                      <td className="py-3 px-3 text-slate-300">{mat.grade}</td>
                      <td className="py-3 px-3 text-slate-400">{mat.lot}</td>
                      <td className="py-3 px-3 font-bold text-white">{mat.availableKg} kg</td>
                      <td className="py-3 px-3 text-slate-400">{mat.allocatedKg} kg</td>
                      <td className="py-3 px-3 text-slate-300">₹ {mat.unitCost} /kg</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            mat.availableKg < mat.allocatedKg
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : "bg-emerald-950 text-emerald-300 border-emerald-800"
                          }`}
                        >
                          {mat.availableKg < mat.allocatedKg ? "SHORTAGE ALERT" : "OPTIMAL BUFFER"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: QUALITY */}
        {activeTab === "QUALITY" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl font-bold tracking-tight text-white">Quality Verification & Scrap Analytics</h1>
              <p className="text-xs text-slate-400 mt-0.5">First-pass inspection results, scrap costs, and CMM dimensional logs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono uppercase">Inspected Units</div>
                <div className="text-2xl font-bold font-mono text-white mt-1">820 pcs</div>
                <div className="text-xs text-slate-500 mt-1">100% inline sampling</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono uppercase">Rejection Percentage</div>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">4.9%</div>
                <div className="text-xs text-slate-500 mt-1">Threshold: 2.0% (Breach: +2.9%)</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono uppercase">Total Scrap Cost Loss</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  ₹ {kpis.totalScrapCostInr.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-slate-500 mt-1">Direct material + machining cost</div>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
              <h3 className="text-sm font-bold text-white mb-3">Defect Log Register</h3>
              <div className="space-y-2.5 text-xs font-mono">
                {defects.map((def) => (
                  <div key={def.id} className="p-3 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{def.defectType}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Origin: {def.machineId} • Severity: {def.severity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-400">{def.count} units</div>
                      <div className="text-[10px] text-slate-400">Scrap cost: ₹ {def.scrapCostInr}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS */}
        {activeTab === "ORDERS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl font-bold tracking-tight text-white">Purchase Orders & Dispatch Fulfillment</h1>
              <p className="text-xs text-slate-400 mt-0.5">Client shipment windows, verified batches, and delivery commitments.</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Client Destination</th>
                    <th className="py-2.5 px-3">Part Description</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Good Packed</th>
                    <th className="py-2.5 px-3">Deficit</th>
                    <th className="py-2.5 px-3">Dispatch Window</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {orders.map((ord) => {
                    const good = ord.completedUnits - ord.rejectedUnits;
                    const deficit = Math.max(0, ord.targetUnits - good);
                    return (
                      <tr key={ord.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-cyan-400">{ord.poNumber}</td>
                        <td className="py-3 px-3 text-slate-300">{ord.client}</td>
                        <td className="py-3 px-3 text-slate-400">{ord.partName}</td>
                        <td className="py-3 px-3 text-white">{ord.targetUnits} pcs</td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">{good} pcs</td>
                        <td className="py-3 px-3 font-bold text-rose-400">{deficit} pcs</td>
                        <td className="py-3 px-3 text-amber-300">{ord.deadlineHours} Hours Left</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              ord.status === "AT_RISK"
                                ? "bg-rose-950 text-rose-300 border-rose-800"
                                : "bg-emerald-950 text-emerald-300 border-emerald-800"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: GOVERNANCE & AUDIT TRAIL (WITH EXPORT COMPLIANCE REPORT) */}
        {/* ============================================================== */}
        {activeTab === "GOVERNANCE" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Operations Governance & Audit Trail
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    Audit Grade
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cryptographic immutable register of supervisor authorizations, line reroutes, and buffer unlocks.
                </p>
              </div>

              {/* THE REQUESTED EXPORT COMPLIANCE REPORT BUTTON */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportComplianceReport}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-md shadow-lg shadow-cyan-950/40 font-mono flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>📥</span>
                  <span>Export Shift Compliance Report (.CSV)</span>
                </button>
              </div>
            </div>

            {/* Temporary Success Toast */}
            {exportNotice && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded flex items-center gap-2 font-mono animate-fade-in">
                <span>✓</span>
                <span>
                  Shift Compliance Report generated and downloaded successfully with deterministic KPIs and sign-offs!
                </span>
              </div>
            )}

            {/* Compliance Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 font-mono uppercase">Authorized Actions</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {auditLog.filter((l) => l.status === "EXECUTED" || l.status === "APPROVED").length} Logged
                </div>
                <div className="text-xs text-slate-400 mt-1">Signed by Yuvaraj V (OPERATIONS_LEAD)</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 font-mono uppercase">Active Risk Clearance</div>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {alerts.filter((a) => a.status === "RESOLVED").length} Resolved / {alerts.length} Total
                </div>
                <div className="text-xs text-slate-400 mt-1">Verified with deterministic engine</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 font-mono uppercase">Compliance Audit Grade</div>
                <div className="text-2xl font-bold font-mono text-orange-400 mt-1">ISO 9001 / IATF</div>
                <div className="text-xs text-slate-400 mt-1">Zero unverified AI or live PLC claims</div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Immutable Operational Directives Log</h3>
                <span className="text-[11px] font-mono text-slate-500">Tenant ID: ABC-AMB</span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-3">Log ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Operational Directive</th>
                    <th className="py-2.5 px-3">Authorized Sign-off</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditLog.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 text-cyan-400 font-bold">{log.id}</td>
                      <td className="py-3 px-3 text-slate-400">{log.timestamp}</td>
                      <td className="py-3 px-3 text-slate-200">
                        <div className="font-semibold">{log.action}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{log.impactSummary}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{log.authorizedBy}</td>
                      <td className="py-3 px-3 text-slate-400">{log.role}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Recovery Modal */}
      {showRecoveryPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D141F] border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 text-lg">⚠️</span>
                <h3 className="text-base font-bold text-white">
                  Active Risks ({activeAlerts.length}) & Governance Reroute Plan
                </h3>
              </div>
              <button
                onClick={() => setShowRecoveryPlanModal(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-xs text-emerald-400 font-mono">
                  ✓ All operational alerts have been reconciled and resolved.
                </div>
              ) : (
                activeAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{alt.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Source: {alt.source} • {alt.timestamp}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alt.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-mono cursor-pointer"
                    >
                      Dismiss Alert
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-orange-950/20 border border-orange-900/50 p-3 rounded text-xs text-orange-200 leading-relaxed">
              <strong>Authorized Recovery Action:</strong> Reallocate 110 units
              workload to standby CNC Lathe #04 and release 60kg SS304 buffer stock
              to recover PO-904 delivery commit within 4 hours.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRecoveryPlanModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRecoveryAction}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold text-xs rounded cursor-pointer"
              >
                Authorize & Execute Recovery Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copilot Drawer */}
      {showCopilotDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-[#0B1017] border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>🤖</span> Operations Copilot
              </div>
              <button
                onClick={() => setShowCopilotDrawer(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 font-mono">
              Grounded Model: Deterministic telemetry constraints for Ambattur plant.
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {copilotHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-800 text-slate-100 ml-4 font-sans"
                      : "bg-slate-950 border border-slate-800 text-slate-300 mr-4 font-mono text-[11px]"
                  }`}
                >
                  <strong className="block text-[10px] text-slate-500 mb-1 uppercase font-mono">
                    {msg.role === "user" ? "You" : "Precisz Agent"}
                  </strong>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCopilotSubmit} className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              placeholder="Ask for bottleneck, KPI math..."
              className="flex-1 bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded cursor-pointer"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}