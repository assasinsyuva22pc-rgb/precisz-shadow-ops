// Precisz Shadow-Ops: Phase 11 AI Operations Copilot & Document Interpreter Engine

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  suggestedActionId?: string;
}

export interface InterpretedDoc {
  docType: "PURCHASE_ORDER" | "MILL_TEST_CERT" | "INSPECTION_REPORT";
  documentName: string;
  extractedFields: { [key: string]: string };
  anomaliesDetected: string[];
  operationalImpact: string;
}

export const SAMPLE_DOCUMENTS: InterpretedDoc[] = [
  {
    docType: "PURCHASE_ORDER",
    documentName: "PO_Orion_Systems_2026_904.pdf",
    extractedFields: {
      "PO Number": "ORD-2026-904",
      "Customer": "Orion Industrial Systems Pvt Ltd",
      "Part Spec": "Precision Drive Shaft (SS-304 25mm OD)",
      "Order Qty": "1,000 units",
      "Agreed Deadline": "Friday, 17:00 IST",
      "Late Penalty Clause": "0.5% per hour delay (Max capped at ₹25,000)"
    },
    anomaliesDetected: [
      "No shipment buffer tolerance provided by customer",
      "Strict zero-burr surface finish specification (Ra < 0.8 µm)"
    ],
    operationalImpact: "Production buffer exhausted due to CNC Lathe #03 breakdown. Immediate shift overtime required to protect margin."
  },
  {
    docType: "MILL_TEST_CERT",
    documentName: "MTC_MadrasSteel_Heat7822.pdf",
    extractedFields: {
      "Heat Number": "HT-SS304-7822",
      "Supplier": "Madras Steel Stockholders",
      "Tensile Strength": "590 MPa (Standard: 515-700 MPa)",
      "Yield Strength": "235 MPa (Standard: >205 MPa)",
      "Elongation": "45%",
      "Hardness": "HRB 88 (Max standard: 92)"
    },
    anomaliesDetected: [
      "Hardness HRB 88 is on the higher permissible limit; may accelerate insert tool wear by 14%"
    ],
    operationalImpact: "Tool wear monitoring on CNC-01 and CNC-02 must be stepped up to avoid premature surface chatter."
  }
];

export function generateAssistantResponse(prompt: string, contextSummary: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("orion") || p.includes("delay") || p.includes("risk")) {
    return `Analysis for Orion Systems PO #ORD-2026-904:
- Bottleneck: CNC Lathe #03 breakdown (45m downtime) caused an 85-piece production deficit.
- Stock Deficit: SS-304 25mm raw stock has only 40 kg available vs 260 kg required for the remaining 380 pieces.
- Impact: Projected delivery delay of 2.2 hours past the 17:00 Friday deadline, triggering a ₹25,000 SLA penalty.
- Recommendation: Authorize the 2-hour shift overtime reroute to CNC Lathe #02 in the Action Center.`;
  }

  if (p.includes("reroute") || p.includes("cnc-02") || p.includes("machine")) {
    return `Line Reroute Protocol Feasibility:
- CNC Lathe #02 is running at 96% efficiency with Murugan K operating Line A pinions.
- Line B Drive Shaft CNC program is 100% compatible with CNC Lathe #02 Fanuc controller.
- Tooling setup requires a 15-minute collet change for 25mm SS-304 bars.
- Cost estimate: ₹2,400 overtime allowance saves ₹25,000 customer liquidated damages.`;
  }

  if (p.includes("ss-304") || p.includes("supplier") || p.includes("material")) {
    return `Procurement Telemetry Update:
- Madras Steel Stockholders transit dispatch delayed by 24h due to carrier logistics.
- Recommended Action: Trigger automated expedite PO escalation to dispatch a priority courier from Ambattur stock point for 260 kg immediately.`;
  }

  return `Precisz Shadow-Ops Copilot: Factory context loaded (${contextSummary}). All lines telemetry is synchronized with PostgreSQL. How can I assist with shop-floor optimization?`;
}