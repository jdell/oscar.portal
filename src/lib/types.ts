export type UUID = string;

export interface Organization {
  id: UUID;
  name: string;
  shortName?: string | null;
}

export interface AuthSession {
  token: string;
  refreshToken?: string | null;
  expiresAt?: string | null;        // refresh token expiry
  tokenExpiresAt?: string | null;   // access token expiry
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

export interface Address {
  street?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Agency {
  id: UUID;
  organizationId: UUID;
  name: string;
  shortName?: string | null;
  status: AgencyStatus;
  active?: boolean;
  address?: Address | null;
  primaryLocation?: string | null;
  staffCount: number;
  directorId?: UUID | null;
  directorName?: string | null;
  permissions?: UUID[];
  counties?: UUID[];
  insurers?: UUID[];
  healthyLivingResources?: UUID[];
  medicalResources?: UUID[];
  createdAt: string;
  updatedAt: string;
}

export interface AgencyCohort {
  id: UUID;
  pid: number;
  numberOfSessions: number;
  startDate: string;
  endDate: string;
}

export interface AgencyLocation {
  id: UUID;
  name: string;
  description?: string | null;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isArchived?: boolean;
}

export interface County {
  id: UUID;
  name: string;
  state?: string | null;
}

export interface AgencyFilterOptions {
  states: string[];
  counties: { id: UUID; name: string }[];
  insurers: { id: UUID; name: string }[];
}

export interface AgencySummary {
  total: number;
  active: number;
  newInPeriod: number;
  newInPreviousPeriod: number;
  sparkline7d: number[];
}

export interface AgencyDetail extends Agency {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  locations: AgencyLocation[];
  staff: StaffMember[];
  cohorts?: AgencyCohort[];
  permissionsDetail?: Permission[];
  insurersDetail?: Insurer[];
  countiesDetail?: County[];
  healthyLivingResourcesDetail?: Resource[];
  medicalResourcesDetail?: Resource[];
  director?: { id: UUID; name: string } | null;
}

export type PhoneNumberType =
  | "mobile"
  | "home"
  | "work"
  | "fax"
  | "other";

export interface PhoneNumber {
  number: string;
  type: PhoneNumberType;
}

export interface AgencyRole {
  agencyId: UUID;
  agencyName?: string | null;
  roleId: UUID;
  roleName?: string | null;
}

export interface User {
  id: UUID;
  staffMemberId: UUID;
  username: string;
  isAdmin: boolean;
}

export interface StaffMember {
  id: UUID;
  organizationId: UUID;
  agencyId?: UUID | null;
  agencyName?: string | null;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  emailAddress?: string;
  phone?: string | null;
  phoneNumbers?: PhoneNumber[];
  title?: string | null;
  address?: Address | null;
  supervisorId?: UUID | null;
  medicalLiasonId?: UUID | null;
  agencies?: AgencyRole[];
  isSurveyEnabled?: boolean;
  user?: User | null;
  roles: string[];
  active?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface StaffMemberDetail extends StaffMember {
  agenciesDetail?: Agency[];
  permissionsDetail?: Permission[];
}

export type ResourceCategory = "medical" | "healthy_living";

export interface MedicalResourceType {
  id: UUID;
  name: string;
}

export interface HealthyLivingResourceType {
  id: UUID;
  name: string;
}

export interface PartnerType {
  id: UUID;
  name: string;
  description?: string | null;
}

export interface ProgramType {
  id: UUID;
  name: string;
  description?: string | null;
}

export interface ResourceProvider {
  id: UUID;
  name: string;
  active?: boolean;
}

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
  emailAddress?: string | null;
  website?: string | null;
  url?: string | null;
  hours?: string | null;
  notes?: string | null;
  isActive: boolean;
  active?: boolean;
  acceptingNewClients?: boolean;
  indigentCare?: boolean;
  slidingFeeScale?: boolean;
  interviewCheck?: boolean;
  publicTransportation?: boolean;
  bilingualStaff?: boolean;
  address?: Address | null;
  phoneNumbers?: PhoneNumber[];
  resourceTypes?: UUID[];
  insurers?: UUID[];
  agencies?: UUID[];
  reasons?: UUID[];
  providers?: UUID[];
  partnerTypes?: UUID[];
  programTypes?: UUID[];
  primaryContact?: string | null;
  services?: string | null;
  createdAt: string;
}

export interface ReferralReason {
  id: UUID;
  name: string;
  description?: string | null;
}

export interface ResourceDetail extends Resource {
  insurersDetail?: Insurer[];
  agenciesDetail?: Agency[];
  referralReasons?: ReferralReason[];
  resourceTypesDetail?: MedicalResourceType[];
  providersDetail?: ResourceProvider[];
  partnerTypesDetail?: PartnerType[];
  programTypesDetail?: ProgramType[];
}

export interface ProviderParticipationType {
  id: number;
  name: string;
  description?: string | null;
}

export interface MedicalResourceAddress {
  city?: string | null;
  state?: string | null;
}

export interface MedicalResourceSummary {
  id: number;
  name: string;
  address?: MedicalResourceAddress | null;
  primaryContact?: string | null;
}

export interface Provider {
  id: number;
  name: string;
  emailAddress?: string | null;
  medicalResourceId?: number | null;
  providerParticipationTypeId?: number | null;
  active: boolean;
  medicalResource?: MedicalResourceSummary | null;
  participationType?: ProviderParticipationType | null;
}

export type InsurerType = "medicare" | "medicaid" | "private" | "other";

export const INSURER_TYPES: InsurerType[] = [
  "medicare",
  "medicaid",
  "private",
  "other",
];

export interface Insurer {
  id: number;
  name: string;
  type?: InsurerType | null;
  coverage?: string | null;
  /** @deprecated kept for legacy consumer pages — not in admin form */
  shortName?: string | null;
}

export interface Location {
  id: UUID;
  organizationId?: UUID;
  agencyId?: UUID | null;
  name: string;
  description?: string | null;
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

// ---- Surveys ----

export enum SurveyLanguage {
  English = 2,
  Spanish = 3,
}

export enum SurveyQuestionType {
  Radio = 0,
  Checkbox = 1,
  Text = 2,
  Info = 3,
}

export interface SurveyQuestionTranslation {
  id: number;
  surveyQuestionId: number;
  languageId: number;
  text: string;
}

export interface SurveyAnswerTranslation {
  id: number;
  surveyAnswerId: number;
  languageId: number;
  text: string;
}

export interface SurveyAnswer {
  id: number;
  surveyQuestionId: number;
  value: number;
  text: string;
  translations: SurveyAnswerTranslation[];
}

export interface SurveyQuestion {
  id: number;
  surveyId: number;
  text: string;
  type: number;
  answers: SurveyAnswer[];
  translations: SurveyQuestionTranslation[];
}

export interface Survey {
  id: number;
  name: string;
  description: string;
  active: boolean;
  organizationId?: number;
  updatedAt?: string;
  questions: SurveyQuestion[];
}
