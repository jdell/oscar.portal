import { api, ApiError } from "@/lib/api";
import type {
  Agency,
  HealthyLivingResourceType,
  Insurer,
  MedicalResourceType,
  PartnerType,
  ProgramType,
  ReferralReason,
} from "@/lib/types";

export interface LookupOption {
  id: string;
  name: string;
}

async function safeList<T>(path: string): Promise<T[]> {
  try {
    const r = await api.get<T[] | { items: T[] }>(path);
    return Array.isArray(r) ? r : (r.items ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`lookup ${path} failed`, error.status);
    }
    return [];
  }
}

export interface ResourceLookups {
  resourceTypes: LookupOption[];
  insurers: LookupOption[];
  agencies: LookupOption[];
  reasons: LookupOption[];
  partnerTypes: LookupOption[];
  programTypes: LookupOption[];
}

export async function loadResourceLookups(
  category: "medical" | "healthy_living",
): Promise<ResourceLookups> {
  const typePath =
    category === "medical"
      ? "/medical-resource-types"
      : "/healthy-living-resource-types";
  const [types, insurers, agencies, reasons, partnerTypes, programTypes] =
    await Promise.all([
      safeList<MedicalResourceType | HealthyLivingResourceType>(typePath),
      safeList<Insurer>("/insurers"),
      safeList<Agency>("/agencies"),
      safeList<ReferralReason>("/referral-reasons"),
      safeList<PartnerType>("/partner-types"),
      safeList<ProgramType>("/program-types"),
    ]);

  return {
    resourceTypes: types.map((t) => ({ id: String(t.id), name: t.name })),
    insurers: insurers.map((i) => ({ id: String(i.id), name: i.name })),
    agencies: agencies.map((a) => ({ id: a.id, name: a.name })),
    reasons: reasons.map((r) => ({ id: r.id, name: r.name })),
    partnerTypes: partnerTypes.map((p) => ({ id: p.id, name: p.name })),
    programTypes: programTypes.map((p) => ({ id: p.id, name: p.name })),
  };
}
