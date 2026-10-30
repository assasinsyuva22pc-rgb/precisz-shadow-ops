// Precisz Shadow-Ops: Phase 10 Multi-Tenant RBAC & Auth Engine

export type UserRole = "PLANT_HEAD" | "OPERATIONS_LEAD" | "LINE_SUPERVISOR" | "QUALITY_INSPECTOR";

export interface FactoryTenant {
  id: string;
  name: string;
  location: string;
  code: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  factoryId: string;
}

export const REGISTERED_TENANTS: FactoryTenant[] = [
  {
    id: "b47c0b7e-9188-466d-88b1-91d4e08f5123",
    name: "ABC Precision Components",
    location: "Ambattur, Chennai",
    code: "ABC-AMB"
  },
  {
    id: "c58d1c8f-8299-577e-99c2-02e5f19f6234",
    name: "Precisz Heavy Forge Tech",
    location: "Sriperumbudur Industrial Park",
    code: "PST-SRP"
  }
];

export const AVAILABLE_USERS: UserSession[] = [
  {
    id: "USR-01",
    name: "Yuvaraj V",
    email: "yuva@precisz.com",
    role: "OPERATIONS_LEAD",
    factoryId: "b47c0b7e-9188-466d-88b1-91d4e08f5123"
  },
  {
    id: "USR-02",
    name: "Murugan K",
    email: "murugan@abcprec.com",
    role: "LINE_SUPERVISOR",
    factoryId: "b47c0b7e-9188-466d-88b1-91d4e08f5123"
  },
  {
    id: "USR-03",
    name: "Vignesh P",
    email: "vignesh.qc@precisz.com",
    role: "QUALITY_INSPECTOR",
    factoryId: "b47c0b7e-9188-466d-88b1-91d4e08f5123"
  },
  {
    id: "USR-04",
    name: "Sundaram R",
    email: "sundaram.gm@abcprec.com",
    role: "PLANT_HEAD",
    factoryId: "b47c0b7e-9188-466d-88b1-91d4e08f5123"
  }
];

export function hasExecutionPrivilege(role: UserRole): boolean {
  return role === "PLANT_HEAD" || role === "OPERATIONS_LEAD";
}