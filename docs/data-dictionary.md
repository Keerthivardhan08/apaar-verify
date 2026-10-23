# Data Dictionary — APAAR Verify

> **Note:** This data dictionary covers the MVP demonstration platform. Fields marked `[DEMO]` use demonstration-only formats and policies. Before any production deployment, all fields must be reviewed against the official AICTE/APAAR specifications.

---

## Table: `institutions`

| Field | Type | Required | Permitted Values | Sensitivity | Editable By Institution | Notes |
|-------|------|----------|-----------------|-------------|------------------------|-------|
| id | UUID | Auto | — | Internal | No | Server-generated primary key |
| institution_code | VARCHAR(50) | Yes | Alphanumeric + hyphen | Low | No | Unique across platform. Assigned by AICTE admin |
| name | VARCHAR(255) | Yes | Free text | Low | No | Official institution name |
| institution_type | VARCHAR(50) | Yes | engineering, medical, arts, pharmacy, management | Low | No | Classification |
| state | VARCHAR(100) | Yes | Indian state names | Low | No | State of registration |
| city | VARCHAR(100) | Yes | Free text | Low | No | City of main campus |
| status | VARCHAR(20) | Yes | active, inactive, suspended | Low | No | Platform participation status |
| created_at | TIMESTAMP | Auto | — | Internal | No | UTC |
| updated_at | TIMESTAMP | Auto | — | Internal | No | Updated on any field change |

---

## Table: `users`

| Field | Type | Required | Permitted Values | Sensitivity | Notes |
|-------|------|----------|-----------------|-------------|-------|
| id | UUID | Auto | — | Internal | Server-generated |
| email | VARCHAR(255) | Yes | Valid email format | Medium | Unique. Used as login identifier |
| password_hash | VARCHAR(255) | Yes | bcrypt hash | **High** | Never expose in API or logs |
| full_name | VARCHAR(255) | Yes | Free text | Medium | Display name |
| status | VARCHAR(20) | Yes | active, inactive, suspended | Internal | Inactive users cannot authenticate |
| last_login_at | TIMESTAMP | No | — | Internal | Updated on successful login |
| created_at | TIMESTAMP | Auto | — | Internal | — |
| updated_at | TIMESTAMP | Auto | — | Internal | — |

---

## Table: `user_roles`

| Field | Type | Required | Permitted Values | Notes |
|-------|------|----------|-----------------|-------|
| id | UUID | Auto | — | — |
| user_id | UUID (FK) | Yes | — | References users.id |
| role | VARCHAR(50) | Yes | institution_operator, institution_admin, aicte_admin, reviewer, verifier, student | Determines access scope |
| institution_id | UUID (FK) | Conditional | — | Required for institution-scoped roles. NULL for aicte_admin, reviewer, verifier |
| created_at | TIMESTAMP | Auto | — | — |

> A user may hold multiple roles. Institution-scoped roles MUST have institution_id populated.

---

## Table: `programs`

| Field | Type | Required | Permitted Values | Editable By Institution | Notes |
|-------|------|----------|-----------------|------------------------|-------|
| id | UUID | Auto | — | No | — |
| institution_id | UUID (FK) | Yes | — | No | Parent institution |
| program_code | VARCHAR(50) | Yes | Alphanumeric + hyphen | No | Unique within institution |
| program_name | VARCHAR(255) | Yes | Free text | No | Official program name |
| academic_level | VARCHAR(20) | Yes | ug, pg, diploma, phd | No | Level of study |
| branch | VARCHAR(100) | Yes | Free text | No | Engineering branch or specialization |
| duration_years | INT | Yes | 2, 3, 4, 5 | No | Program duration |
| status | VARCHAR(20) | Yes | active, inactive | No | — |

---

## Table: `intake_limits`

| Field | Type | Required | Permitted Values | Sensitivity | Notes |
|-------|------|----------|-----------------|-------------|-------|
| id | UUID | Auto | — | — | — |
| program_id | UUID (FK) | Yes | — | — | — |
| admission_cycle | VARCHAR(10) | Yes | YYYY-YY format e.g. 2026-27 | — | — |
| approved_capacity | INT | Yes | >= 0 | Low | Authoritative approved seats |
| category | VARCHAR(30) | Yes | general, obc, sc, st, ews, nri, supernumerary, total | — | Category-specific capacity |
| source_type | VARCHAR(20) | Yes | official, demonstration, provisional | **Critical** | Must not claim official without verified source |
| source_reference | VARCHAR(255) | No | Free text | Low | Document or dataset reference |
| effective_from | DATE | Yes | — | — | Cycle start date |
| effective_to | DATE | No | — | — | NULL means currently active |
| verification_status | VARCHAR(20) | Yes | verified, unverified, provisional | — | — |
| created_at | TIMESTAMP | Auto | — | — | — |

