// Precisz Shadow-Ops: Phase 12 CSV/Excel Import & Integration Hub Engine

export interface IntegrationConnector {
  id: string;
  name: string;
  category: "ERP" | "PLC_IOT" | "WEBHOOK" | "ACCOUNTING";
  description: string;
  status: "CONNECTED" | "STANDBY" | "DISCONNECTED";
  lastSync: string;
  endpointUrl: string;
}

export const SUPPORTED_CONNECTORS: IntegrationConnector[] = [
  {
    id: "CONN-TALLY-01",
    name: "TallyPrime ERP Connector",
    category: "ACCOUNTING",
    description: "Automatic synchronization of raw material purchase vouchers and inventory ledgers.",
    status: "CONNECTED",
    lastSync: "3 mins ago",
    endpointUrl: "http://192.168.1.50:9000/tally-bridge"
  },
  {
    id: "CONN-FANUC-IOT",
    name: "Fanuc FOCAS CNC Gateway",
    category: "PLC_IOT",
    description: "Direct shop-floor RS232/Ethernet feed for spindle RPM, cycle duration, and emergency stops.",
    status: "CONNECTED",
    lastSync: "Realtime Stream",
    endpointUrl: "modbus-tcp://10.14.0.12:502"
  },
  {
    id: "CONN-WA-ALERTS",
    name: "Operations WhatsApp Webhook",
    category: "WEBHOOK",
    description: "Dispatches critical breakdown notifications and recovery plans directly to plant head mobile.",
    status: "STANDBY",
    lastSync: "Trigger-based",
    endpointUrl: "https://api.precisz.com/v1/notify/whatsapp"
  },
  {
    id: "CONN-SAP-SYNC",
    name: "SAP Business One API",
    category: "ERP",
    description: "Synchronizes pending client delivery milestones and purchase orders with dispatch schedules.",
    status: "DISCONNECTED",
    lastSync: "Never",
    endpointUrl: "https://sap.abcprecision.in:50000/b1s/v2"
  }
];

export interface ParsedCsvRow {
  id: string;
  name: string;
  line: string;
  operator: string;
  status: string;
  efficiency: number;
  output: string;
}

export function parseMachineCSV(csvText: string): { data: ParsedCsvRow[]; errors: string[] } {
  const lines = csvText.trim().split("\n");
  const errors: string[] = [];
  const data: ParsedCsvRow[] = [];

  if (lines.length < 2) {
    errors.push("CSV file must contain a header row and at least one data row.");
    return { data, errors };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredFields = ["id", "name", "line", "operator", "status", "efficiency", "output"];
  const missingFields = requiredFields.filter((f) => !header.includes(f));

  if (missingFields.length > 0) {
    errors.push(`Missing required column headers: ${missingFields.join(", ")}`);
    return { data, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;
    const values = rawLine.split(",").map((v) => v.trim());

    if (values.length < requiredFields.length) {
      errors.push(`Row ${i + 1}: Incomplete columns detected.`);
      continue;
    }

    const rowObj: any = {};
    header.forEach((col, idx) => {
      rowObj[col] = values[idx];
    });

    data.push({
      id: rowObj.id,
      name: rowObj.name,
      line: rowObj.line,
      operator: rowObj.operator,
      status: rowObj.status || "Running",
      efficiency: Number(rowObj.efficiency) || 90.0,
      output: rowObj.output || "0 pcs"
    });
  }

  return { data, errors };
}

export const SAMPLE_CSV_CONTENT = `id,name,line,operator,status,efficiency,output
CNC-04,CNC Lathe #04,Line B - Drive Shafts,M. Ramesh,Running,97.5,210 pcs
VMC-02,5-Axis VMC #02,Line C - Housings,G. Karthik,Running,95.0,180 pcs
GRIND-01,Cylindrical Grinder #01,Line D - Finishing,T. Kumar,Running,92.0,140 pcs`;