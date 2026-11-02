"use client";

import React, { useState, useMemo } from "react";
import {
  calculateTenantKPIs,
  evaluateOrderCommitmentRisk,
  ProductionOrder,
  MachineRecord,
} from "@/lib/analyticsEngine";
import { INITIAL_ALERTS, SystemAlert } from "@/lib/alertEngine";

// Demo Initial Data (Tenant Isolated: ABC-AMB)
const INITIAL_MACHINES: MachineRecord[] = [
  {
    id: "MCH-01",
    name: "CNC Lathe #03",
    tenantId: "ABC-AMB",
    status: "MAINTENANCE",
    downtimeMinutes: 45,
    source: "MANUALLY RECORDED",
    lastLogged: "10:15 AM",
  },
  {
    id: "MCH-02",
    name: "VMC Milling #01",
    tenantId: "ABC-AMB",
    status: "RUNNING",
    downtimeMinutes: 0,
    source: "DEMO DATASET",
    lastLogged: "10:45 AM",
  },
  {
    id: "MCH-03",
    name: "Surface Grinder #02",
    tenantId: "ABC-AMB",
    status: "IDLE",
    downtimeMinutes: 15,
    source: "DEMO DATASET",
    lastLogged: "10:30 AM",
  },
];

const INITIAL_ORDER: ProductionOrder = {
  id: "ORD-904",
  orderNumber: "ORD-2026-904",
  tenantId: "ABC-AMB",
  targetQty: 1000,
  producedQty: 820,
  rejectedQty: 40,
  plannedDowntimeMinutes: 0,
  deadlineHoursRemaining: 4,
  materialAvailable: false, // SS304 buffer deficit
};

