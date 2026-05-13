export interface DashboardStats {
  totalParticipants: number;
  totalScreenings: number;
  totalFollowUps: number;
  averageHealthScore: number;
}

export interface OutcomeBucket {
  label: string;
  count: number;
}

export interface OutcomesSummary {
  total: number;
  buckets: OutcomeBucket[];
}

export interface AgencyEffectiveness {
  agencyId: string;
  agencyName: string;
  participants: number;
  screeningsCompleted: number;
  followUpsCompleted: number;
  averageHealthScore: number;
  completionRate: number;
}

export interface ProgramEffectiveness {
  generatedAt: string;
  rangeStart?: string;
  rangeEnd?: string;
  byAgency: AgencyEffectiveness[];
}
