"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Cpu,
  Boxes,
  ShieldAlert,
  ShoppingBag,
  Zap,
  Building2,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  X,
  FileCheck,
  Check,
  Truck,
  RotateCcw,
  Database,
  Calculator,
  Activity,
  AlertOctagon,
  Info,
  ClipboardCheck,
  ShieldCheck,
  UserCheck,
  CheckSquare,
  Square,
  Lock,
  Users,
  Bot,
  FileText,
  Send,
  Sparkles,
  FileSearch,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Radio,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { supabase } from "../lib/supabase";
import {
  calculateOEE,
  calculateScrapLoss,
  evaluateOperationalRisk,
  OEEBreakdown,
  CorrelationResult
} from "../lib/analyticsEngine";
import {
  runRiskDetectionEngine,
  FactoryAlert
} from "../lib/alertEngine";
import {
  INITIAL_INTERVENTIONS,
  FactoryIntervention
} from "../lib/actionWorkflow";
import {
  REGISTERED_TENANTS,
  AVAILABLE_USERS,
  UserSession,
  FactoryTenant,
  hasExecutionPrivilege
} from "../lib/authContext";
import {
  ChatMessage,
  InterpretedDoc,
  SAMPLE_DOCUMENTS,
  generateAssistantResponse
} from "../lib/aiAssistant";
import {
  SUPPORTED_CONNECTORS,
  IntegrationConnector,
  parseMachineCSV,
  SAMPLE_CSV_CONTENT,
  ParsedCsvRow
} from "../lib/importIntegrations";

const hourlyData = [
  { time: "08:00", planned: 120, actual: 118 },
  { time: "09:00", planned: 125, actual: 122 },
  { time: "10:00", planned: 130, actual: 128 },
  { time: "11:00", planned: 125, actual: 126 },
  { time: "12:00", planned: 130, actual: 124 },
  { time: "13:00", planned: 120, actual: 55 },
  { time: "14:00", planned: 125, actual: 110 },
  { time: "15:00", planned: 125, actual: 117 },
];

