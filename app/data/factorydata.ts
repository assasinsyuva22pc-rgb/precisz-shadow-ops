// Fictional Factory Synthetic Dataset: ABC Precision Components (Ambattur, Chennai)
// Demonstration Mode - Connected Operational Records

export interface OrderItem {
  id: string;
  orderNumber: string;
  customer: string;
  partName: string;
  orderQty: number;
  completedQty: number;
  deliveryDate: string;
  orderValue: number;
  status: "On Schedule" | "At Risk" | "Delayed";
  assignedLine: string;
}

export interface InventoryItem {
  materialCode: string;
  description: string;
  category: string;
  onHandKg: number;
  reservedKg: number;
  availableKg: number;
  reorderPointKg: number;
  unitCost: number;
  supplier: string;
  supplierStatus: string;
}

export interface QualityRecord {
  batchId: string;
  partName: string;
  inspected: number;
  passed: number;
  rejected: number;
  defectReason: string;
  scrapCost: number;
  machineId: string;
}

export const SYNTHETIC_ORDERS: OrderItem[] = [
  {
    id: "ORD-01",
    orderNumber: "ORD-2026-904",
    customer: "Orion Industrial Systems",
    partName: "Precision Drive Shaft (SS-304)",
    orderQty: 1000,
    completedQty: 620,
    deliveryDate: "Friday, 17:00",
    orderValue: 500000,
    status: "At Risk",
    assignedLine: "Line B - Drive Shafts"
  },
  {
    id: "ORD-02",
    orderNumber: "ORD-2026-889",
    customer: "TVS Ancillary Unit",
    partName: "Helical Pinion Gear",
    orderQty: 2500,
    completedQty: 2100,
    deliveryDate: "Monday, 10:00",
    orderValue: 375000,
    status: "On Schedule",
    assignedLine: "Line A - Pinions"
  },
  {
    id: "ORD-03",
    orderNumber: "ORD-2026-912",
    customer: "Sundaram Fasteners Vendor",
    partName: "M16 Flange Bush",
    orderQty: 5000,
    completedQty: 4800,
    deliveryDate: "Tomorrow, 14:00",
    orderValue: 180000,
    status: "On Schedule",
    assignedLine: "Line C - Housings"
  }
];

export const SYNTHETIC_INVENTORY: InventoryItem[] = [
  {
    materialCode: "MAT-SS304-25MM",
    description: "SS-304 Round Bar 25mm",
    category: "Raw Material",
    onHandKg: 420,
    reservedKg: 380,
    availableKg: 40,
    reorderPointKg: 500,
    unitCost: 285,
    supplier: "Madras Steel Stockholders",
    supplierStatus: "ETA Delayed by 24h"
  },
  {
    materialCode: "MAT-EN8-32MM",
    description: "EN-8 Carbon Steel Rod 32mm",
    category: "Raw Material",
    onHandKg: 1850,
    reservedKg: 900,
    availableKg: 950,
    reorderPointKg: 600,
    unitCost: 82,
    supplier: "Coimbatore Alloy Tradelinks",
    supplierStatus: "Delivered On Time"
  },
  {
    materialCode: "MAT-AL6061-T6",
    description: "Aluminium 6061 Bar 40mm",
    category: "Raw Material",
    onHandKg: 780,
    reservedKg: 200,
    availableKg: 580,
    reorderPointKg: 300,
    unitCost: 240,
    supplier: "Chennai Extrusions Pvt Ltd",
    supplierStatus: "Normal Stock"
  }
];

export const SYNTHETIC_QUALITY: QualityRecord[] = [
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