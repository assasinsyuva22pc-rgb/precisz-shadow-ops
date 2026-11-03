"use client";

import React, { useState, useMemo } from "react";

export type TabType =
  | "COMMAND"
  | "PRODUCTION"
  | "INVENTORY"
  | "QUALITY"
  | "ORDERS"
  | "GOVERNANCE";

export default function PreciszDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("COMMAND");
  const [activeShift, setActiveShift] = useState("Shift 1 (08:00 - 16:30)");
  const [downtimeMinutes, setDowntimeMinutes] = useState(45);
  const [bufferStockAllocated, setBufferStockAllocated] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotHistory, setCopilotHistory] = useState([
    {
      sender: "system",
      text: "Factory telemetry grounded. Ask about CNC-03 downtime, PO-904 shortage, or OEE recovery.",
    },
  ]);

  // Alert State
  const [alerts, setAlerts] = useState([
    {
      id: "ALT-01",
      title: "CNC Lathe #03 Spindle Thermal Overload",
      module: "EQUIPMENT",
      severity: "CRITICAL",
      status: "ACTIVE",
      timestamp: "10:15 AM",
      origin: "MANUALLY RECORDED BY SHOPFLOOR LEAD",
    },
    {
      id: "ALT-02",
      title: "SS304 Buffer Stock Deficit (-60 kg net)",
      module: "INVENTORY",
      severity: "HIGH",
      status: "ACTIVE",
      timestamp: "09:40 AM",
      origin: "WAREHOUSE DISPATCH LEDGER",
    },
    {
      id: "ALT-03",
      title: "First-Pass Rejection 4.9% > 2.0% Contract Limit",
      module: "QUALITY",
      severity: "HIGH",
      status: "ACTIVE",
      timestamp: "09:10 AM",
      origin: "INLINE QA SAMPLING STATION 02",
    },
  ]);

  // Mathematical Reconciliation Engine
  const targetUnits = 1000;
  const producedUnits = 820;
  const rejectedUnits = 40;
  const goodUnits = producedUnits - rejectedUnits; // 780
  const deficitUnits = targetUnits - goodUnits; // 220
  const achievementRate = ((goodUnits / targetUnits) * 100).toFixed(1); // 78.0%
  const rejectionRate = ((rejectedUnits / producedUnits) * 100).toFixed(1); // 4.9%
  const oeeEfficiency = Math.max(50, 84 - Math.round(downtimeMinutes * 0.25));

  // Deterministic Risk Engine
  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
  const calculatedRiskScore = useMemo(() => {
    let score = 0;
    if (downtimeMinutes > 30) score += 35;
    if (Number(rejectionRate) > 2.0) score += 30;
    if (!bufferStockAllocated) score += 24;
    return score;
  }, [downtimeMinutes, rejectionRate, bufferStockAllocated]);

  const riskLevel =
    calculatedRiskScore >= 75
      ? "CRITICAL"
      : calculatedRiskScore >= 40
      ? "HIGH"
      : "NORMAL";

  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "RESOLVED" } : a))
    );
  };

  const handleExecuteRecovery = () => {
    setDowntimeMinutes(0);
    setBufferStockAllocated(true);
    setAlerts((prev) => prev.map((a) => ({ ...a, status: "RESOLVED" })));
    setShowRiskModal(false);
  };

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;
    const query = copilotInput;
    setCopilotHistory((prev) => [...prev, { sender: "user", text: query }]);
    setCopilotInput("");

    setTimeout(() => {
      let reply = "Operational analysis: ";
      if (query.toLowerCase().includes("downtime") || query.toLowerCase().includes("cnc")) {
        reply += `CNC Lathe #03 recorded ${downtimeMinutes}m loss. Standby CNC #04 is running at 0m loss. Rerouting eliminates shift lag.`;
      } else if (query.toLowerCase().includes("kpi") || query.toLowerCase().includes("target")) {
        reply += `Target: ${targetUnits} | Good: ${goodUnits} | Rejection: ${rejectionRate}% (Threshold 2.0%). Deficit: ${deficitUnits} pcs.`;
      } else {
        reply += `Order #ORD-2026-904 delivery index is ${calculatedRiskScore}/100 (${riskLevel}). Recovery plan ready for execution.`;
      }
      setCopilotHistory((prev) => [...prev, { sender: "system", text: reply }]);
    }, 300);
  };

  // CSV Report Exporter
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        ["PRECISZ SHADOW-OPS - COMPLIANCE REPORT"],
        ["Tenant", "ABC Precision Components (Ambattur, Chennai)"],
        ["Shift", activeShift],
        ["Target Qty", targetUnits],
        ["Good Produced", goodUnits],
        ["Deficit", deficitUnits],
        ["Rejection Rate", `${rejectionRate}%`],
        ["Machine Downtime", `${downtimeMinutes} mins`],
        ["Risk Index", `${calculatedRiskScore}/100 (${riskLevel})`],
      ]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shift_Compliance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col font-sans">
      {/* 1. Industrial Header Bar */}
      <div className="bg-[#0B1017] border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-slate-300">
            INDUSTRIAL AUDIT ENVIRONMENT: <strong className="text-white">DETERMINISTIC OPS</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>DATA ORIGIN: <strong>SHOPFLOOR LOGS & SIMULATED SENSORS</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">LAST TELEMETRY REFRESH: 10:48 AM IST</span>
        </div>
      </div>

      {/* 2. Top Executive Navbar */}
      <header className="border-b border-slate-800 bg-[#0A0E17]/90 backdrop-blur sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-orange-600 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter">
              PS
            </div>
            <div>
              <div className="text-base font-bold tracking-wide text-white">Precisz</div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 -mt-1">
                Shadow-Ops Intelligence
              </div>
            </div>
          </div>

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

        {/* Tenant Details & Copilot */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block font-mono text-xs">
            <div className="font-semibold text-slate-200">ABC Precision Components</div>
            <div className="text-[11px] text-slate-500">Ambattur, Chennai • {activeShift}</div>
          </div>

          <button
            onClick={() => setShowCopilot(true)}
            className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-800 hover:bg-cyan-900/50 text-cyan-300 rounded text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <span>🤖</span> Copilot
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400 font-mono">
              YU
            </div>
            <div className="text-left text-[11px] leading-tight">
              <div className="font-semibold text-slate-200">Yuvaraj V</div>
              <div className="text-slate-500 text-[10px] font-mono">OPERATIONS_LEAD</div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* ================= TAB 1: EXECUTIVE COMMAND DASHBOARD ================= */}
        {activeTab === "COMMAND" && (
          <div className="space-y-6">
            {/* Dashboard Sub-header with Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                  Factory Command Center Dashboard
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                    Live Floor Feed
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time telemetry, shift pace metrics, and delivery commitment dashboard.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRiskModal(true)}
                  className={`px-3 py-1.5 rounded text-xs font-mono border transition-all flex items-center gap-2 cursor-pointer ${
                    activeAlerts.length > 0
                      ? "bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/50"
                      : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  }`}
                >
                  <span>{activeAlerts.length > 0 ? "⚠️" : "✓"}</span>
                  <span>View {activeAlerts.length} Active System Risks</span>
                </button>

                <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono rounded">
                  Shift OEE: <strong className="text-cyan-400">{oeeEfficiency}%</strong>
                </div>
              </div>
            </div>

            {/* DASHBOARD WIDGET ROW 1: CORE METRICS GAUGES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Production Progress Card */}
              <div className="p-4 bg-[#0C121D] border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                  <span>Production Target</span>
                  <span className="text-slate-500">[Good / Target]</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {goodUnits} <span className="text-xs text-slate-400 font-normal">/ {targetUnits} pcs</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${achievementRate}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400">
                  <span>Achievement: <strong className="text-slate-200">{achievementRate}%</strong></span>
                  <span className="text-amber-400 font-mono">Pace: 88%</span>
                </div>
              </div>

              {/* Quality & Tolerance Card with Visual Breach Bar */}
              <div className="p-4 bg-[#0C121D] border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                  <span>First-Pass Rejection</span>
                  <span className="text-rose-400 font-bold">+2.9% BREACH</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {rejectionRate}% <span className="text-xs text-rose-400 font-normal">({rejectedUnits} pcs scrap)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: "85%" }}></div>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400">
                  <span>Contract Limit: 2.0%</span>
                  <span className="text-slate-500 font-mono">Loss: ₹ 9,600</span>
                </div>
              </div>

              {/* Shift Downtime Card */}
              <div className="p-4 bg-[#0C121D] border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                  <span>Machinery Downtime</span>
                  <span className="text-rose-400 font-mono">{downtimeMinutes > 0 ? "BOTTLE NECK" : "OPTIMAL"}</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {downtimeMinutes} <span className="text-xs text-slate-400 font-normal">minutes</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${downtimeMinutes > 30 ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, (downtimeMinutes / 60) * 100)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400">
                  <span>CNC Lathe #03</span>
                  <span className="text-slate-500 font-mono">Spindle Thermal</span>
                </div>
              </div>

              {/* Shift Deficit Card */}
              <div className="p-4 bg-[#0C121D] border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                  <span>Shift Output Deficit</span>
                  <span className="text-amber-400 font-mono">PO-904</span>
                </div>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  {deficitUnits} <span className="text-xs text-slate-400 font-normal">pcs pending</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "65%" }}></div>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-400">
                  <span>Dispatch Window</span>
                  <span className="text-amber-300 font-mono">4.0 Hours Left</span>
                </div>
              </div>
            </div>

            {/* DASHBOARD WIDGET ROW 2: LIVE SIMULATOR + DETERMINISTIC RISK BOX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Interactive What-If Bottleneck Simulator */}
              <div className="p-5 bg-[#0C121D] border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider flex items-center justify-between">
                    <span>What-If Recovery Simulator</span>
                    <span className="text-slate-500 text-[10px]">MANAGEMENT TOOL</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">Adjust CNC-03 Downtime</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulate how floor maintenance recovery impacts active risk and OEE in real-time.
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Downtime Loss:</span>
                      <span className="text-cyan-400 font-bold">{downtimeMinutes} Minutes</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={downtimeMinutes}
                      onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0m (Fully Restored)</span>
                      <span>30m (Threshold)</span>
                      <span>60m (Critical)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Projected OEE:</span>
                  <span className="text-emerald-400 font-bold">{oeeEfficiency}%</span>
                </div>
              </div>

              {/* Deterministic Order Risk Box (Span 2) */}
              <div className="md:col-span-2 p-5 bg-[#0C121D] border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-mono uppercase text-slate-400">
                        Order Commitment Risk Evaluation Engine
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        PO #ORD-2026-904 Delivery Viability
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                        riskLevel === "CRITICAL"
                          ? "bg-rose-950/60 text-rose-400 border-rose-800"
                          : "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                      }`}
                    >
                      {riskLevel} RISK (Rule Index: {calculatedRiskScore}/100)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <div className="text-slate-400">Machinery Downtime Weight</div>
                      <div className="text-white font-bold mt-1">
                        {downtimeMinutes > 30 ? "+35 pts (Breached 30m limit)" : "0 pts (Within tolerance)"}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <div className="text-slate-400">Quality Tolerance Weight</div>
                      <div className="text-white font-bold mt-1">+30 pts (Rejection 4.9% &gt; 2.0%)</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-3">
                  <div className="text-xs text-slate-300">
                    {downtimeMinutes === 0 && bufferStockAllocated
                      ? "✓ All operational bottlenecks eliminated. Order fulfillment on schedule."
                      : "Immediate action required: Divert 110 units to Standby CNC-04 and release raw billets."}
                  </div>
                  {calculatedRiskScore > 0 && (
                    <button
                      onClick={() => setShowRiskModal(true)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold text-xs rounded font-mono cursor-pointer"
                    >
                      Authorize Recovery Plan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* DASHBOARD WIDGET ROW 3: WORKSTATION TELEMETRY GRID */}
            <div className="p-5 bg-[#0C121D] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Workstation Live Telemetry Grid
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Facility: Ambattur (ABC-AMB)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white text-xs">CNC Lathe #03</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        downtimeMinutes > 0
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      }`}
                    >
                      {downtimeMinutes > 0 ? "MAINTENANCE" : "RUNNING"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    <div>Downtime: <strong className="text-rose-400">{downtimeMinutes}m</strong></div>
                    <div>Spindle: 68.4°C • Vib: 4.8 mm/s</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white text-xs">VMC Milling #01</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      RUNNING
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    <div>Downtime: 0m</div>
                    <div>Spindle: 44.1°C • Vib: 1.2 mm/s</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white text-xs">Surface Grinder #02</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      IDLE
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    <div>Downtime: 15m</div>
                    <div>Spindle: 38.0°C • Vib: 0.8 mm/s</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white text-xs">CNC Lathe #04 (Standby)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      STANDBY
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    <div>Ready for Reroute</div>
                    <div>Spindle: 42.5°C • Vib: 1.1 mm/s</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PRODUCTION INTEL ================= */}
        {activeTab === "PRODUCTION" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl font-bold text-white">Production Intelligence & Cycle Run Rates</h1>
              <p className="text-xs text-slate-400">Real-time takt analysis and machine capacity tracking.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono">CYCLE EFFICIENCY</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">84.2%</div>
                <div className="text-xs text-slate-500 mt-1">Average cycle: 42.8s / part</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono">TOTAL RECORDED DOWNTIME</div>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{downtimeMinutes} mins</div>
                <div className="text-xs text-slate-500 mt-1">Thermal spindle shutdown on Lathe #03</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono">HOURLY THROUGHPUT</div>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">105 pcs/hr</div>
                <div className="text-xs text-slate-500 mt-1">Nominal standard: 125 pcs/hr</div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: INVENTORY ================= */}
        {activeTab === "INVENTORY" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-white">Raw Material Stocks & Reorder Points</h1>
                <p className="text-xs text-slate-400">Billet stock levels, safety buffers, and allocation tracking.</p>
              </div>
              <button
                onClick={() => setBufferStockAllocated(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 rounded border border-slate-700 cursor-pointer"
              >
                + Unlock Emergency SS304 Buffer
              </button>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Available Stock</th>
                    <th className="py-2.5 px-3">Reserved</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-white">SS304 Cold Rolled Bar</td>
                    <td className="py-3 px-3 text-slate-400">SS304-BAR-50MM</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">{bufferStockAllocated ? "320 kg (Restored)" : "140 kg (Low)"}</td>
                    <td className="py-3 px-3 text-slate-300">200 kg</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${bufferStockAllocated ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-rose-950 text-rose-300 border border-rose-800"}`}>
                        {bufferStockAllocated ? "OPTIMAL" : "SHORTAGE ALERT"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-white">EN8 Carbon Steel</td>
                    <td className="py-3 px-3 text-slate-400">EN8-ROD-40MM</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">820 kg</td>
                    <td className="py-3 px-3 text-slate-300">400 kg</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                        OPTIMAL
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: QUALITY ================= */}
        {activeTab === "QUALITY" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl font-bold text-white">Quality Inspection & Scrap Logs</h1>
              <p className="text-xs text-slate-400">CMM dimensional verification and scrap cost valuations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono">INSPECTED LOT</div>
                <div className="text-2xl font-bold font-mono text-white mt-1">820 pcs</div>
                <div className="text-xs text-slate-500 mt-1">100% in-line verification</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono">REJECTION RATE</div>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">4.9%</div>
                <div className="text-xs text-slate-500 mt-1">Tolerance Limit: 2.0%</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 font-mono">TOTAL SCRAP COST LOSS</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">₹ 9,600</div>
                <div className="text-xs text-slate-500 mt-1">Calculated from SS304 component loss</div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: ORDERS ================= */}
        {activeTab === "ORDERS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl font-bold text-white">Purchase Orders & Dispatch Schedule</h1>
              <p className="text-xs text-slate-400">Commercial fulfillment windows and client delivery readiness.</p>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">PO Number</th>
                    <th className="py-2 px-3">Client</th>
                    <th className="py-2 px-3">Target</th>
                    <th className="py-2 px-3">Good Packed</th>
                    <th className="py-2 px-3">Deficit</th>
                    <th className="py-2 px-3">Window</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-3 px-3 font-bold text-cyan-400">PO #ORD-2026-904</td>
                    <td className="py-3 px-3 text-slate-300">Hyundai Tier-1 (Sriperumbudur)</td>
                    <td className="py-3 px-3 text-white">1,000 pcs</td>
                    <td className="py-3 px-3 text-emerald-400">{goodUnits} pcs</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">{deficitUnits} pcs</td>
                    <td className="py-3 px-3 text-amber-300">4 Hours Left</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                        AT RISK
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 6: GOVERNANCE ================= */}
        {activeTab === "GOVERNANCE" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-white">Operations Governance & Audit Trail</h1>
                <p className="text-xs text-slate-400">Audit logs and executive compliance exports.</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded font-mono flex items-center gap-2 cursor-pointer"
              >
                <span>📥</span> Export Shift Compliance Report (.CSV)
              </button>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
              <h3 className="text-sm font-bold text-white mb-2">Immutable Authorizations Log</h3>
              <div className="text-xs font-mono text-slate-400 space-y-2">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex justify-between">
                  <span>LOG-101 • Calibration Check Passed</span>
                  <span className="text-slate-500">08:15 AM • Yuvaraj V</span>
                </div>
                {downtimeMinutes === 0 && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded flex justify-between text-emerald-300">
                    <span>LOG-102 • Recovery Reroute Executed & SS304 Buffer Unlocked</span>
                    <span className="text-emerald-400">Just Now • Yuvaraj V</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Recovery Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C121D] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                ⚠️ Active Risks ({activeAlerts.length}) & Governance Plan
              </h3>
              <button onClick={() => setShowRiskModal(false)} className="text-slate-500 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeAlerts.map((a) => (
                <div key={a.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded flex justify-between items-center text-xs">
                  <div>
                    <div className="text-slate-200 font-semibold">{a.title}</div>
                    <div className="text-[10px] text-slate-500">{a.origin}</div>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(a.id)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-orange-950/30 border border-orange-900/60 p-3 rounded text-xs text-orange-200">
              <strong>Proposed Action:</strong> Reroute 110 units to Standby CNC Lathe #04 and unlock emergency SS304 buffer stock.
            </div>

            <div className="flex justify-end gap-3 pt-2 text-xs">
              <button
                onClick={() => setShowRiskModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRecovery}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold rounded cursor-pointer"
              >
                Authorize Recovery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copilot Drawer */}
      {showCopilot && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-[#0B1017] border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>🤖</span> Operations Copilot
              </div>
              <button onClick={() => setShowCopilot(false)} className="text-slate-500 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto text-xs font-mono">
              {copilotHistory.map((m, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded ${m.sender === "user" ? "bg-slate-800 text-slate-100 ml-4" : "bg-slate-950 border border-slate-800 text-slate-300 mr-4"}`}
                >
                  <strong className="block text-[10px] text-slate-500 uppercase">{m.sender}</strong>
                  {m.text}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCopilotSubmit} className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="Ask floor telemetry..."
              className="flex-1 bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded text-white font-mono focus:outline-none"
            />
            <button type="submit" className="px-3 py-1.5 bg-cyan-600 text-slate-950 font-bold text-xs rounded cursor-pointer">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}