export default function CommandCenter() {
  const [selectedTenant, setSelectedTenant] = useState("ABC-AMB");
  const [currentTab, setCurrentTab] = useState<
    "COMMAND" | "PRODUCTION" | "INVENTORY" | "QUALITY" | "ORDERS"
  >("COMMAND");
  
  // Data State
  const [machines, setMachines] = useState<MachineRecord[]>(INITIAL_MACHINES);
  const [order, setOrder] = useState<ProductionOrder>(INITIAL_ORDER);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  
  // Modal & Drawers
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [recoveryAuthorized, setRecoveryAuthorized] = useState(false);

  // Active Alerts for selected tenant
  const activeAlerts = useMemo(() => {
    return alerts.filter(
      (a) => a.tenantId === selectedTenant && a.status === "ACTIVE"
    );
  }, [alerts, selectedTenant]);

  // Dynamic Deterministic Engine Calculations
  const kpis = useMemo(() => {
    return calculateTenantKPIs(order, machines);
  }, [order, machines]);

  const riskEvaluation = useMemo(() => {
    return evaluateOrderCommitmentRisk(order, machines);
  }, [order, machines]);

  // Resolve Alert Handler
  const resolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "RESOLVED" } : a))
    );
  };

  // Authorize Recovery Action
  const handleAuthorizeRecovery = () => {
    setRecoveryAuthorized(true);
    // Simulate rerouting downtime and allocating buffer
    setOrder((prev) => ({ ...prev, materialAvailable: true }));
    setMachines((prev) =>
      prev.map((m) =>
        m.id === "MCH-01" ? { ...m, status: "RUNNING", downtimeMinutes: 10 } : m
      )
    );
    setShowRiskModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* 1. Transparent Enterprise Header Badge */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            ENVIRONMENT: <strong className="text-slate-200">ILLUSTRATIVE DEMO ENVIRONMENT</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            DATA ORIGIN:{" "}
            <strong className="text-slate-200">DEMO DATASET & LOCAL AUDIT LOGS</strong>{" "}
            (No live PLC/SCADA attached)
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-mono">
            Last Sync: 10:45 AM (Local Simulated Feed)
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0B0F17]/90 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-orange-600 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter">
              PS
            </div>
            <div>
              <div className="text-base font-bold tracking-wide text-white">Precisz</div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 -mt-1">
                Shadow-Ops
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
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  currentTab === tab.id
                    ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
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
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">
              ABC Precision Components
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Ambattur, Chennai • General Shift (08:00 - 17:00)
            </div>
          </div>

          <button
            onClick={() => setShowCopilot(true)}
            className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-800 hover:bg-cyan-900/50 text-cyan-300 rounded-md text-xs font-medium flex items-center gap-1.5"
          >
            <span>🤖</span> AI Copilot
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
              YU
            </div>
            <div className="text-left text-[11px] leading-tight">
              <div className="font-semibold text-slate-200">Yuvaraj V</div>
              <div className="text-slate-500 text-[10px]">OPERATIONS_LEAD</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Subheader & Reconciled Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Factory Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic operational monitoring for Ambattur Manufacturing Unit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 2. Reconciled Dynamic Active Risk Button */}
            <button
              onClick={() => setShowRiskModal(true)}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-all flex items-center gap-2 ${
                activeAlerts.length > 0
                  ? "bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/50"
                  : "bg-slate-900 border-slate-800 text-emerald-400"
              }`}
            >
              <span>{activeAlerts.length > 0 ? "⚠️" : "✓"}</span>
              <span>View {activeAlerts.length} Active Risks</span>
            </button>

            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded">
              Filters: Active Shift
            </span>
          </div>
        </div>

        {/* Summary KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Production Card */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-xs uppercase text-slate-500 font-mono tracking-wider">
              Production Target
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {kpis.producedGood}{" "}
              <span className="text-xs text-slate-400 font-normal">
                / {kpis.plannedTarget} pcs
              </span>
            </div>
            <div className="mt-2 text-xs flex justify-between text-slate-400">
              <span>Achievement: {kpis.achievementPercent}%</span>
              <span className="text-amber-400">Pace: 88%</span>
            </div>
          </div>

          {/* Quality Card */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-xs uppercase text-slate-500 font-mono tracking-wider">
              First-Pass Quality
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {kpis.rejectionRatePercent}%{" "}
              <span className="text-xs text-rose-400 font-normal">Rejection</span>
            </div>
            <div className="mt-2 text-xs flex justify-between text-slate-400">
              <span>Rejected: {kpis.rejectedUnits} pcs</span>
              <span className="text-slate-500">Max Limit: 2.0%</span>
            </div>
          </div>

          {/* Downtime Card */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-xs uppercase text-slate-500 font-mono tracking-wider">
              Shift Machinery Downtime
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {kpis.totalDowntimeMinutes}{" "}
              <span className="text-xs text-slate-400 font-normal">minutes</span>
            </div>
            <div className="mt-2 text-xs flex justify-between text-slate-400">
              <span>CNC Lathe #03: 45 min</span>
              <span className="text-rose-400 font-mono">CRITICAL</span>
            </div>
          </div>

          {/* Order Deficit Card */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-xs uppercase text-slate-500 font-mono tracking-wider">
              Immediate Order Deficit
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {kpis.deficitUnits}{" "}
              <span className="text-xs text-slate-400 font-normal">units</span>
            </div>
            <div className="mt-2 text-xs flex justify-between text-slate-400">
              <span>PO #ORD-2026-904</span>
              <span className="text-amber-400">4h to dispatch</span>
            </div>
          </div>
        </div>

        {/* 3. Replaced 92% Probability with Transparent Deterministic Rule Engine */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                Order Commitment Risk Evaluation
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                PO #{riskEvaluation.orderNumber} Delivery Readiness Status
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                riskEvaluation.riskLevel === "CRITICAL"
                  ? "bg-rose-950/60 text-rose-400 border-rose-800"
                  : "bg-amber-950/60 text-amber-400 border-amber-800"
              }`}
            >
              {riskEvaluation.riskLevel} DELIVERY RISK (Rule Score:{" "}
              {riskEvaluation.riskScore}/100)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Deterministic Contributing Factors:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {riskEvaluation.rootCauses.map((cause, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80">
              <div className="text-xs font-semibold text-slate-300 mb-1">
                Rule-Based Prescriptive Recommendation:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recoveryAuthorized
                  ? "✓ Recovery plan executed: Shift 2 rerouted to CNC-04 and 120kg SS304 buffer unlocked."
                  : riskEvaluation.recommendedAction}
              </p>
              {!recoveryAuthorized && (
                <button
                  onClick={() => setShowRiskModal(true)}
                  className="mt-3 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-slate-950 rounded text-xs font-bold transition-all"
                >
                  Authorize Recovery Plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Machinery Table with Honest Data Origins */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Tenant Machinery & Telemetry Register
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Status and maintenance downtime breakdown for Ambattur facility.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Unit: Ambattur (ABC-AMB)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Machine Identifier</th>
                  <th className="py-2.5 px-3">Operating Status</th>
                  <th className="py-2.5 px-3">Recorded Downtime</th>
                  <th className="py-2.5 px-3">Data Origin</th>
                  <th className="py-2.5 px-3">Last Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {machines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {m.name}
                    </td>
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
                    <td className="py-2.5 px-3 text-slate-300">
                      {m.downtimeMinutes > 0 ? (
                        <span className="text-rose-400 font-bold">
                          {m.downtimeMinutes} mins
                        </span>
                      ) : (
                        "0 mins"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                        {m.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{m.lastLogged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Risk Management & Recovery Action Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 text-lg">⚠️</span>
                <h3 className="text-base font-bold text-white">
                  Active Risks ({activeAlerts.length}) & Governance Plan
                </h3>
              </div>
              <button
                onClick={() => setShowRiskModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  All active alerts have been reconciled and resolved.
                </div>
              ) : (
                activeAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">
                        {alt.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Source: {alt.source} • {alt.timestamp}
                      </div>
                    </div>
                    <button
                      onClick={() => resolveAlert(alt.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                    >
                      Dismiss / Resolve
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-orange-950/20 border border-orange-900/50 p-3 rounded text-xs text-orange-200">
              <strong>Proposed Recovery Action:</strong> Reallocate 110 units
              workload to standby VMC Milling #01 & release buffer raw billets.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRiskModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
              >
                Close
              </button>
              <button
                onClick={handleAuthorizeRecovery}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold text-xs rounded"
              >
                Authorize & Execute Recovery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Side Drawer */}
      {showCopilot && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>🤖</span> Operations Copilot
              </div>
              <button
                onClick={() => setShowCopilot(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong>Grounding Notice:</strong> Responses are generated purely
              from current deterministic telemetry and rule-based constraints for{" "}
              <span className="text-cyan-400">ABC-AMB</span>.
            </div>
          </div>
          <div className="text-[11px] text-slate-500 text-center">
            Precisz Shadow-Ops Core v1.0.4
          </div>
        </div>
      )}
    </div>
  );
}