> **Important:** If source_type = 'official', the system must record the authorized source and authorization date. In this demo, all intake limits are `demonstration`.

---

## Table: `student_identities`

| Field | Type | Required | Sensitivity | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Auto | Internal | Server-generated reference |
| identifier_type | VARCHAR(20) | Yes | Medium | demo, apaar, abc_id |
| identifier_fingerprint | VARCHAR(255) | No | **High** | Keyed HMAC of the identifier. Used for matching without storing raw value. Key must be rotatable. |
| verification_status | VARCHAR(20) | Yes | Low | unverified, pending, mock_verified, verified, failed, unavailable, revoked |
| provider_reference | VARCHAR(255) | No | Medium | Reference returned by verification provider |
| created_at | TIMESTAMP | Auto | Internal | — |
| updated_at | TIMESTAMP | Auto | Internal | — |

> **Privacy note:** The identifier_fingerprint is a keyed HMAC. The raw identifier should not be stored. Even the fingerprint is linkable data and must be protected.
>
> The `verified` status may only be assigned via an authorized provider workflow. The mock provider assigns `mock_verified` only.

---

## Table: `student_records`

| Field | Type | Required | Permitted Values | Editable By Institution | Sensitivity | Notes |
|-------|------|----------|-----------------|------------------------|-------------|-------|
| id | UUID | Auto | — | No | Internal | — |
| institution_id | UUID (FK) | Yes | — | No | Low | Scoped to institution |
| program_id | UUID (FK) | Yes | — | Yes | Low | Must belong to same institution |
| student_identity_id | UUID (FK) | No | — | No | High | Set by system after identity matching |
| admission_cycle | VARCHAR(10) | Yes | YYYY-YY format | No | Low | e.g. 2026-27 |
| institution_student_id | VARCHAR(50) | Yes | Alphanumeric + hyphen | Yes | Medium | Internal student ID |
| student_name | VARCHAR(255) | Yes | Free text | Yes | Medium | Full name as per records |
| date_of_birth | DATE | No | Valid date | Yes | **High** | Mask in list views |
| gender | VARCHAR(20) | No | male, female, other, prefer_not_to_say | Yes | Medium | — |
| admission_category | VARCHAR(30) | Yes | general, obc, sc, st, ews, nri, oci, foreign_national, management_quota | Yes | Low | — |
| admission_status | VARCHAR(20) | Yes | admitted, provisional, cancelled, migrated | Yes | Low | — |
| nri_category | VARCHAR(20) | Yes | applicable, not_applicable | Yes | Low | — |
| oci_status | VARCHAR(20) | Yes | applicable, not_applicable | Yes | Low | — |
| foreign_national_status | VARCHAR(20) | Yes | applicable, not_applicable | Yes | Low | — |
| supernumerary_category | VARCHAR(30) | Yes | none, nri, foreign_national, kashmiri_migrant, other | Yes | Low | — |
| source_batch_id | UUID (FK) | No | — | No | Internal | Upload batch that created this record |
| record_status | VARCHAR(30) | Yes | draft, submitted, accepted, flagged, under_review, correction_requested, corrected, rejected | Partial | Internal | Workflow status |
| identity_verification_status | VARCHAR(20) | Yes | unverified, pending, mock_verified, verified, failed, unavailable | No | Low | Separate from record_status |
| created_at | TIMESTAMP | Auto | — | No | Internal | — |
| updated_at | TIMESTAMP | Auto | — | No | Internal | — |
| created_by | UUID (FK) | Auto | — | No | Internal | User who created the record |
| updated_by | UUID (FK) | Auto | — | No | Internal | User who last updated the record |

### Category Consistency Rules