const SYNTHETIC_QUALITY = [
  {
    batchId: "BAT-904-B1",
    partName: "Precision Drive Shaft (SS-304)",
    inspected: 200,
    passed: 160,
    rejected: 40,
    defectReason: "Spindle Chatter / Surface Finish Out of Spec",
    scrapCost: 11400,
    machineId: "CNC Lathe #03"
  },
  {
    batchId: "BAT-889-A4",
    partName: "Helical Pinion Gear",
    inspected: 500,
    passed: 494,
    rejected: 6,
    defectReason: "Tooth Runout Exceeded",
    scrapCost: 1200,
    machineId: "CNC Lathe #01"
  }
];

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAlertDrawer, setShowAlertDrawer] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase 10: Auth & Tenant States
  const [currentTenant, setCurrentTenant] = useState<FactoryTenant>(REGISTERED_TENANTS[0]);
  const [currentUser, setCurrentUser] = useState<UserSession>(AVAILABLE_USERS[0]);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Phase 9: Workflow States
  const [interventions, setInterventions] = useState<FactoryIntervention[]>(INITIAL_INTERVENTIONS);
  const [selectedIntervention, setSelectedIntervention] = useState<FactoryIntervention | null>(null);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});
  const [managerNotes, setManagerNotes] = useState("Approved for Line A recovery protocol.");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Phase 11: AI Copilot & Document States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "MSG-01",
      sender: "assistant",
      text: "Shadow-Ops AI Copilot active. Machine 03 breakdown (45m) and SS-304 shortage are threatening Orion Systems Friday dispatch. Ask me for recovery recommendations or select a quick query below.",
      timestamp: "12:56 PM"
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<InterpretedDoc>(SAMPLE_DOCUMENTS[0]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Phase 12: CSV Import & Integrations States
  const [connectors, setConnectors] = useState<IntegrationConnector[]>(SUPPORTED_CONNECTORS);
  const [csvRawText, setCsvRawText] = useState(SAMPLE_CSV_CONTENT);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");

  // Live Database States
  const [machines, setMachines] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dbConnected, setDbConnected] = useState(false);

  // Phase 7 Analytics Engine Calculations
  const [plantOEE, setPlantOEE] = useState<OEEBreakdown>({
    availability: 88.5,
    performance: 96.2,
    quality: 95.1,
    oee: 81.0
  });

  const [riskAssessment, setRiskAssessment] = useState<CorrelationResult>({
    riskPercentage: 92,
    deficitPieces: 110,
    shortageSeverity: "CRITICAL",
    projectedDelayHours: 2.2,
    recoveryOvertimeHoursNeeded: 2,
    recoveryCostInr: 2400
  });

  // Phase 8 Risk & Alert State
  const [alerts, setAlerts] = useState<FactoryAlert[]>([]);

  useEffect(() => {
    const oeeResult = calculateOEE({
      plannedMinutes: 480,
      downtimeMinutes: 45,
      idealCycleTimeSec: 28,
      totalProduced: 820,
      rejectedPieces: 40
    });
    setPlantOEE(oeeResult);

    const riskResult = evaluateOperationalRisk({
      orderTargetQty: 1000,
      completedQty: 620,
      remainingHoursToDeadline: 6,
      activeLinePacePerHour: 50,
      downtimeMinutes: 45,
      scrapCount: 40,
      materialAvailableKg: 40,
      materialRequiredKg: 260
    });
    setRiskAssessment(riskResult);

    const generatedAlerts = runRiskDetectionEngine({
      downtimeMinutes: 45,
      brokenMachineId: "CNC Lathe #03",
      scrapPercentage: 4.1,
      availableMaterialKg: 40,
      requiredMaterialKg: 260,
      customerOrderDueHours: 48,
      orderNumber: "ORD-2026-904",
      customerName: "Orion Industrial Systems"
    });
    setAlerts(generatedAlerts);
  }, []);

  const loadDatabaseData = async () => {
    try {
      const [mRes, iRes, oRes, aRes] = await Promise.all([
        supabase.from("machines").select("*").eq("factory_id", currentTenant.id),
        supabase.from("inventory").select("*").eq("factory_id", currentTenant.id),
        supabase.from("customer_orders").select("*").eq("factory_id", currentTenant.id),
        supabase.from("action_audit_logs").select("*").eq("factory_id", currentTenant.id).order("created_at", { ascending: false })
      ]);

      if (mRes.data) {
        setMachines(mRes.data);
        setDbConnected(true);
      }
      if (iRes.data) setInventory(iRes.data);
      if (oRes.data) setOrders(oRes.data);
      if (aRes.data) setAuditLogs(aRes.data);
    } catch (err) {
      console.error("Supabase sync notice:", err);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, [currentTenant.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showAiDrawer]);

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const allChecksSatisfied =
    selectedIntervention &&
    selectedIntervention.safetyChecklist.every((_, idx) => checkedItems[idx]);

  const handleApproveWorkflow = async () => {
    if (!selectedIntervention || !allChecksSatisfied) return;
    if (!hasExecutionPrivilege(currentUser.role)) {
      alert(`Access Denied: Your role (${currentUser.role}) does not have execution sign-off privileges.`);
      return;
    }

    setIsSubmitting(true);

    const auditEntry = {
      id: `ACT-${Date.now().toString().slice(-6)}`,
      factory_id: currentTenant.id,
      action_type: selectedIntervention.category,
      description: `${selectedIntervention.title} | ${managerNotes}`,
      authorized_by: `${currentUser.name} (${currentUser.role})`,
      status: "EXECUTING"
    };

    try {
      await supabase.from("action_audit_logs").insert([auditEntry]);
      setInterventions((prev) =>
        prev.map((item) =>
          item.id === selectedIntervention.id
            ? { ...item, status: "COMPLETED" }
            : item
        )
      );
      await loadDatabaseData();
    } catch (e) {
      console.warn("Audit local fallback:", e);
    } finally {
      setIsSubmitting(false);
      setSelectedIntervention(null);
      setCheckedItems({});
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `USR-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const replyText = generateAssistantResponse(
      q,
      `Tenant: ${currentTenant.name}, OEE: ${plantOEE.oee}%, Delay Risk: ${riskAssessment.riskPercentage}%`
    );

    const assistantMsg: ChatMessage = {
      id: `AI-${Date.now() + 1}`,
      sender: "assistant",
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputQuery("");
  };

  // Phase 12: Parse CSV in Memory
  const handleValidateCsv = () => {
    const { data, errors } = parseMachineCSV(csvRawText);
    setParsedRows(data);
    setParseErrors(errors);
    setImportSuccessMsg("");
  };

  // Phase 12: Ingest Validated CSV Rows into Supabase Cloud
  const handleCommitCsvToDatabase = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setImportSuccessMsg("");

    try {
      const recordsToInsert = parsedRows.map((r) => ({
        id: r.id,
        factory_id: currentTenant.id,
        name: r.name,
        line: r.line,
        operator: r.operator,
        status: r.status,
        efficiency: r.efficiency,
        output: r.output
      }));

      const { error } = await supabase.from("machines").upsert(recordsToInsert);

      if (error) {
        setParseErrors([`Database sync error: ${error.message}`]);
      } else {
        setImportSuccessMsg(`Successfully ingested ${recordsToInsert.length} machine telemetry records into PostgreSQL!`);
        await loadDatabaseData();
      }
    } catch (err: any) {
      setParseErrors([`Unexpected error: ${err.message}`]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "precisz_machines_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canExecute = hasExecutionPrivilege(currentUser.role);
  const pendingCount = interventions.filter((i) => i.status === "PENDING_APPROVAL").length;
  const unreadAlertCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="flex h-screen w-full bg-[#0B0F17] text-slate-200 overflow-hidden font-sans">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-800 bg-[#0E131F] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-black text-sm tracking-tighter shadow-lg shadow-orange-500/20">
                PS
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-wide text-white uppercase">Precisz</h1>
                <p className="text-[10px] text-amber-500 tracking-widest font-mono uppercase font-semibold">Shadow-Ops</p>
              </div>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">Integrations</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
              Intelligence Modules
            </div>

            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Command Center</span>
            </button>

            <button
              onClick={() => setActiveTab("production")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "production"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Cpu size={16} />
              <span>Production Intel</span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "inventory"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Boxes size={16} />
              <span>Inventory & Materials</span>
            </button>

            <button
              onClick={() => setActiveTab("quality")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "quality"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <ShieldAlert size={16} />
              <span>Quality & Wastage</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "orders"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <ShoppingBag size={16} />
              <span>Orders & Dispatches</span>
            </button>

            <div className="pt-3 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
              AI & Documents
            </div>

            <button
              onClick={() => setActiveTab("docs")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "docs"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <FileSearch size={16} className="text-amber-400" />
              <span>Document Interpreter</span>
            </button>

            <div className="pt-3 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
              Data & Ecosystem
            </div>

            {/* Phase 12 Navigation Link */}
            <button
              onClick={() => setActiveTab("integrations")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "integrations"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <span>CSV & Integrations</span>
            </button>

            <div className="pt-3 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
              Action & Governance
            </div>

            <button
              onClick={() => setActiveTab("actions")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "actions"
                  ? "bg-slate-800/80 text-amber-400 border-l-2 border-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck size={16} className="text-amber-500" />
                <span>Action & Governance</span>
              </div>
              {pendingCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Footer Tenant Info */}
        <div className="p-3 border-t border-slate-800 bg-[#0B0F17]/60 space-y-2">
          <div className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-900/60 border border-slate-800 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
              <span className="font-mono text-slate-300">
                {dbConnected ? "Tenant Isolated" : "Syncing..."}
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">{currentTenant.code}</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 bg-[#0E131F]/90 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            {/* Multi-Tenant Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowTenantMenu(!showTenantMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700/60 hover:border-amber-500/50 text-xs transition"
              >
                <Building2 size={14} className="text-amber-500" />
                <span className="font-semibold text-white">{currentTenant.name}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({currentTenant.location})</span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {showTenantMenu && (
                <div className="absolute left-0 mt-2 w-72 bg-[#0E131F] border border-slate-700 rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-slate-800">
                    Switch Factory Tenant
                  </div>
                  {REGISTERED_TENANTS.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setCurrentTenant(tenant);
                        setShowTenantMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs hover:bg-slate-800 flex items-center justify-between transition ${
                        tenant.id === currentTenant.id ? "bg-slate-800 text-amber-400 font-semibold" : "text-slate-300"
                      }`}
                    >
                      <div>
                        <div>{tenant.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{tenant.location}</div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {tenant.code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-mono hidden md:block">
              Shift: <span className="text-slate-200 font-semibold">General (08:00 - 17:00)</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Copilot Trigger */}
            <button
              onClick={() => setShowAiDrawer(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-xs font-semibold text-amber-400 shadow-sm transition"
            >
              <Bot size={15} />
              <span>AI Copilot</span>
              <Sparkles size={12} className="text-amber-300 animate-pulse" />
            </button>

            {/* RBAC Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700/60 hover:border-amber-500/50 text-xs transition"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-white font-medium leading-none">{currentUser.name}</div>
                  <div className="text-[9px] font-mono text-amber-400">{currentUser.role}</div>
                </div>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0E131F] border border-slate-700 rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-slate-800">
                    Simulate User Role (RBAC)
                  </div>
                  {AVAILABLE_USERS.map((usr) => (
                    <button
                      key={usr.id}
                      onClick={() => {
                        setCurrentUser(usr);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between transition ${
                        usr.id === currentUser.id ? "bg-slate-800 text-amber-400 font-semibold" : "text-slate-300"
                      }`}
                    >
                      <div>
                        <div>{usr.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{usr.email}</div>
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {usr.role.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowAlertDrawer(true)}
              className="p-2 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 relative border border-slate-700 transition"
              title="Factory Realtime Alerts"
            >
              <Bell size={16} />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-black text-[9px] font-bold flex items-center justify-center font-mono">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: COMMAND CENTER */}
          {activeTab === "overview" && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Factory Command Center
                    <span className="text-[11px] font-normal font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Tenant: {currentTenant.name}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Isolated telemetry feed for {currentTenant.location}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAlertDrawer(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400"
                  >
                    <AlertTriangle size={14} />
                    <span>View {alerts.length} Active Risks</span>
                  </button>
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200">
                    <SlidersHorizontal size={14} />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Production Target (Today)</span>
                    <Clock size={15} className="text-slate-500" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-white font-mono">820</span>
                    <span className="text-xs text-slate-400 font-mono">/ 1,000 pcs</span>
                  </div>
                  <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "82%" }}></div>
                  </div>
                  <p className="mt-2 text-[11px] text-amber-400 font-medium">82.0% Achieved (Pace: 88%)</p>
                </div>

                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Downtime Losses</span>
                    <AlertTriangle size={15} className="text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-amber-400 font-mono">45</span>
                    <span className="text-xs text-slate-400 font-mono">mins</span>
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400 truncate">
                    Primary: <span className="text-slate-200">CNC Lathe #03 (Hydraulic Seal)</span>
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>First-Pass Rejection</span>
                    <ShieldAlert size={15} className="text-red-400" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-white font-mono">4.1%</span>
                    <span className="text-xs text-red-400 font-mono">(40 pcs scrap)</span>
                  </div>
                  <p className="mt-4 text-[11px] text-red-400">
                    Tolerance exceeded (&gt;2.0%)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Order Commitment Risk</span>
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-orange-400 font-mono">{riskAssessment.riskPercentage}%</span>
                    <span className="text-xs text-slate-400 font-mono">Probability</span>
                  </div>
                  <p className="mt-4 text-[11px] text-orange-400 font-medium truncate">
                    PO #ORD-2026-904 ({riskAssessment.deficitPieces} pcs deficit)
                  </p>
                </div>
              </div>

              {/* Cross-Correlation Risk Banner */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                      <span>Autonomous Risk Cross-Correlation Detected</span>
                      <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-mono border border-red-500/30">
                        {riskAssessment.shortageSeverity}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Machine 03 downtime (45m) + 40 scrapped shafts + SS304 shortage puts <span className="font-bold text-white">Friday delivery to Orion Systems at {riskAssessment.riskPercentage}% delay risk</span>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedIntervention(interventions[0]);
                  }}
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase tracking-wider shrink-0 transition flex items-center space-x-1.5 shadow-lg shadow-amber-500/10"
                >
                  <span>Authorize Recovery Plan</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Machinery Table */}
              <div className="p-5 rounded-lg bg-[#0E131F] border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Active Shop-Floor Equipment</h3>
                    <p className="text-xs text-slate-400">Isolated database partition for {currentTenant.name}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                        <th className="pb-3">Machine</th>
                        <th className="pb-3">Line</th>
                        <th className="pb-3">Lead Operator</th>
                        <th className="pb-3">Shift Output</th>
                        <th className="pb-3">Efficiency</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {machines.length > 0 ? (
                        machines.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-900/50 transition">
                            <td className="py-3 font-semibold text-white flex items-center space-x-2">
                              <span>{m.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({m.id})</span>
                            </td>
                            <td className="py-3 text-slate-300">{m.line}</td>
                            <td className="py-3 text-slate-400">{m.operator}</td>
                            <td className="py-3 font-mono text-slate-200">{m.output}</td>
                            <td className="py-3 font-mono text-slate-200">{m.efficiency}%</td>
                            <td className="py-3">
                              {m.status === "Running" ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                                  Running
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono animate-pulse">
                                  Breakdown
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 font-mono">
                            No machinery telemetry logged for this tenant unit.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PRODUCTION INTEL */}
          {activeTab === "production" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Production Intelligence & OEE Engine</h2>
                <p className="text-xs text-slate-400 mt-0.5">Machine efficiency, cycle times, and Overall Equipment Effectiveness.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800">
                  <span className="text-xs text-slate-400">Calculated Plant OEE</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{plantOEE.oee}%</p>
                  <p className="text-[11px] text-slate-400 mt-1">Benchmark: 85.0%</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800">
                  <span className="text-xs text-slate-400">Availability Factor</span>
                  <p className="text-2xl font-bold font-mono text-white mt-1">{plantOEE.availability}%</p>
                  <p className="text-[11px] text-amber-400 mt-1">Impacted by 45m breakdown</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800">
                  <span className="text-xs text-slate-400">Performance Factor</span>
                  <p className="text-2xl font-bold font-mono text-white mt-1">{plantOEE.performance}%</p>
                  <p className="text-[11px] text-slate-400 mt-1">Standard run speed: 96%</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800">
                  <span className="text-xs text-slate-400">Quality Factor</span>
                  <p className="text-2xl font-bold font-mono text-white mt-1">{plantOEE.quality}%</p>
                  <p className="text-[11px] text-red-400 mt-1">40 scrap pieces detected</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Inventory & Procurement Intelligence</h2>
                <p className="text-xs text-slate-400 mt-0.5">Raw material stock levels isolated by tenant.</p>
              </div>

              <div className="p-5 rounded-lg bg-[#0E131F] border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-3">Material Code</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">On-Hand</th>
                      <th className="pb-3">Reserved</th>
                      <th className="pb-3">Available</th>
                      <th className="pb-3">Supplier & Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {inventory.map((item) => (
                      <tr key={item.material_code} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 font-mono font-semibold text-white">{item.material_code}</td>
                        <td className="py-3 text-slate-300">{item.description}</td>
                        <td className="py-3 font-mono text-slate-200">{item.on_hand_kg} kg</td>
                        <td className="py-3 font-mono text-slate-400">{item.reserved_kg} kg</td>
                        <td className="py-3 font-mono font-bold text-amber-400">{item.available_kg} kg</td>
                        <td className="py-3 text-slate-300">{item.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QUALITY */}
          {activeTab === "quality" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Quality & Wastage Intelligence</h2>
                <p className="text-xs text-slate-400 mt-0.5">Rejection analytics, scrap costs, and inspection deviations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800">
                  <span className="text-xs text-slate-400">Shift Total Scrap Cost</span>
                  <p className="text-2xl font-bold font-mono text-red-400 mt-1">₹12,600</p>
                  <p className="text-[11px] text-slate-400 mt-1">46 total pieces rejected</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0E131F] border border-slate-800">
                  <span className="text-xs text-slate-400">First-Pass Yield</span>
                  <p className="text-2xl font-bold font-mono text-white mt-1">95.9%</p>
                  <p className="text-[11px] text-amber-400 mt-1">Target tolerance: &gt;98.0%</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Customer Commitments & Dispatch SLA</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live commitments from Supabase database.</p>
              </div>

              <div className="p-5 rounded-lg bg-[#0E131F] border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Part Name</th>
                      <th className="pb-3">Completion</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 font-mono font-semibold text-white">{ord.order_number}</td>
                        <td className="py-3 text-slate-300">{ord.customer}</td>
                        <td className="py-3 text-slate-400">{ord.part_name}</td>
                        <td className="py-3 font-mono text-slate-200">{ord.completed_qty} / {ord.order_qty} pcs</td>
                        <td className="py-3 text-slate-300 font-mono text-[11px]">{ord.delivery_date}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENT INTERPRETER */}
          {activeTab === "docs" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Autonomous Document Interpreter
                    <span className="text-[11px] font-normal font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      OCR & Spec Extraction
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Extract penalty clauses, material composition tolerances, and delivery SLAs directly from factory PDFs.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {SAMPLE_DOCUMENTS.map((doc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDoc(doc)}
                      className={`px-3 py-1.5 rounded text-xs font-mono transition ${
                        selectedDoc.documentName === doc.documentName
                          ? "bg-amber-500 text-black font-bold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {doc.docType}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-5 rounded-lg bg-[#0E131F] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <FileText size={18} className="text-amber-500" />
                      <span className="font-mono text-sm font-bold text-white">{selectedDoc.documentName}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase font-mono mb-3">Extracted Metadata & Clauses:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(selectedDoc.extractedFields).map(([key, val]) => (
                        <div key={key} className="p-3 rounded bg-slate-900/80 border border-slate-800">
                          <span className="text-[11px] text-slate-500 font-mono block">{key}</span>
                          <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>Operational Line Impact Analysis</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedDoc.operationalImpact}</p>
                  </div>
                </div>

                <div className="p-5 rounded-lg bg-[#0E131F] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <AlertOctagon size={16} className="text-red-400" />
                      <span>Detected Anomalies</span>
                    </h3>
                    <div className="space-y-3 mt-4">
                      {selectedDoc.anomaliesDetected.map((anomaly, idx) => (
                        <div key={idx} className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-slate-200 leading-relaxed">
                          • {anomaly}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 mt-4">
                    <button
                      onClick={() => {
                        setActiveTab("actions");
                        setSelectedIntervention(interventions[0]);
                      }}
                      className="w-full py-2 rounded bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1.5"
                    >
                      <span>Trigger Recovery Protocol</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PHASE 12 CSV IMPORTS & INTEGRATIONS HUB */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Data Import & Ecosystem Integrations
                    <span className="text-[11px] font-normal font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ERP • PLC • CSV Engine
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Import factory operational spreadsheets and manage live connectors for TallyPrime, CNC Modbus, and ERP streams.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
                >
                  <Download size={14} className="text-emerald-400" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* Supported Integration Bridges */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Enterprise Integration Bridges
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {connectors.map((c) => (
                    <div key={c.id} className="p-4 rounded-lg bg-[#0E131F] border border-slate-800 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {c.category}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              c.status === "CONNECTED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : c.status === "STANDBY"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{c.name}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{c.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 mt-3 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                        <span>Sync: {c.lastSync}</span>
                        <Radio size={13} className={c.status === "CONNECTED" ? "text-emerald-400 animate-pulse" : "text-slate-600"} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CSV Raw Data Importer & Parser */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-lg bg-[#0E131F] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <UploadCloud size={16} className="text-amber-500" />
                      <span>Shop-Floor CSV Ingestion Editor</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Target: machines table</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Paste raw machine telemetry rows or upload an exported shift report to ingest into your tenant's database partition.
                  </p>

                  <textarea
                    rows={7}
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    placeholder="id,name,line,operator,status,efficiency,output..."
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleValidateCsv}
                      className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
                    >
                      Parse & Validate Schema
                    </button>

                    <button
                      onClick={handleCommitCsvToDatabase}
                      disabled={parsedRows.length === 0 || isImporting}
                      className={`px-4 py-2 rounded font-bold uppercase tracking-wider text-xs transition flex items-center space-x-1.5 ${
                        parsedRows.length > 0 && !isImporting
                          ? "bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isImporting ? (
                        <span>Ingesting to Supabase...</span>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Commit {parsedRows.length} Records to DB</span>
                        </>
                      )}
                    </button>
                  </div>

                  {importSuccessMsg && (
                    <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center space-x-2">
                      <CheckCircle2 size={16} />
                      <span>{importSuccessMsg}</span>
                    </div>
                  )}

                  {parseErrors.length > 0 && (
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400 space-y-1">
                      {parseErrors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Preview Table */}
                <div className="p-5 rounded-lg bg-[#0E131F] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
                      <span>Parsed Data Schema Preview</span>
                      <span className="text-[10px] font-mono text-amber-400">{parsedRows.length} Rows Ready</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Click "Parse & Validate Schema" to inspect column mappings before cloud ingestion.</p>

                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px]">
                            <th className="pb-2">ID</th>
                            <th className="pb-2">Machine</th>
                            <th className="pb-2">Line</th>
                            <th className="pb-2">Operator</th>
                            <th className="pb-2">Eff %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {parsedRows.length > 0 ? (
                            parsedRows.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-900/40">
                                <td className="py-2 text-amber-400 font-bold">{r.id}</td>
                                <td className="py-2 text-slate-300">{r.name}</td>
                                <td className="py-2 text-slate-400">{r.line}</td>
                                <td className="py-2 text-slate-400">{r.operator}</td>
                                <td className="py-2 text-emerald-400">{r.efficiency}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-600">
                                No parsed rows in memory. Click "Parse & Validate Schema" above.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 mt-4 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Tenant Tag: {currentTenant.name}</span>
                    <span>Format: UTF-8 Comma-Separated</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACTION & GOVERNANCE */}
          {activeTab === "actions" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Action & Human Governance Center
                    <span className="text-[11px] font-normal font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      RBAC Enforced
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role}).
                  </p>
                </div>
                {!canExecute && (
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
                    <Lock size={13} />
                    <span>View-Only Mode (Sign-off Restricted to Leads)</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {interventions.map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-lg border transition ${
                      item.status === "COMPLETED"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-[#0E131F] border-amber-500/40 hover:border-amber-500/70"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/20 text-amber-400 border-amber-500/40">
                            {item.status === "COMPLETED" ? "DISPATCHED" : `${item.priority} • ${item.category}`}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">{item.id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
                      </div>

                      <div className="shrink-0 flex items-center md:self-center">
                        {item.status === "PENDING_APPROVAL" ? (
                          <button
                            onClick={() => {
                              setSelectedIntervention(item);
                              setCheckedItems({});
                            }}
                            className="px-4 py-2.5 rounded bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-amber-500/10 flex items-center space-x-2"
                          >
                            <ShieldCheck size={16} />
                            <span>Review & Authorize</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                            <Check size={16} />
                            <span>Executed & Logged</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Supabase Audit Trail Table */}
              <div className="p-5 rounded-lg bg-[#0E131F] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileCheck size={16} className="text-emerald-400" />
                      <span>Tenant Audit Trail ({currentTenant.name})</span>
                    </h3>
                    <p className="text-xs text-slate-400">Strictly isolated by Tenant UUID: {currentTenant.id}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                        <th className="pb-3">Audit ID</th>
                        <th className="pb-3">Action Type</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Authorized By</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Logged At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/50 transition">
                            <td className="py-3 font-mono font-semibold text-amber-400">{log.id}</td>
                            <td className="py-3 font-mono text-slate-300 text-[11px]">{log.action_type}</td>
                            <td className="py-3 text-slate-300 max-w-md truncate">{log.description}</td>
                            <td className="py-3 text-slate-400">{log.authorized_by}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-slate-400 text-[11px]">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 font-mono">
                            No audit logs for this factory partition yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* 3. AI OPERATIONS COPILOT DRAWER */}
        {showAiDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-[#0E131F] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>Shadow-Ops AI Copilot</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">Factory Telemetry Intelligence</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiDrawer(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-lg leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-amber-500 text-black font-medium rounded-tr-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="px-4 py-2 border-t border-slate-800/80 bg-[#0B0F17]/40 flex gap-2 overflow-x-auto text-[11px]">
                <button
                  onClick={() => handleSendMessage("Explain Orion PO delay risk")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap border border-slate-700"
                >
                  ⚡ Orion Delay Analysis
                </button>
                <button
                  onClick={() => handleSendMessage("Suggest optimal machine reroute plan")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap border border-slate-700"
                >
                  🔄 Reroute CNC-02
                </button>
                <button
                  onClick={() => handleSendMessage("Update on SS-304 material status")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap border border-slate-700"
                >
                  📦 SS-304 Shortage
                </button>
              </div>

              <div className="p-4 border-t border-slate-800 bg-[#0B0F17] flex items-center space-x-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask AI Copilot regarding shop-floor issues..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="p-2 rounded bg-amber-500 hover:bg-amber-600 text-black font-bold transition"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. ALERT DRAWER */}
        {showAlertDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-[#0E131F] border-l border-slate-800 h-full flex flex-col shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase font-mono">Active Risks ({alerts.length})</h3>
                <button onClick={() => setShowAlertDrawer(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {alerts.map((alt) => (
                  <div key={alt.id} className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-red-400 uppercase">{alt.severity}</span>
                    <h4 className="text-xs font-bold text-white">{alt.title}</h4>
                    <p className="text-[11px] text-slate-300">{alt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. RBAC APPROVAL WORKFLOW MODAL */}
      {selectedIntervention && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131F] border border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Operational Sign-Off & RBAC Authorization
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Signee: {currentUser.name} ({currentUser.role})
                </p>
              </div>
              <button onClick={() => setSelectedIntervention(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {!canExecute && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 flex items-center space-x-2">
                  <Lock size={15} />
                  <span>
                    Your current role ({currentUser.role}) cannot authorize line changes. Switch to Operations Lead or Plant Head to execute.
                  </span>
                </div>
              )}

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <p className="text-slate-300">{selectedIntervention.summary}</p>
                <div className="flex gap-4 text-[11px] font-mono text-slate-400">
                  <span>Cost: <strong className="text-amber-400">₹{selectedIntervention.impact.estimatedCostInr}</strong></span>
                  <span>Avoided Loss: <strong className="text-emerald-400">₹{selectedIntervention.impact.avoidedLossInr}</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase font-mono">Safety Verification Checklist</h4>
                {selectedIntervention.safetyChecklist.map((checkText, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className="p-3 rounded bg-slate-900 border border-slate-800 cursor-pointer flex items-center space-x-3 text-xs"
                  >
                    {checkedItems[idx] ? <CheckSquare size={16} className="text-emerald-400" /> : <Square size={16} className="text-slate-600" />}
                    <span className="text-slate-300">{checkText}</span>
                  </div>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono"
                  placeholder="Manager dispatch directive..."
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedIntervention(null)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveWorkflow}
                  disabled={!allChecksSatisfied || !canExecute || isSubmitting}
                  className={`px-5 py-2 rounded font-bold uppercase text-xs transition ${
                    allChecksSatisfied && canExecute && !isSubmitting
                      ? "bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? "Logging..." : "Sign & Dispatch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}