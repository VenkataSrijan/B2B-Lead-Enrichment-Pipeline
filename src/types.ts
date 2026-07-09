export interface CompanyMetadata {
  domain: string;
  name: string;
  size: number;
  industry: string;
  funding: number;
  hq: string;
  description: string;
  technologies: string[];
}

export interface QualificationResult {
  is_qualified: boolean;
  alignment_score: number;
  justification: string;
  recommended_outbound_angle: string;
}

export interface LeadProfile {
  id: string;
  domain: string;
  company_name: string;
  employee_count: number;
  industry: string;
  total_funding_usd: number;
  geographic_headquarters: string;
  technologies: string[];
  is_qualified: boolean;
  alignment_score: number;
  justification: string;
  recommended_outbound_angle: string;
  processed_at: string;
  simulated?: boolean;
}
