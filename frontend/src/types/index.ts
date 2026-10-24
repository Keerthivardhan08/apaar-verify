// ============================================================
// APAAR Verify — Type Definitions
// ============================================================

export interface UserRole {
  role: string;
  institution_id: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: UserRole[];
  phone_number?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface Institution {
  id: string;
  institution_code: string;
  name: string;
  institution_type: string;
  state: string;
  city: string;
  status: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  total_programs?: number;
  total_records?: number;
  flagged_records?: number;
}

export interface InstitutionStats {
  institution: Institution;
  total_records: number;
  valid_records: number;
  flagged_records: number;
  batches_count: number;
  intake_utilization: number;
  open_issues_count: number;
}

export interface Program {
  id: string;
  institution_id: string;
  program_code: string;
  program_name: string;
  academic_level: string;
  branch: string;
  status: string;
  duration_years?: number;
  created_at?: string;
}

export interface IntakeLimit {
  id: string;
  program_id: string;
  admission_cycle: string;
  approved_capacity: number;
  category: string;
  source_type: string;
  verification_status: string;
  program_name?: string;
  program_code?: string;
  institution_name?: string;
}

export interface StudentRecord {
  id: string;
  institution_id: string;
  program_id: string;
  admission_cycle: string;
  institution_student_id: string;
  student_name: string;
  date_of_birth: string | null;
  gender: string | null;
  admission_category: string;
  admission_status: string;
  nri_category: string;
  oci_status: string;
  foreign_national_status: string;
  supernumerary_category: string;
  record_status: string;
  identity_verification_status: string;
  aadhaar_hash?: string | null;
  apaar_id?: string | null;
  identity_reference?: string | null;
  masked_identity_reference?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
  program_name?: string;
  program_code?: string;
  institution_name?: string;
  active_issue_count?: number;
}

export interface StudentRecordHistory {
  id: string;
  record_id: string;
  version: number;
  changed_by: string;
  changed_fields: Record<string, { old_value: any; new_value: any }>;
  change_reason?: string;
  created_at: string;
}

export interface CorrectionRequest {
  id: string;
  record_id: string;
  institution_id: string;
  status: 'pending' | 'approved' | 'rejected';
  field_name: string;
  original_value: string;
  proposed_value: string;
  justification: string;
  requested_by: string;
  reviewed_by?: string | null;
  review_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  student_name?: string;
  institution_student_id?: string;
}

export interface UploadBatch {
  id: string;
  institution_id: string;
  file_name: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  admission_cycle: string;
  created_at: string;
  completed_at: string | null;
  uploaded_by?: string;
  error_summary?: Record<string, number>;
}

export interface ValidationIssue {
  id: string;
  record_id: string | null;
  batch_id: string | null;
  rule_code: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  description: string;
  affected_field: string | null;
  expected_condition: string | null;
  observed_condition: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_reason: string | null;
  institution_id?: string;
  institution_name?: string;
  student_name?: string;
  institution_student_id?: string;
  program_name?: string;
}

export interface IssueDecisionRequest {
  decision: 'confirmed_discrepancy' | 'corrected' | 'legitimate_exception' | 'duplicate_confirmed' | 'false_positive' | 'unresolved';
  reason: string;
}

export interface DashboardSummary {
  total_institutions: number;
  institutions_with_submissions: number;
  total_records: number;
  valid_records: number;
  flagged_records: number;
  pending_review: number;
  unresolved_high_severity: number;
  submission_completion_pct: number;
  identity_verification_distribution: Record<string, number>;
}

export interface IntakeSummary {
  institution_name: string;
  program_name: string;
  program_code: string;
  admission_cycle: string;
  approved_capacity: number;
  enrolled_count: number;
  utilization_pct: number;
  status: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  outcome: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface Credential {
  id: string;
  subject_reference: string;
  claims: Record<string, any>;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  credential_status: string;
  issuer?: string;
}

export interface CredentialVerificationResult {
  valid: boolean;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'REVOKED';
  credential?: Credential;
  is_mock_verification: boolean;
  message?: string;
  verified_at: string;
  claims?: Record<string, any>;
  issuer?: string;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  target_type: string | null;
  target_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sort_by?: string;
  sort_desc?: boolean;
}

export interface StudentFilterParams extends PaginationParams {
  institution_id?: string;
  program_id?: string;
  admission_cycle?: string;
  admission_category?: string;
  record_status?: string;
  identity_status?: string;
}

export interface IssueFilterParams extends PaginationParams {
  institution_id?: string;
  severity?: string;
  status?: string;
  rule_code?: string;
  batch_id?: string;
  assigned_to?: string;
}

export interface AuditFilterParams extends PaginationParams {
  action?: string;
  target_type?: string;
  actor_id?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================================
// Phase 2: Provider Adapters, Purpose & PKI Trust Types
// ============================================================

export interface ProviderInfo {
  key: string;
  name: string;
  description: string;
  type: string;
  auth_mechanism: string;
  status: string;
  latency_ms: number;
  environment: string;
}

export interface ProviderSyncResult {
  sync_id: string;
  provider: string;
  provider_display: string;
  status: string;
  records_processed: number;
  records_updated: number;
  records_failed: number;
  duration_ms: number;
  details_sample: Array<{
    student_id: string;
    student_name: string;
    identifier_ref: string;
    status: string;
    provider_reference: string;
  }>;
  message: string;
}

export interface VerificationPurpose {
  id: string;
  name: string;
  description: string;
  permitted_claims: string[];
  privacy_score: string;
}

export interface ConsentRecord {
  id: string;
  student_id: string;
  purpose: string;
  permitted_claims: string[];
  consent_token: string;
  consent_status: string;
  requester_entity: string | null;
  granted_at: string;
  expires_at: string;
}

export interface JWKSKey {
  kty: string;
  use: string;
  alg: string;
  kid: string;
  n: string;
  e: string;
}

export interface JWKSResponse {
  keys: JWKSKey[];
}

export interface PKIMetadata {
  key_id: string;
  algorithm: string;
  key_type: string;
  key_usage: string;
  jwk: JWKSKey;
  public_key_pem: string;
  jwks_url: string;
  status: string;
}

// ============================================================
// Phase 3: Institutional APIs, Freshness & ZK Privacy Types
// ============================================================

export interface InstitutionalApiKey {
  id: string;
  institution_id: string;
  key_name: string;
  api_key_prefix: string;
  api_key_secret?: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface InstitutionalWebhook {
  id: string;
  institution_id: string;
  target_url: string;
  secret_token: string;
  event_types: string[];
  is_active: boolean;
  created_at: string;
}

export interface FreshnessProfile {
  institution_id: string;
  institution_code: string;
  institution_name: string;
  state: string;
  city: string;
  total_records: number;
  open_discrepancies: number;
  last_submission_at: string | null;
  days_since_last_submission: number;
  freshness_status: 'FRESH' | 'MODERATE' | 'STALE' | 'CRITICAL_SLA_BREACHED';
  sla_rating: string;
  sla_threshold_days: number;
  next_reconciliation_due: string;
}

export interface FreshnessOverview {
  total_institutions: number;
  sla_compliance_pct: number;
  summary: {
    fresh: number;
    moderate: number;
    stale: number;
    critical_sla_breached: number;
  };
  institutions: FreshnessProfile[];
  generated_at: string;
}

export interface ReconciliationRow {
  program_id: string;
  program_code: string;
  program_name: string;
  institution_id: string;
  institution_name: string;
  admission_cycle: string;
  authoritative_capacity: number;
  current_enrolled: number;
  variance: number;
  reconciliation_status: string;
  last_evaluated: string;
}

export interface ReconciliationReport {
  admission_cycle: string;
  total_programs_evaluated: number;
  total_authoritative_capacity: number;
  total_enrolled_count: number;
  overall_utilization_pct: number;
  total_discrepancies: number;
  reconciliation_rows: ReconciliationRow[];
  reconciliation_timestamp: string;
}

export interface ExpandedCorrection {
  id: string;
  record_id: string;
  institution_id: string;
  institution_name: string;
  stage: 'operator_draft' | 'inst_admin_approved' | 'aicte_verified' | 'rejected';
  workflow_status: 'pending_institution_admin' | 'pending_aicte_review' | 'approved_applied' | 'rejected';
  field_name: string;
  original_value: string;
  proposed_value: string;
  operator_notes: string;
  inst_admin_notes: string | null;
  aicte_reviewer_notes: string | null;
  created_at: string;
}

export interface BlindedProof {
  proof_id: string;
  proof_token: string;
  blinded_subject: string;
  predicate: string;
  predicate_description: string;
  assertion: boolean;
  verifier_audience: string;
  issued_at: string;
  expires_at: string;
  zero_pii: boolean;
  evidence_notes: string;
}

export interface ComplianceStudentRosterItem {
  id: string;
  student_name: string;
  institution_student_id: string;
  identity_reference?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  program_code: string;
  program_name: string;
  admission_category: string;
  admission_status: string;
  nri_category?: string;
  oci_status?: string;
  foreign_national_status?: string;
  supernumerary_category?: string;
  record_status: string;
  open_issues_count: number;
}

export interface InstitutionComplianceData {
  institution: {
    id: string;
    name: string;
    institution_code: string;
    institution_type: string;
    state: string;
    city: string;
    status: string;
  };
  admission_cycle: string;
  metrics: {
    approved_intake: number;
    actual_enrolment: number;
    utilization_pct: number;
    supernumerary_seats: number;
    nri_count: number;
    oci_count: number;
    foreign_national_count: number;
  };
  supernumerary_breakdown: {
    nri: number;
    foreign_national: number;
    kashmiri_migrant: number;
    other: number;
    none: number;
  };
  category_distribution: Record<string, number>;
  programs: Array<{
    program_id: string;
    program_code: string;
    program_name: string;
    approved_capacity: number;
    enrolled_count: number;
    utilization_pct: number;
    status: string;
  }>;
  students: ComplianceStudentRosterItem[];
}
