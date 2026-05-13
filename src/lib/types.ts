export type UUID = string;

export interface Organization {
  id: UUID;
  name: string;
  shortName?: string | null;
}

export interface AuthSession {
  token: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  user: {
    id: UUID;
    email: string;
    displayName: string;
    organizationId: UUID;
    organizationName: string;
    roles: string[];
  };
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type AgencyStatus = "active" | "inactive" | "pending";

export interface Agency {
  id: UUID;
  organizationId: UUID;
  name: string;
  shortName?: string | null;
  status: AgencyStatus;
  primaryLocation?: string | null;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyDetail extends Agency {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  locations: Location[];
  staff: StaffMember[];
}

export interface StaffMember {
  id: UUID;
  organizationId: UUID;
  agencyId?: UUID | null;
  agencyName?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface StaffMemberDetail extends StaffMember {
  agencies: Agency[];
  permissions: Permission[];
}

export type ResourceCategory = "medical" | "healthy_living";

export interface Resource {
  id: UUID;
  organizationId: UUID;
  name: string;
  category: ResourceCategory;
  resourceTypeId?: UUID | null;
  resourceTypeName?: string | null;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralReason {
  id: UUID;
  name: string;
  description?: string | null;
}

export interface ResourceDetail extends Resource {
  insurers: Insurer[];
  agencies: Agency[];
  referralReasons: ReferralReason[];
}

export interface Provider {
  id: UUID;
  organizationId: UUID;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  npi?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  linkedResourceId?: UUID | null;
  linkedResourceName?: string | null;
}

export interface Insurer {
  id: UUID;
  organizationId: UUID;
  name: string;
  shortName?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface Location {
  id: UUID;
  organizationId: UUID;
  agencyId?: UUID | null;
  name: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isActive: boolean;
}

export interface Role {
  id: UUID;
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface Permission {
  id: UUID;
  key: string;
  description: string;
  category: string;
}

export interface ReportSummary {
  totalAgencies: number;
  totalStaff: number;
  totalProviders: number;
  totalResources: number;
  activeReferralsLast30d: number;
}