| Condition | Rule | Severity |
|-----------|------|----------|
| nri_category = applicable | admission_category must be nri | high |
| oci_status = applicable | foreign_national_status must be not_applicable | warning |
| foreign_national_status = applicable | admission_category must be foreign_national | high |
| nri_category = applicable AND oci_status = applicable AND foreign_national_status = applicable | All three cannot be applicable simultaneously | critical |
| supernumerary_category = nri | nri_category must be applicable | warning |

---

## Table: `upload_batches`

| Field | Type | Required | Permitted Values | Notes |
|-------|------|----------|-----------------|-------|
| id | UUID | Auto | — | — |
| institution_id | UUID (FK) | Yes | — | — |
| submitted_by | UUID (FK) | Yes | — | — |
| file_name | VARCHAR(255) | Yes | — | Original filename only, not path |
| file_checksum | VARCHAR(64) | Yes | SHA-256 hex | Used for duplicate-batch detection |
| status | VARCHAR(30) | Yes | received, validating, validation_failed, ready_to_commit, processing, completed, completed_with_errors, failed | Batch lifecycle |
| total_rows | INT | Auto | >= 0 | Excludes header |
| valid_rows | INT | Auto | >= 0 | — |
| invalid_rows | INT | Auto | >= 0 | — |
| admission_cycle | VARCHAR(10) | Yes | YYYY-YY | — |
| created_at | TIMESTAMP | Auto | — | — |
| completed_at | TIMESTAMP | No | — | Set when batch reaches terminal status |

---

## Table: `validation_issues`

| Field | Type | Required | Permitted Values | Notes |
|-------|------|----------|-----------------|-------|
| id | UUID | Auto | — | — |
| record_id | UUID (FK) | Conditional | — | NULL if issue concerns a batch |
| batch_id | UUID (FK) | Conditional | — | NULL if issue concerns a specific record |
| rule_code | VARCHAR(50) | Yes | See rule codes below | — |
| severity | VARCHAR(20) | Yes | info, warning, high, critical | — |
| description | VARCHAR(1000) | Yes | — | Human-readable explanation |
| affected_field | VARCHAR(100) | No | — | Field name(s) involved |
| expected_condition | VARCHAR(500) | No | — | What the rule expects |
| observed_condition | VARCHAR(500) | No | — | What was found (sensitive values masked) |
| evidence_reference | JSONB | No | — | Supporting data references |
| status | VARCHAR(20) | Yes | open, under_review, resolved, false_positive, reopened | — |
| assigned_to | UUID (FK) | No | — | Assigned reviewer |
| created_at | TIMESTAMP | Auto | — | — |
| resolved_at | TIMESTAMP | No | — | — |
| resolution_reason | VARCHAR(1000) | No | — | Required when resolving |
| resolved_by | UUID (FK) | No | — | — |

### Validation Rule Codes

| Code | Description | Severity |
|------|-------------|----------|
| REQUIRED_FIELD_MISSING | A mandatory field is absent or empty | critical |
| APAAR_FORMAT_INVALID | Identifier does not match approved format [DEMO] | high |
| APAAR_NOT_VERIFIED | Identity not verified through an authorized provider | warning |
| DUPLICATE_LOCAL_RECORD | Same identity enrolled in same program+cycle | critical |
| POTENTIAL_CROSS_INSTITUTION_DUPLICATE | Same identity fingerprint found at another institution | high |
| INTAKE_EXCEEDED | Enrolled count exceeds approved capacity | critical |
| CATEGORY_INCONSISTENCY | Admission category fields are mutually inconsistent | high |
| APPROVAL_DATA_MISSING | No authoritative intake reference found | warning |
| UNUSUAL_UPDATE_PATTERN | High frequency of corrections detected | warning |

---

## Retention and Access Policy (MVP Demonstration)

| Entity | Retention | Access Control | Deletion Policy |
|--------|-----------|----------------|-----------------|
| Student records | Demonstration only | Institution-scoped + role-based | Seed reset only |
| Audit events | Permanent (in demo) | aicte_admin, reviewer | No deletion through UI |
| Upload batches | Demonstration only | Institution-scoped | Seed reset only |
| Verification credentials | Per expiry (24h demo) | Verifier + issuer | Expiry + revocation |
| User accounts | Demonstration only | System admin | Seed reset only |

> **Production note:** Before processing real student data, a formal data retention policy, deletion procedure, and subject-access process must be established in compliance with applicable law.

---

*Data dictionary version: 0.1 — MVP Demonstration*  
*Generated: October 2026*
