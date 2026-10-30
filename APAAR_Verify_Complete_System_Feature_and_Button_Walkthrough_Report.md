# APAAR Verify — Complete System Architecture, Features & Button-by-Button Walkthrough Report

**Project Name:** APAAR Verify — Automated Multi-Tier Academic Registry Integrity & Zero-Trust Verification Platform  
**Target Authority:** Ministry of Education (MoE) & All India Council for Technical Education (AICTE)  
**National Standard:** 12-Digit Canonical APAAR ID Format (`XXXX-XXXX-XXXX`)  
**Scale of Implementation:** 58 AICTE Recognized Colleges | 690+ Engineering Programs | 20,700+ Student Records  
**Live Repositories:** [apaar-verify (main)](https://github.com/Keerthivardhan08/apaar-verify) & [apaar-verify3.0 (main)](https://github.com/Keerthivardhan08/apaar-verify3.0)  

---

## Table of Contents
1. **System Overview & Strategic Purpose**
2. **User Personas & Role-Based Access Control (RBAC)**
3. **Authentication & Multi-Persona Sign-In Suite (`/login`)**
4. **Central AICTE Command Center Suite (`/aicte`)**
   - 4.1 Executive Command Center Overview (`/aicte`)
   - 4.2 Institutions Directory (`/aicte/institutions`)
   - 4.3 Student & APAAR Universal Inspector (`/aicte/student-inspector`)
   - 4.4 Case Tracking & Regulatory Timeline (`/aicte/tracking`)
   - 4.5 Stakeholder Governance Desk (`/aicte/stakeholders`)
   - 4.6 Regulatory Review Queue & Detail (`/aicte/reviews`)
   - 4.7 Integrity Monitoring & Graph Topology (`/aicte/integrity` & `/aicte/graph`)
   - 4.8 Freshness & 30-Day SLA Monitor (`/aicte/freshness`)
   - 4.9 National Statutory Reports (`/aicte/reports`)
   - 4.10 National Analytics Suite (`/aicte/analytics`)
5. **Institutional Academic Workspace (`/institution`)**
   - 5.1 Institution Overview Dashboard (`/institution`)
   - 5.2 Student Registry Management (`/institution/students`)
   - 5.3 Student Detailed Profile & Dossier (`/institution/students/:id`)
   - 5.4 Batch CSV Data Ingestion Engine (`/institution/upload`)
   - 5.5 APAAR Quick Desk (`/institution/apaar-desk`)
   - 5.6 Upload History & Checksum Roster (`/institution/uploads`)
   - 5.7 Validation Issues Desk (`/institution/issues`)
   - 5.8 Corrections & Rectification Workflow (`/institution/corrections`)
   - 5.9 Intake & Quotas Compliance Desk (`/institution/compliance`)
   - 5.10 Program Intake Matrix (`/institution/intake`)
   - 5.11 Campus ERP & Institutional APIs (`/institution/api-keys`)
   - 5.12 Institution Statutory Reports (`/institution/reports`)
6. **Student Consent Portal Gateway (`/student`)**
7. **Stakeholder Verification & Reviewer Workspace (`/stakeholder`)**
8. **Public Verifier Gateway (`/verify`)**
9. **Core 9-Rule Algorithmic Validation Engine**
10. **Automated Seeding & Cloud Deployment Mechanics**

---

## 1. System Overview & Strategic Purpose

Under the **National Education Policy (NEP 2020)** and the **Digital Personal Data Protection (DPDP) Act 2023**, APAAR Verify provides an algorithmic governance mesh to secure the Automated Permanent Academic Account Registry (APAAR). It eliminates fraudulent seat blocking, stops unapproved over-admissions, enforces category quotas, and protects student data privacy through cryptographic zero-trust consent gating.

---

## 2. User Personas & Role-Based Access Control (RBAC)

The system supports four distinct operational spheres:
1. **AICTE Central Apex Regulators:** Superadmin & Reviewers monitoring nationwide telemetry, enforcing quotas, and adjudicating disputes.
2. **College Registrars & Operators:** Campus admission teams (benchmarked with Dayananda Sagar College of Engineering - DSCE, Bengaluru) uploading rosters, tracking intake, and submitting corrections.
3. **Students:** Individual candidates possessing a 12-digit APAAR ID, managing verifiable credentials, and approving/denying third-party background checks.
4. **Third-Party Stakeholders & Verifiers:** Employers (TCS, Wipro) and examination bodies (NTA) dispatching consent requests and recording verification findings.

---

## 3. Authentication & Multi-Persona Sign-In Suite (`/login`)

The sign-in portal features a modern dual-panel interface with four functional tabs:

### 3.1 Tab: Quick Demo Personas
Enables one-click instant authentication without manual credential entry:
- **Button: "AICTE Central Administrator"** -> Logs in as `admin@aicte.gov.in`, opens `/aicte`.
- **Button: "AICTE Regulatory Reviewer"** -> Logs in as `reviewer@aicte.gov.in`, opens `/aicte/reviews`.
- **Button: "College Operator (DSCE)"** -> Logs in as `operator@dsce.edu.in` (Dayananda Sagar College of Engineering), opens `/institution`.
- **Button: "College Operator (IIT Demo)"** -> Logs in as `operator@iit-demo.edu`, opens `/institution`.
- **Button: "College Operator (NIT Demo)"** -> Logs in as `operator@nit-demo.edu`, opens `/institution`.
- **Button: "Student Portal (Aarav Sharma)"** -> Logs in as `student@dsce.edu.in`, opens `/student`.
- **Button: "Stakeholder (NTA Verifier)"** -> Logs in as `nta.verifier@nta.ac.in`, opens `/stakeholder`.
- **Button: "Stakeholder (TCS Campus Hiring)"** -> Logs in as `tcs.verify@tcs.com`, opens `/stakeholder`.
- **Button: "Public Verifier (Zero-Login)"** -> Jumps to the public credential verifier at `/verify`.

### 3.2 Tab: Standard Email Login
- **Input: "Email Address"** -> Accepts registered staff or operator email.
- **Input: "Password"** -> Masked password input with show/hide toggle icon.
- **Checkbox: "Remember my session"** -> Persists JWT token in local storage.
- **Button: "Sign In to Platform"** -> Validates credentials with `/api/v1/auth/login`, routes user to designated workspace based on their active role.

### 3.3 Tab: Student APAAR ID Login
- **Input: "12-Digit APAAR ID"** -> Formats input automatically with hyphens (`XXXX-XXXX-XXXX`).
- **Input: "Password"** -> Student account security password.
- **Button: "Login via APAAR ID"** -> Calls `/api/v1/auth/student-login`, authenticates candidate, and navigates directly to `/student`.

### 3.4 Tab: Student Registration & Instant Access
- **Input: "Full Legal Name"** -> Candidate's official name as registered with institution.
- **Input: "12-Digit APAAR ID"** -> Formatted APAAR number.
- **Input: "College Email / Personal Email"** -> Candidate's contact email.
- **Input: "Create Password"** -> Minimum 6-character secure passphrase.
- **Button: "Register & Enter Student Portal"** -> Calls `/api/v1/auth/register-student`, auto-creates user, creates role, issues JWT token, displays toast notification, and navigates immediately to `/student`.

---

## 4. Central AICTE Command Center Suite (`/aicte`)

### 4.1 Executive Command Center Overview (`/aicte`)
- **Header Badge: "AICTE National Surveillance Telemetry • Active"** -> Real-time status indicator.
- **Button: "Add Member College"** -> Opens the `AddMemberCollegeModal`:
  - *Input fields:* Institution Code, Full Legal Name, Institution Type (Central / State / Private), State, City.
  - *Accreditation fields:* NAAC Grade, NAAC CGPA, NAAC Cycle, NAAC Validity Date, NBA Tier, NBA Status, NBA Accredited Branches, NBA File Reference.
  - *Complaints log fields:* Total Complaints, Resolved Complaints, Pending Complaints, Summary description.
  - *Intake fields:* AICTE Extension of Approval (EoA) reference, Sanctioned Capacity, New Intake Branch applied.
  - *Button: "Cancel"* -> Closes modal without saving.
  - *Button: "Register & Seed Member College"* -> Sends POST to `/api/v1/institutions`, initializes programs, and updates national telemetry.
- **Button: "Student & APAAR Inspector"** -> Redirects to `/aicte/student-inspector`.
- **Button: "Case Tracking"** -> Redirects to `/aicte/tracking`.
- **Button: "Stakeholder Governance"** -> Redirects to `/aicte/stakeholders`.
- **Universal Quick Search Input Bar:**
  - *Input field:* Debounced universal search across all 20,700+ student records.
  - *Live Dropdown:* Displays matching candidate cards with name, APAAR ID, college, branch, and compliance status.
  - *Button per row: "Inspect"* -> Navigates to student detail page.
  - *Button: "View all matching results in Universal Inspector →"* -> Opens search in full inspector.
- **5 National KPI Metric Cards (Clickable):**
  - *Card: "Institutions Monitored"* (58 Colleges) -> Navigates to `/aicte/institutions`.
  - *Card: "Total Student Records"* (20,700+) -> Navigates to `/aicte/student-inspector`.
  - *Card: "Compliant Enrolled"* (97.2%) -> Shows compliant student metric.
  - *Card: "Active Regulatory Flags"* -> Navigates to `/aicte/tracking`.
  - *Card: "Stakeholder Gates"* (5 Registered) -> Navigates to `/aicte/stakeholders`.
- **Regional Compliance Grid:**
  - Displays state-wise performance (Karnataka, Maharashtra, Delhi NCR, Tamil Nadu).
  - *Button: "Inspect Roster"* per state -> Filters institutions by state.
- **Recent High-Severity Exceptions Feed:**
  - *Button: "Review Case"* per row -> Opens `/aicte/reviews/:id`.

### 4.2 Institutions Directory (`/aicte/institutions`)
- **Input: "Search by college name, code, city, or state..."** -> Live filtering of 58 colleges.
- **Dropdown: "State Filter"** -> Filters by Indian states (Karnataka, Maharashtra, Tamil Nadu, Delhi, etc.).
- **Dropdown: "Institution Type Filter"** -> Filters by Central Institute, State University, Private College.
- **Button: "Add New Institution"** -> Opens `AddMemberCollegeModal`.
- **College Cards Grid (58 Institutions):**
  - Each card displays college code, NAAC grade, NBA accreditation status, approved branches, and complaints status.
  - *Button: "View Regulatory Portfolio"* -> Opens `InstitutePortfolioModal`:
    - Tab: "Accreditation & Approvals" (NBA Tier-1/Tier-2 status, NAAC CGPA, EoA order reference).
    - Tab: "Approved Intake & Quotas" (Full 13 engineering branch matrix with approved capacity and seat quota percentages).
    - Tab: "Student Grievance Cell" (Verified complaint log, resolved vs. pending grievances, anti-ragging compliance).
    - Tab: "New Intake Applications" (Pending program expansion requests under NEP).
    - *Button: "Close"* -> Dismisses portfolio view.
  - *Button: "Compliance Desk"* -> Navigates to college compliance dashboard (`/aicte/institutions/:id`).
  - *Button: "Student Roster"* -> Navigates to filtered student inspector for that college.

### 4.3 Student & APAAR Universal Inspector (`/aicte/student-inspector`)
- **Search Bar:** Real-time search across 20,700+ nationwide records by Name, 12-digit APAAR ID, Roll number, or College name.
- **Filters:** College dropdown (58 colleges), Branch dropdown, Category dropdown, Record Status dropdown.
- **Results Roster Table:**
  - Displays Student Name, 12-digit APAAR ID, Institution, Branch, Admission Cycle, Category, Verification Status.
  - *Button: "View Academic Dossier"* -> Opens `PrintableAcademicDossierModal`:
    - Displays official AICTE watermark, verified student credentials, academic semester marks, cryptographic hash, and verification QR code.
    - *Button: "Print / Save PDF Dossier"* -> Triggers browser print preview for physical/PDF archiving.
    - *Button: "Close"* -> Closes dossier modal.
  - *Button: "Deep Inspect"* -> Opens `/aicte/students/:id`.

### 4.4 Case Tracking & Regulatory Timeline (`/aicte/tracking`)
- **Filter Tabs:** "All Exceptions", "Local Duplicates (Rule 4)", "Cross-College Ghost Enrollment (Rule 5)", "Capacity Breaches (Rule 6)", "Category Violations (Rule 7)".
- **Case Timeline View:**
  - Visual 4-stage stepper: 1. Anomaly Flagged -> 2. Hearing Notice Dispatched -> 3. Evidentiary Document Scrutiny -> 4. Apex Determination.
- **Action Buttons per Case:**
  - *Button: "Request Institution Justification"* -> Dispatches an audit ticket to the college operator workspace.
  - *Button: "Escalate to Central Scrutiny"* -> Marks severity as critical and routes to senior reviewer.
  - *Button: "Sanction Resolution / Close"* -> Adjudicates the exception and logs an audit trail.

### 4.5 Stakeholder Governance Desk (`/aicte/stakeholders`)
- **Hero Banner:** Displays DPDP Act Zero-Trust Consent Scoping rules.
- **Button: "Sync Registry"** -> Refreshes stakeholder listings from `/api/v1/consent/stakeholders`.
- **Search Input:** Filters agencies by name, email, or purpose.
- **Filter Tabs:** "All Stakeholders", "Approved", "Pending Review".
- **4 Solid High-Contrast KPI Cards:** Total Registered, AICTE Approved, Pending Review, Consent Gated (100% Enforced).
- **Stakeholder Agency Cards (NTA, TCS, Wipro, Screening Agencies):**
  - Displays agency name, entity badge (Exam Body / Corporate / Screening), contact email, declared verification purpose, and permitted zero-trust attribute scopes.
  - *Button: "Grant AICTE Approval"* (for pending agencies) -> Calls `/api/v1/consent/stakeholders/:id/toggle-approval`, authorizes the agency to dispatch background check requests to students.
  - *Button: "Revoke / Suspend Authorization"* (for approved agencies) -> Instantly cuts off agency API access.

### 4.6 Regulatory Review Queue & Detail (`/aicte/reviews`)
- **Review Queue Table:** Lists disputed admission cases awaiting official regulatory orders.
- **Button: "Adjudicate Case"** -> Opens `/aicte/reviews/:id`.
- **Review Detail Workspace:**
  - Displays evidence side-by-side: student profile, conflicting college records, registrar justification.
  - *Dropdown: "Review Decision"* -> "Approve Admission", "Reject Admission & Nullify Seat", "Request Secondary Marksheet Verification".
  - *Textarea: "Regulatory Justification"* -> AICTE officer's official ruling text.
  - *Button: "Stamp & Issue Regulatory Order"* -> Persists adjudication, logs immutable audit entry, and notifies college.

### 4.7 Integrity Monitoring & Graph Topology (`/aicte/integrity` & `/aicte/graph`)
- **Integrity Radar:** Real-time visual metrics measuring national identity confidence, capacity saturation, and duplicate clusters.
- **Integrity Graph:** Interactive node-link topology rendering student-to-institution relationships, visually revealing circular seat-blocking rings between colleges.

### 4.8 Freshness & 30-Day SLA Monitor (`/aicte/freshness`)
- Displays compliance clock monitoring 30-day reporting cadence across all 58 institutions.
- Flags overdue institutions with red SLA warning tags.
- *Button: "Dispatch Formal Regulatory Reminder"* -> Sends automated compliance notice to college administrator.

### 4.9 National Statutory Reports (`/aicte/reports`)
- **Dropdown: "Select Target Institution"** -> Choose any of the 58 colleges (e.g. DSCE, IIT Bombay, COEP Pune, RVCE).
- **Dropdown: "Select Statutory Report Type"** ->
  - 1. AICTE Mandatory Form-A (Regulatory Compliance & Intake Audit).
  - 2. Accreditation Dossier (NAAC / NBA Tier-1 Compliance).
  - 3. Program Intake & Quota Saturation Ledger.
  - 4. Full Anomaly & Integrity Discrepancy Log.
- **Button: "Generate Statutory Report"** -> Fetches data and renders live preview.
- **Button: "Download Official CSV Report"** -> Exports structured dataset for institutional records.
- **Button: "Print / Export PDF Dossier"** -> Formats document with official regulatory headers for printing.

### 4.10 National Analytics Suite (`/aicte/analytics`)
- Visual charts tracking admission trends, category allocations (OBC, SC, ST, EWS, General, NRI), and year-over-year verification success rates.

---

## 5. Institutional Academic Workspace (`/institution`)
*(Benchmarked with Dayananda Sagar College of Engineering - DSCE, Bengaluru)*

### 5.1 Institution Overview Dashboard (`/institution`)
- **Campus Header:** Displays college name, official code (`DSCE-BLR`), city (`Bengaluru, Karnataka`), and active node indicator.
- **4 KPI Metric Cards (Interactive):**
  - *Card: "Total Students"* (1,233+) -> Clicks through to `/institution/students`.
  - *Card: "Valid Records"* -> Filters students by `status=accepted`.
  - *Card: "Flagged Records"* -> Filters students by `status=flagged`.
  - *Card: "Pending Issues"* -> Navigates to `/institution/issues`.
- **Quick Action Buttons Bar:**
  - *Button: "Upload Data"* -> Navigates to `/institution/upload`.
  - *Button: "APAAR Quick Desk"* -> Navigates to `/institution/apaar-desk`.
  - *Button: "Compliance Desk"* -> Navigates to `/institution/compliance`.
  - *Button: "Statutory Reports"* -> Navigates to `/institution/reports`.
- **Program Intake Analytics:** Real-time capacity saturation meters for Computer Science, Cyber Security, AI & ML, ISE, ECE, Mechanical, etc.

### 5.2 Student Registry Management (`/institution/students`)
- **Input: "Search by Student Name, Roll No, or APAAR ID..."** -> Live multi-column search.
- **Filters:** Branch dropdown, Category dropdown, Record Status dropdown.
- **Button: "Register Individual Student"** -> Opens the Add Student Modal:
  - *Inputs:* Full Name, Roll No, Branch/Program, Admission Cycle, Category (General, OBC, SC, ST, EWS), Gender, Date of Birth, Supernumerary/NRI Status.
  - *Button: "Cancel"* -> Closes modal.
  - *Button: "Save & Validate Student"* -> Validates against AICTE rules, inserts into database, triggers immediate rule check.
- **Students DataTable:**
  - Columns: Candidate Name, Roll Number, 12-Digit APAAR ID, Branch, Category, Verification Status, Record Status, Actions.
  - *Button: "Inspect Details"* per row -> Navigates to `/institution/students/:id`.
  - *Button: "Digital Degree Certificate"* per row -> Opens `DegreeCertificateModal`:
    - Renders official collegiate degree certificate complete with candidate credentials, degree conferred, SHA-256 integrity hash, institutional seal, and validation QR code.
    - *Button: "Download / Print PDF"* -> Exports certificate.
    - *Button: "Close"* -> Closes modal.
- **Pagination Bar:** Supports jumping across pages (10, 25, 50 records per page) across DSCE's 1,233+ student roster.

### 5.3 Student Detailed Profile & Dossier (`/institution/students/:id`)
- **Header Profile Card:** Displays candidate name, roll number, 12-digit APAAR ID (`XXXX-XXXX-XXXX`), admitted branch, admission status.
- **Aadhaar / Mock Identity Match Badge:** Displays match score, cryptographic fingerprint, and identity verification timestamp.
- **Compliance & Anomaly Alerts Section:**
  - Highlights specific rule violations if present (e.g. Rule 4 Local Duplicate, Rule 5 Cross-Institute Duplicate, Rule 6 Intake Breach, Rule 7 Category Inconsistency).
  - *Button: "Initiate Rectification Workflow"* -> Opens correction request ticket.
  - *Button: "Upload Supporting Evidence"* -> Allows attaching PDF marksheets or government certificates.
- **Academic Credentials & Marksheets Tab:** Displays high school, pre-university, and semester records.
- **Audit History Tab:** Immutable log showing when the record was created, updated, or verified.

### 5.4 Batch CSV Data Ingestion Engine (`/institution/upload`)
- **Drag-and-Drop Dropzone:** Area to drop `.csv` enrollment rosters or click to browse files.
- **Button: "Download Sample AICTE-Compliant CSV Template"** -> Downloads `DSCE_Sample_Student_Upload_Batch.csv` containing valid 12-digit hyphenated APAAR IDs (`XXXX-XXXX-XXXX`) and realistic student records.
- **Pre-Upload File Inspection Table:** Renders immediate browser-side table of all parsed rows with column mapping check.
- **Button: "Submit Batch for AICTE Algorithmic Verification"** ->
  - Sends multipart POST to `/api/v1/uploads`.
  - Evaluates all rows against the 9-Rule validation engine.
  - Generates immediate batch summary: Valid Rows, Invalid Rows, and specific Anomaly Rule codes.
- **Button: "View Uploaded Batch in History"** -> Navigates to upload history.

### 5.5 APAAR Quick Desk (`/institution/apaar-desk`)
- **Purpose:** Fast-track single-student live verification testbench.
- **Interactive Form:**
  - *Inputs:* Full Legal Name, 12-Digit APAAR ID (`XXXX-XXXX-XXXX`), Roll Number, Program/Branch, Admission Category, Supernumerary/NRI Status.
  - *Button: "Populate Test Candidate"* -> Autofills sample student data for demonstration.
  - *Button: "Run Instant AICTE Verification"* -> Sends candidate to live validation engine.
- **Diagnostic Output Card:**
  - Real-time check indicators for Rule 4 (Deduplication), Rule 5 (Cross-Institution Duplicate), Rule 6 (Capacity Limit), Rule 7 (Admission Category).
  - Shows instant badge: `Accepted (Green)` or `Flagged (Amber/Red)` with detailed explanation.

### 5.6 Upload History & Checksum Roster (`/institution/uploads`)
- Lists all uploaded batches with filename, submission timestamp, total rows, valid rows, invalid rows, and SHA-256 file checksum.
- *Button: "Download Error Roster (CSV)"* per batch -> Downloads rows that failed validation for local correction.
- *Button: "Inspect Batch Details"* -> Navigates to detailed view of that upload batch.

### 5.7 Validation Issues Desk (`/institution/issues`)
- **Filter Tabs:** "All Issues", "Critical", "High", "Medium", "Open", "Under Review", "Resolved".
- **Issues Roster:**
  - Displays rule code (`DUPLICATE_LOCAL_RECORD`, `POTENTIAL_CROSS_INSTITUTION_DUPLICATE`, `INTAKE_EXCEEDED`, `CATEGORY_INCONSISTENCY`), affected student name, roll number, observed condition vs. expected condition.
  - *Button: "Open Correction Ticket"* -> Opens correction request workflow.
  - *Button: "View Student"* -> Navigates to student detail page.

### 5.8 Corrections & Rectification Workflow (`/institution/corrections`)
- **Button: "Submit New Correction Petition"** -> Opens modal:
  - Select student record, specify corrected field (Roll No, Name, Category, Quota), input registrar justification, attach marksheet proof.
  - *Button: "Submit Petition to AICTE"* -> Sends request to `/api/v1/corrections`.
- **Corrections Tracking Board:** Shows status of petitions ("Submitted", "Under AICTE Scrutiny", "Approved & Reconciled", "Rejected").

### 5.9 Intake & Quotas Compliance Desk (`/institution/compliance`)
- **Program Intake vs. Enrolment Matrix:**
  - Renders comparison between AICTE approved capacity and actual admitted students across all 13 branches (including Cyber Security, CSE, AI & ML, ISE).
  - Visual progress bars color-coded by saturation percentage.
- **Supernumerary & Reserved Seats Breakdown:**
  - Detailed counts for NRI seats, Foreign National seats, Kashmiri Migrant quota, and reservation categories (General, OBC, SC, ST, EWS).
- **Button: "Export Institutional Compliance Roster (CSV)"** -> Downloads complete roster with quota classifications.

### 5.10 Program Intake Matrix (`/institution/intake`)
- Detailed tabular view of approved sanction orders, Extension of Approval (EoA) reference numbers, and effective academic cycles.

### 5.11 Campus ERP & Institutional APIs (`/institution/api-keys`)
- **API Key Management:**
  - *Button: "Generate New API Key"* -> Generates secure bearer token for campus ERP integration (SAP, PeopleSoft).
  - *Button: "Copy Token"* -> Copies key to clipboard.
  - *Button: "Revoke Key"* -> Inactivates compromised key.
- **Webhook Endpoint Configuration:**
  - *Inputs:* Target Webhook URL, Secret Token.
  - *Button: "Save Webhook Configuration"* -> Stores listener.
  - *Button: "Dispatch Test Ping"* -> Sends mock validation event payload to verify university endpoint.
- **Quick Code Snippets:** Interactive tabs displaying pre-configured integration scripts in cURL, Python, and Node.js.

### 5.12 Institution Statutory Reports (`/institution/reports`)
- Dedicated collegiate report generator for NAAC, NBA, and AICTE compliance.
- *Button: "Generate Report Preview"* -> Displays formatted document.
- *Button: "Download CSV"* -> Exports data.
- *Button: "Print / Export PDF"* -> Generates print-ready document.

---

## 6. Student Consent Portal Gateway (`/student`)
*(Benchmarked with Aarav Sharma, Cyber Security, DSCE — or newly registered student)*

- **Dynamic Student Identity Card:**
  - Displays official APAAR emblem, student photo avatar, 12-digit hyphenated APAAR ID (`XXXX-XXXX-XXXX`), full legal name, college name, branch, and active status badge.
  - *Button: "Download Digital APAAR Card"* -> Exports clean image/PDF of student identity card.
- **Zero-Trust Stakeholder Verification & Background Check Request Center:**
  - The centerpiece of student data sovereignty under the DPDP Act 2023.
  - Lists incoming verification requests sent by third-party agencies (e.g. NTA, TCS, Infosys).
  - Displays Agency Name, Declared Purpose (e.g. "Pre-Employment Background Verification", "National Entrance Exam Eligibility Check"), Requested Attribute Scopes, and Request Date.
  - *Button: "Approve Verification Request"* (Green) ->
    - Instantly grants digital consent.
    - Decrypts and shares academic transcripts *only* with that specific authorized stakeholder.
    - Updates request badge to `Approved by Student`.
  - *Button: "Deny / Reject Request"* (Red) ->
    - Permanently blocks the stakeholder from accessing transcripts.
    - Logs denial in national audit log.
- **Verified Academic Marksheets Tab:**
  - Displays verified 10th standard certificate, 12th standard certificate, and B.E. semester grade sheets.
  - Displays cryptographic SHA-256 tamper-evident hash for each document.
  - *Button: "View Authenticity Seal"* -> Displays digital verification certificate.
- **Discrepancy Reporting:**
  - *Button: "Raise Identity / Academic Discrepancy"* -> Opens ticket for institution registrar to resolve name or marks discrepancies.
- **Button: "Sign Out"** -> Logs out and clears session.

---

## 7. Stakeholder Verification & Reviewer Workspace (`/stakeholder`)
*(For external verification agencies: NTA, TCS Talent Acquisition, Wipro, Corporate Recruiters)*

- **Header Bar:** Displays stakeholder verifier identity, agency organization badge, and active zero-trust consent gate status.
- **Candidate Verification Search Bar:**
  - *Input:* Enter 12-Digit APAAR ID (`XXXX-XXXX-XXXX`).
  - *Button: "Search Candidate & Verify Consent"* -> Queries platform for candidate status.
- **Case 1: When Student Has NOT Yet Approved Consent (Locked State):**
  - Renders red privacy shield: **"Access Locked by Student Consent Gate"**.
  - Informational message explaining that by AICTE regulation, records are private and require explicit student permission.
  - *Button: "Dispatch Consent & Background Check Request to Student Portal"* (Cyan) ->
    - Pushes a real-time background check request directly to the candidate's Student Portal.
    - Displays amber status badge: `Request Dispatched — Awaiting Student Approval in Portal`.
- **Case 2: When Student HAS Approved Consent (Unlocked State):**
  - Renders green shield: **"Verification Authorized by Student"**.
  - Unlocks verified student data: Full Legal Name, Institution Name, Admitted Branch, Roll Number, Admission Cycle.
  - Displays verified academic transcripts and marksheets with tamper-evident hashes.
- **Reviewer of Stakeholders Determination Desk:**
  - A formal third-party audit station for recording background check results:
  - *Input: "Reviewing Officer Name & Designation"* -> Verifier's official credentials.
  - *Dropdown: "Official Determination Verdict"* ->
    - 1. Verified & Recommended (All credentials match).
    - 2. Discrepancy Found in Submitted Claims.
    - 3. Incomplete Documentation / Unverified.
  - *Textarea: "Review Notes & Justification"* -> Detailed findings regarding grades, degree authenticity, and enrollment legitimacy.
  - *Button: "Submit Official Review Determination"* ->
    - Stamps and signs the verification verdict.
    - Permanently logs the decision in the historical verification audit trail.
- **Past Verifications Log Table:**
  - Shows history of all candidate checks conducted by the organization with verification status stamps.

---

## 8. Public Verifier Gateway (`/verify`)

- **Zero-Login Universal Verification:** Accessible publicly to anyone (parents, foreign universities, employers) without an account.
- **Verification Modes:**
  - *Tab: "Search by 12-Digit APAAR ID / Credential Hash"* -> Input field + *Button: "Verify Credential"*.
  - *Tab: "Scan / Upload QR Code"* -> Drag-and-drop QR image + *Button: "Decode & Verify"*.
- **Verification Results Page (`/verify/result`):**
  - Renders official AICTE digital seal.
  - Displays cryptographic integrity status: `100% Cryptographically Authentic & Untampered`.
  - Shows student name, granting college, conferment date, and blockchain-style validation block.

---

## 9. Core 9-Rule Algorithmic Validation Engine

The platform executes nine deterministic rules across all admissions:

| Rule Code | Severity | Description & Behavioral Logic |
| :--- | :--- | :--- |
| **Rule 1: FORMAT_VALIDATION** | High | Enforces strict 12-digit hyphenated APAAR ID format (`XXXX-XXXX-XXXX`). |
| **Rule 2: MANDATORY_FIELDS** | High | Validates presence of Name, DOB, Roll No, Branch, Admission Cycle, and Category. |
| **Rule 3: IDENTITY_PROOF_MATCH** | Critical | Matches student identity against reference records with cryptographic confidence scoring. |
| **Rule 4: DUPLICATE_LOCAL_RECORD** | High | Flags duplicate enrollments or repeated roll numbers within the same institution in the same cycle. |
| **Rule 5: POTENTIAL_CROSS_INSTITUTION_DUPLICATE** | Critical | Flags duplicate active admissions across two or more colleges nationwide (stops seat-blocking scams). |
| **Rule 6: INTAKE_EXCEEDED** | High | Flags branch admissions exceeding AICTE approved capacity (e.g. DSCE AI & ML at 122 vs 120 cap). |
| **Rule 7: CATEGORY_INCONSISTENCY** | High | Flags quota violations, unverified caste reservation certificates, or exhausted supernumerary allocations. |
| **Rule 8: CHRONOLOGICAL_SANITY** | Medium | Verifies admission date occurs after high school graduation date and date of birth. |
| **Rule 9: TRANSCRIPT_INTEGRITY** | High | Validates SHA-256 tamper-evident hash matches institutional repository record. |

---

## 10. Automated Seeding & Cloud Deployment Mechanics

To guarantee immediate demonstration readiness on any local or cloud environment (such as **Render, Docker, or localhost**):

1. **Automated Self-Healing Seeding in FastAPI (`app/main.py`):**
   - In the server's `lifespan(app)` startup hook, the platform automatically queries the database on boot.
   - If the database is fresh, or if DSCE has fewer than 1,000 students, it automatically triggers `seed_expanded_colleges.run_seed()`.
   - **Populates instantly:**
     - **58 AICTE Recognized Colleges** across India.
     - **All 13 Core Engineering Branches** for every institution (including Computer Science, Cyber Security, AI & ML, Robotics, Biotechnology, Data Science).
     - **1,233+ Student Records specifically for DSCE** (exceeding the 1,111 minimum requirement).
     - **20,700+ Student Records nationwide**, all formatted with strict 12-digit hyphenated APAAR IDs.
     - **4 Realistic Problem Cases** seeded into DSCE, DEC Pune, NIT Demo, and IIT Demo specifically demonstrating Rules 4, 5, 6, and 7.

2. **One-Click Local Runners:**
   - [`run_local.bat`](file:///c:/Users/Keerthi/OneDrive/Desktop/sih%203.0/apaar-verify/run_local.bat) (Windows) and [`run_local.sh`](file:///c:/Users/Keerthi/OneDrive/Desktop/sih%203.0/apaar-verify/run_local.sh) (Linux/macOS) install dependencies, seed both datasets, build the frontend, and launch the server on `http://localhost:8000`.

3. **Multi-Stage Cloud Dockerfile:**
   - Combines a Node.js 20 frontend builder with a lightweight Python 3.11 server serving both API endpoints and the compiled single-page application from a single port.

---

### Summary Checklist of Completed Features
- [x] Strict 12-digit APAAR ID format (`XXXX-XXXX-XXXX`) enforced across all pages and database records.
- [x] All 58 AICTE recognized member colleges populated with complete NBA, NAAC, complaints, and quota portfolios.
- [x] Full 13 engineering departments seeded in DSCE with **1,233+ students**, including dedicated **Cyber Security branch**.
- [x] AICTE Command Center navigation streamlined (external student & stakeholder links removed from admin sidebar).
- [x] Institutional Academic Workspace equipped with complete compliance, intake, and corrections tools.
- [x] Comprehensive Statutory Reports generator supporting college-specific filtering and export (e.g. DSCE only).
- [x] DPDP Act compliant Student Consent Gateway with encrypted background check authorization.
- [x] Dedicated Stakeholder Verification Workspace with Reviewer of Stakeholders Determination Desk.
- [x] High-contrast, crystal-clear UI design across all cards, badges, buttons, and telemetry widgets.
- [x] Dual-repo GitHub deployment live on `apaar-verify` and `apaar-verify3.0`.
