# APAAR Verify — Complete System Architecture, Features & Granular Button-by-Button Walkthrough Manual

**Document Classification:** Official Comprehensive System Specification & Operational Manual  
**Target Authority:** Ministry of Education (MoE) & All India Council for Technical Education (AICTE)  
**Standard Compliance:** 12-Digit Canonical APAAR ID Format (`XXXX-XXXX-XXXX`) & DPDP Act 2023 Zero-Trust Framework  
**Scope of Implementation:** 58 AICTE Recognized Institutions | 696 Approved Engineering Branches | 20,700+ Nationwide Student Profiles  
**Primary Demonstration Node:** Dayananda Sagar College of Engineering (DSCE-BLR, Bengaluru) — 13 Departments, 1,233+ Enrolled Students  
**Official Code Repositories:**  
- Primary Repository: [https://github.com/Keerthivardhan08/apaar-verify](https://github.com/Keerthivardhan08/apaar-verify)  
- Release 3.0 Repository: [https://github.com/Keerthivardhan08/apaar-verify3.0](https://github.com/Keerthivardhan08/apaar-verify3.0)  

---

## Master Table of Contents
1. **System Vision, Objectives & Regulatory Framework**
2. **Global Application Shell (Header, Navigation, Global Layout & Alerts)**
3. **Authentication & Multi-Persona Sign-In Suite (`/login`)**
4. **Central AICTE Command Center Suite (`/aicte`)**
   - 4.1 Executive Command Center Overview (`/aicte`)
   - 4.2 Member Institutions Directory (`/aicte/institutions`)
   - 4.3 Student & APAAR Universal Inspector (`/aicte/student-inspector`)
   - 4.4 Case Tracking & Regulatory Timeline (`/aicte/tracking`)
   - 4.5 Stakeholder Governance & Licensing Desk (`/aicte/stakeholders`)
   - 4.6 Regulatory Review Queue & Case Adjudication (`/aicte/reviews` & `/aicte/reviews/:id`)
   - 4.7 Integrity Monitoring & Anomaly Topology Graph (`/aicte/integrity` & `/aicte/graph`)
   - 4.8 Freshness & 30-Day SLA Cadence Monitor (`/aicte/freshness`)
   - 4.9 National Statutory Reports Generator (`/aicte/reports`)
   - 4.10 National Analytics & Demographic Telemetry (`/aicte/analytics`)
5. **Institutional Academic Workspace (`/institution`) — DSCE Benchmark**
   - 5.1 Institution Node Overview Dashboard (`/institution`)
   - 5.2 Student Registry & Enrollment DataTable (`/institution/students`)
   - 5.3 Student Detailed Profile & Evidentiary Dossier (`/institution/students/:id`)
   - 5.4 Batch CSV Data Ingestion Engine (`/institution/upload`)
   - 5.5 APAAR Quick Desk — Rapid Rectification Testbench (`/institution/apaar-desk`)
   - 5.6 Upload History & Checksum Roster (`/institution/uploads`)
   - 5.7 Validation Issues & Anomaly Desk (`/institution/issues`)
   - 5.8 Corrections & Rectification Petition Workflow (`/institution/corrections`)
   - 5.9 Intake & Quotas Compliance Desk (`/institution/compliance`)
   - 5.10 Program Intake Matrix & Sanction Orders (`/institution/intake`)
   - 5.11 Campus ERP & Institutional Integration APIs (`/institution/api-keys`)
   - 5.12 Institution Statutory Reports Generator (`/institution/reports`)
6. **Student Consent Portal Gateway (`/student`) — DPDP Act Data Sovereignty**
7. **Stakeholder Verification Workspace (`/stakeholder`) — Background Checks**
8. **Public Verifier Gateway (`/verify` & `/verify/result`) — Zero-Login Validation**
9. **Core 9-Rule Algorithmic Validation Engine & Specific Problem Cases**
10. **Automated Seeding, Startup Lifecycle & Cloud Deployment Mechanics**

---

## 1. System Vision, Objectives & Regulatory Framework

The Government of India's **National Education Policy (NEP 2020)** mandated the creation of the **Automated Permanent Academic Account Registry (APAAR)** — a 12-digit unique national student identifier intended to unify academic credits, student mobility, and degrees across 50,000+ higher educational institutions into the Academic Bank of Credits (ABC).

Despite its transformative vision, manual enrollment reporting creates critical systemic risks:
1. **Ghost & Dual Active Registrations:** Students holding simultaneous admissions across multiple colleges or private deemed universities, blocking government quota seats.
2. **Sanctioned Capacity Overages:** Colleges exceeding sanctioned branch intake limits specified in their annual AICTE Extension of Approval (EoA).
3. **Category Reservation Breaches:** Admitting candidates under incorrect reservation categories (OBC, SC, ST, EWS) or exceeding supernumerary quotas (NRI, Foreign National, Kashmiri Migrants).
4. **Third-Party Privacy Infringements:** Screening agencies and employers querying student academic records without verified candidate consent, violating the **Digital Personal Data Protection (DPDP) Act 2023**.

**APAAR Verify** solves these challenges through a high-performance, algorithmic integrity platform connecting regulators, colleges, verifiers, and students into a unified zero-trust mesh.

---

## 2. Global Application Shell (Header, Navigation, Global Layout & Alerts)

The global interface shell persists across all authenticated views, providing ambient telemetry, role-aware navigation, and notification dispatching.

### 2.1 Demo Environment Banner (`DemoBanner.tsx`)
- **Location:** Pinned to the top of every screen.
- **Visual Design:** Indigo-to-blue gradient ribbon with animated pulse indicator.
- **Text:** `Demonstration Environment — Synthetic Academic Data for MoE / AICTE Regulatory Evaluation`.
- **Badge:** `PKI RS256 Verification Active` — indicates all cryptographic signatures are actively verified.

### 2.2 Global Header Bar (`Header.tsx`)
- **Left Sector: Workspace & Jurisdiction Indicator:**
  - If logged in as AICTE staff: Displays deep indigo badge with shield icon: `AICTE Central Command`.
  - If logged in as College Operator: Displays emerald badge with building icon: `Institution Node Portal — DSCE-BLR`.
- **Right Sector: Interactive Controls & Action Buttons:**
  - **Button: "Public Verifier" (QrCode icon)** *(visible on Institutional views)*:
    - *Action:* Navigates immediately to `/verify` for quick demonstration of zero-login credential checks.
  - **Button: "Notifications Bell" (Bell icon with unread count badge)**:
    - *Action:* Toggles open the liquid glass Notifications Drawer.
    - *Display:* Unread count pill (`9+` when count > 9).
    - *Internal Controls:*
      - Notification cards list title, timestamp, and message.
      - *Button per unread item: "Mark as Read" (CheckCheck icon)* -> Invokes `useMarkNotificationRead`, marks item as read, decrements counter.
  - **User Profile Dropdown Button:**
    - *Display:* Circular avatar with user's first initial + Full Name + Role indicator (`AICTE National Admin`, `Institution Operator`, etc.).
    - *Action on click:* Toggles open user menu dropdown.
    - *Dropdown Contents:* User's full legal name, verified email, active role badge.
    - *Button: "Sign Out" (LogOut icon in rose red)* -> Calls `logout()`, clears `apaar_token` and `apaar_user` from `localStorage`, displays green toast `Signed out successfully.`, and redirects to `/login`.

### 2.3 Role-Aware Dynamic Sidebar (`Sidebar.tsx`)
The sidebar dynamically changes its entire navigation tree based on user permissions:
- **Header:** GraduationCap emblem with glowing indigo accent, title `APAAR Verify`, subtitle `Central AICTE Apex` or `Institution Node`.
- **AICTE Staff Navigation Links:**
  - `Command Center` -> `/aicte`
  - `Institutions Directory` -> `/aicte/institutions`
  - `Student & APAAR Inspector` -> `/aicte/student-inspector`
  - `Case Tracking & Timeline` -> `/aicte/tracking`
  - `Stakeholder Governance` -> `/aicte/stakeholders`
  - `Integrity Monitoring` -> `/aicte/integrity`
  - `Integrity Graph` -> `/aicte/graph`
  - `Review Queue` -> `/aicte/reviews`
  - `Freshness & SLA` -> `/aicte/freshness`
  - `Statutory Reports` -> `/aicte/reports`
  - `Analytics` -> `/aicte/analytics`
- **Institution Operator Navigation Links:**
  - `Overview` -> `/institution`
  - `Students` -> `/institution/students`
  - `Upload Data` -> `/institution/upload`
  - `APAAR Quick Desk` -> `/institution/apaar-desk`
  - `Upload History` -> `/institution/uploads`
  - `Validation Issues` -> `/institution/issues`
  - `Corrections` -> `/institution/corrections`
  - `Intake & Quotas Desk` -> `/institution/compliance`
  - `Intake Monitoring` -> `/institution/intake`
  - `Reports` -> `/institution/reports`
  - `Campus ERP & APIs` -> `/institution/api-keys`
  - `Student Portal` -> `/student`
  - `Public Verifier` -> `/verify`
- **Sidebar Footer Pill:** Displays green pulsing dot: `PKI RS256 Trust Active`.

### 2.4 Diagnostic Error Boundary (`ErrorBoundary.tsx`)
Surrounds every view to catch any rendering anomaly:
- **Display:** Clean liquid-glass card with red alert icon and formatted error stack.
- **Button: "Reload Page" (RefreshCw icon)** -> Triggers `window.location.reload()`.
- **Button: "Go to Home" (Home icon)** -> Navigates to `/`.

---

## 3. Authentication & Multi-Persona Sign-In Suite (`/login`)

The login gateway enables seamless switching between regulatory personas, institutional operators, students, and third-party verifiers.

### 3.1 Tab: "Quick Demo Personas" (1-Click Instant Access)
Each card displays an icon, role title, organization badge, and credential note:
1. **Button: "AICTE Central Administrator"**
   - *Identity:* `admin@aicte.gov.in` (`Admin@1234` / `Demo@1234`)
   - *Destination:* `/aicte` (Central Command Center)
   - *Action:* Calls `authApi.login()`, saves token, routes to `/aicte`.
2. **Button: "AICTE Regulatory Reviewer"**
   - *Identity:* `reviewer@aicte.gov.in`
   - *Destination:* `/aicte/reviews` (Adjudication Queue)
3. **Button: "College Operator (Dayananda Sagar College of Eng. - DSCE)"**
   - *Identity:* `operator@dsce.edu.in`
   - *Destination:* `/institution` (DSCE Campus Workspace)
4. **Button: "College Operator (IIT Demo)"**
   - *Identity:* `operator@iit-demo.edu`
   - *Destination:* `/institution` (IIT Node)
5. **Button: "College Operator (NIT Demo)"**
   - *Identity:* `operator@nit-demo.edu`
   - *Destination:* `/institution` (NIT Node)
6. **Button: "Student Portal (Aarav Sharma — Cyber Security)"**
   - *Identity:* `student@dsce.edu.in` | APAAR ID: `9876-5432-1011`
   - *Destination:* `/student` (Personal Student Consent Gateway)
7. **Button: "Stakeholder Verifier (National Testing Agency - NTA)"**
   - *Identity:* `nta.verifier@nta.ac.in`
   - *Destination:* `/stakeholder` (Testing Body Background Check Workspace)
8. **Button: "Stakeholder Verifier (TCS Talent Acquisition)"**
   - *Identity:* `tcs.verify@tcs.com`
   - *Destination:* `/stakeholder` (Corporate Recruiter Workspace)
9. **Button: "Public Verifier (Zero-Login)"**
   - *Destination:* `/verify` (Public Credential Authenticator)

### 3.2 Tab: "Standard Email Login"
- **Input: "Email Address"** -> Validates email syntax.
- **Input: "Password"** -> Password input with toggle visibility eye icon.
- **Checkbox: "Remember my credentials"** -> Stores login preference.
- **Button: "Sign In to Platform"** -> Calls `POST /api/v1/auth/login`. On error, renders red toast notification with backend error details.

### 3.3 Tab: "Student APAAR ID Login"
- **Input: "12-Digit APAAR ID"** -> Automatically auto-formats digits with hyphens (`XXXX-XXXX-XXXX`).
- **Input: "Account Password"** -> Password string.
- **Button: "Login via APAAR ID"** -> Calls `POST /api/v1/auth/student-login`, retrieves student profile, sets session, and routes to `/student`.

### 3.4 Tab: "Student Registration & Instant Access"
- **Input: "Full Legal Name"** -> Candidate's name (e.g. `Priya Patel`).
- **Input: "12-Digit APAAR ID"** -> Formatted ID.
- **Input: "College / Personal Email"** -> Email for login.
- **Input: "Create Password"** -> Password.
- **Button: "Register & Enter Student Portal"** ->
  - Calls `POST /api/v1/auth/register-student`.
  - Backend creates user record, assigns `student` role, associates with identity reference.
  - Automatically logs student in, shows toast `Registration approved! Welcome, [Name]!`, and opens `/student`.

---

## 4. Central AICTE Command Center Suite (`/aicte`)

### 4.1 Executive Command Center Overview (`/aicte`)
- **Telemetry Status Ribbon:** Displays green live ping `AICTE National Surveillance Telemetry • Active` with IST realtime synchronization tag.
- **Header Description:** Highlights algorithmic oversight across 58 colleges, 696 approved branches, and 20,700+ student records.
- **Universal Quick Search Bar:**
  - Real-time debounced query input matching student names, 12-digit APAAR IDs, roll numbers, or college codes.
  - Live dropdown results list matching candidate cards.
  - *Button: "Inspect" per result* -> Jumps directly to student profile.
  - *Button: "View all matching results in Universal Inspector →"* -> Opens `/aicte/student-inspector?query=...`.
- **Top Quick Action Matrix Buttons:**
  - **Button: "Add Member College" (PlusCircle icon in emerald)** -> Opens `AddMemberCollegeModal` (see Section 4.2).
  - **Button: "Student & APAAR Inspector" (Fingerprint icon in indigo)** -> Jumps to `/aicte/student-inspector`.
  - **Button: "Case Tracking" (Clock icon in amber)** -> Jumps to `/aicte/tracking`.
  - **Button: "Stakeholder Governance" (Lock icon in cyan)** -> Jumps to `/aicte/stakeholders`.
- **5 National KPI Metric Cards (Interactive Links):**
  - `Institutions Monitored`: 58 AICTE Recognized Colleges, 696 active branches -> Clicks to `/aicte/institutions`.
  - `Total Student Records`: 20,700+ nationwide student records -> Clicks to `/aicte/student-inspector`.
  - `Compliant Enrolled`: 97.2% national intake compliance rate.
  - `Active Regulatory Flags`: Unresolved high-severity exceptions -> Clicks to `/aicte/tracking`.
  - `Stakeholder Gates`: 5 Registered verification entities with zero-trust consent gating.
- **Regional Compliance Grid:**
  - Tabular breakdown for Karnataka (6 colleges, 98.5% compliance), Maharashtra, Delhi NCR, Tamil Nadu.
  - *Button: "Inspect Roster"* per state -> Filters institutions directory.
- **Anomaly Breakdown & Trends Charts:**
  - Interactive Recharts visualizer displaying issue distribution by rule code and submission completion percentages.
- **Recent High-Severity Exceptions Feed:**
  - Displays latest flagged violations across colleges.
  - *Button: "Review Case"* -> Opens `/aicte/reviews/:id`.

### 4.2 Member Institutions Directory (`/aicte/institutions`)
- **Search Bar:** Live search across all 58 colleges by name, city, state, or institution code.
- **Dropdown Filters:** State selector (Karnataka, Maharashtra, etc.) and Institution Type selector (Central, State, Private).
- **Button: "Add New Institution"** -> Opens `AddMemberCollegeModal`:
  - *Form Fields:* Institution Code (auto-generated or manual), Legal Name, Type, State, City, NAAC Grade (`A++` to `B`), NAAC CGPA, NAAC Validity, NBA Tier (`Tier-1` / `Tier-2`), NBA Status, NBA File Ref, EoA Reference, Sanctioned Capacity, Branch selection checkboxes (all 12 core branches + custom).
  - *Button: "Select All Branches"* -> Selects all 12 branches at once.
  - *Button: "Cancel"* -> Closes modal.
  - *Button: "Register & Initialize Institution Node"* -> Calls `POST /api/v1/institutions`, populates database, shows success toast.
- **58 College Cards Grid:**
  - Displays college code, name, city, NAAC badge, NBA Tier-1 accreditation pill, approved branches count, and complaint log status.
  - **Button: "View Regulatory Portfolio"** -> Opens `InstitutePortfolioModal`:
    - *Tab: "Accreditation & Approvals"* -> Detailed NBA Tier, NAAC cycle and validity date, EoA sanction order reference.
    - *Tab: "Approved Intake & Quotas"* -> Tabular matrix of all branches with sanctioned capacity and category reservation division (General 40.5%, OBC 27%, SC 15%, ST 7.5%, EWS 10%, Supernumerary 5%).
    - *Tab: "Student Grievance Cell"* -> Verified complaint log, resolved count, pending count, anti-ragging cell status.
    - *Tab: "New Intake Applications"* -> Proposed branch expansion under NEP (e.g. Robotics & AI, Cyber-Physical Systems).
    - *Button: "Close"* -> Closes portfolio.
  - **Button: "Compliance Desk"** -> Opens college-specific intake compliance dashboard (`/aicte/institutions/:id`).
  - **Button: "Student Roster"** -> Opens filtered student list for that institution.

### 4.3 Student & APAAR Universal Inspector (`/aicte/student-inspector`)
- **Global Nationwide Search Input:** Instant search matching 20,700+ students by Name, 12-digit APAAR ID, Roll number, or College name.
- **Multi-Filter Bar:** Dropdowns for Institution (58 colleges), Program/Branch (all 13 branches), Category, Verification Status.
- **Results Roster Table:**
  - Columns: Candidate Name, 12-Digit APAAR ID (`XXXX-XXXX-XXXX`), Institution, Branch, Admission Cycle, Category, Verification Status, Actions.
  - **Button per row: "View Academic Dossier"** -> Opens `PrintableAcademicDossierModal`:
    - Renders official AICTE watermark, student photograph, verified identity status, 8 semesters of coursework, SGPA/CGPA progression, tampering hash, and verification QR code.
    - *Button: "Print / Save PDF Dossier" (Printer icon)* -> Opens browser print dialogue.
    - *Button: "Close" (X icon)* -> Dismisses dossier.
  - **Button per row: "Deep Inspect"** -> Navigates to `/aicte/students/:id`.

### 4.4 Case Tracking & Regulatory Timeline (`/aicte/tracking`)
- **Filter Tabs:** `All Exceptions`, `Local Duplicates (Rule 4)`, `Cross-College Duplicates (Rule 5)`, `Capacity Breaches (Rule 6)`, `Category Violations (Rule 7)`.
- **Visual 4-Stage Stepper Pipeline:**
  1. *Detected* -> Automated algorithmic rule flag raised.
  2. *Notice Dispatched* -> Formal show-cause request sent to institution registrar.
  3. *Evidence Scrutiny* -> Reviewer examines uploaded marksheets/certificates.
  4. *Determined / Sanctioned* -> Official apex ruling issued.
- **Action Buttons per Case:**
  - **Button: "Request Institution Justification"** -> Sends audit notice to college operator.
  - **Button: "Escalate to Central Scrutiny"** -> Promotes priority to critical.
  - **Button: "Sanction Resolution / Close"** -> Records settlement order and updates status.

### 4.5 Stakeholder Governance & Licensing Desk (`/aicte/stakeholders`)
- **Zero-Trust Consent Directive Hero Banner:** Details strict zero-trust rules under the DPDP Act 2023.
- **Button: "Sync Registry" (RefreshCw icon)** -> Refreshes stakeholder listings from `/api/v1/consent/stakeholders`.
- **Search Bar:** Filters verification agencies by company name, email, or purpose.
- **Filter Tabs:** `All Stakeholders`, `Approved`, `Pending Review`.
- **4 Solid High-Contrast Metric Cards:**
  - Total Registered Entities, AICTE Approved (Active), Pending Review (Awaiting), Consent Gated (100% Enforced).
- **Agency Registration Cards (NTA, TCS, Wipro, Screening Bodies):**
  - Displays agency name, entity badge (Government Exam Body / Corporate Employer / Screening Agency), contact email, declared verification purpose, and permitted zero-trust attribute scopes.
  - **Button: "Grant AICTE Approval" (CheckCircle2 icon in emerald)** *(for pending agencies)*:
    - Calls `POST /api/v1/consent/stakeholders/:id/toggle-approval`.
    - Authorizes agency to dispatch background check requests to students.
    - Shows toast: `Stakeholder approved and authorized for student-consent verification requests`.
  - **Button: "Revoke / Suspend Authorization" (XCircle icon in rose)** *(for approved agencies)*:
    - Instantly revokes authorization, blocking agency queries.

### 4.6 Regulatory Review Queue & Case Adjudication (`/aicte/reviews` & `/aicte/reviews/:id`)
- **Review Queue Table:** Lists all cases assigned to AICTE reviewers.
- **Button per row: "Adjudicate Case"** -> Opens `/aicte/reviews/:id`.
- **Review Detail Workspace:**
  - Side-by-side case dossier: displays rule violation code, severity badge, expected condition vs. observed condition.
  - Student card with APAAR ID, roll number, college code, and link to profile.
  - **Button: "Mark as False Positive"** -> Quick resolution for approved exemptions.
  - **Button: "Reopen Case"** -> Reopens resolved case for audit re-evaluation.
  - **Reviewer Assignment Selector:** Assigns case to specific AICTE compliance officer.
  - **Adjudication Form:**
    - *Dropdown: "Official Review Decision"* -> `Confirmed Discrepancy`, `Resolved / Reconciled`, `False Positive`, `Exception Approved`.
    - *Textarea: "Statutory Justification & Ruling"* -> Detailed rationale.
    - *Button: "Stamp & Issue Regulatory Order"* -> Persists order, notifies institution.

### 4.7 Integrity Monitoring & Anomaly Topology Graph (`/aicte/integrity` & `/aicte/graph`)
- **Integrity Monitoring Dashboard:** Radar charts and histograms displaying national anomaly density.
- **Integrity Graph:** Interactive D3/SVG network topology displaying circular seat-blocking rings and duplicate enrollment clusters across universities.

### 4.8 Freshness & 30-Day SLA Cadence Monitor (`/aicte/freshness`)
- Displays real-time countdown to mandatory 30-day reporting deadlines.
- **Button: "Dispatch Formal Regulatory Reminder"** -> Sends automated compliance notice to college registrar.

### 4.9 National Statutory Reports Generator (`/aicte/reports`)
- **College Selector Dropdown:** Select any individual college (e.g. `Dayananda Sagar College of Engineering - DSCE-BLR`) or `All Institutions (Consolidated National Report)`.
- **Admission Cycle Dropdown:** `2026-27`, `2025-26`, `2024-25`.
- **Statutory Report Type Selector:**
  - 1. Statutory Accreditation Audit (NAAC/NBA/NIRF).
  - 2. AICTE Regulatory Compliance & Intake Monitoring (Mandatory Form-A).
  - 3. National Policymaking & Seat Distribution Matrix.
  - 4. Program Intake Saturation & Branch Ledger.
  - 5. Institutional Integrity Discrepancy & Anomaly Audit Log.
- **Action Buttons:**
  - **Button: "Download Current Report (CSV)"** -> Exports active report as structured CSV.
  - **Button: "Download All Reports for [College] (ZIP Bundle)"** -> Generates and downloads all 5 statutory reports in a single compressed ZIP archive.
  - **Button: "Print / Export PDF Dossier"** -> Formats document with official regulatory headers and opens browser print dialogue.

### 4.10 National Analytics & Demographic Telemetry (`/aicte/analytics`)
- Time-series charts tracking enrollment growth, category allocations (General, OBC, SC, ST, EWS, NRI), and gender ratios.

---

## 5. Institutional Academic Workspace (`/institution`)
*(Benchmarked with Dayananda Sagar College of Engineering - DSCE, Bengaluru)*

### 5.1 Institution Node Overview Dashboard (`/institution`)
- **Institution Header:** Displays college name, institution code (`DSCE-BLR`), city (`Bengaluru, Karnataka`), and active node status.
- **4 Key Metric Cards (Interactive Links):**
  - `Total Students` (1,233+) -> Navigates to `/institution/students`.
  - `Valid Records` (1,226) -> Filters students by `status=accepted`.
  - `Flagged Records` (7) -> Filters students by `status=flagged`.
  - `Pending Issues` (7) -> Navigates to `/institution/issues`.
- **Top Action Bar Buttons:**
  - **Button: "Upload Data" (UploadCloud icon)** -> Opens `/institution/upload`.
  - **Button: "APAAR Quick Desk" (Sparkles icon)** -> Opens `/institution/apaar-desk`.
  - **Button: "Intake & Quotas Desk" (BarChart3 icon)** -> Opens `/institution/compliance`.
  - **Button: "Statutory Reports" (FileSpreadsheet icon)** -> Opens `/institution/reports`.
- **Program Intake Analytics Section:** Visual progress bars displaying capacity saturation across all 13 branches.

### 5.2 Student Registry & Enrollment DataTable (`/institution/students`)
- **Search Input:** Multi-column search matching student names, roll numbers, or APAAR IDs.
- **Filters:** Branch dropdown, Category dropdown (General, OBC, SC, ST, EWS), Status dropdown (Accepted, Flagged, Submitted).
- **Button: "Register Individual Student"** -> Opens manual registration modal:
  - *Fields:* Full Name, Roll No, Branch, Cycle, Category, Gender, DOB, Supernumerary status.
  - *Button: "Cancel"* -> Dismisses modal.
  - *Button: "Save & Validate Student"* -> Creates record, executes immediate 9-rule validation check.
- **Students DataTable:**
  - Displays Candidate Name, Roll Number, 12-Digit APAAR ID (`XXXX-XXXX-XXXX`), Branch, Category, Verification Status, Record Status, Actions.
  - **Button per row: "Inspect Details" (Eye icon)** -> Navigates to `/institution/students/:id`.
  - **Button per row: "Digital Degree Certificate" (Award icon)** -> Opens `DegreeCertificateModal`:
    - Renders official collegiate degree certificate complete with student credentials, conferral date, SHA-256 integrity hash, institutional seal, and verification QR code.
    - *Button: "Print / Save as PDF"* -> Triggers browser print/PDF generation.
    - *Button: "Close"* -> Dismisses certificate.
- **Pagination Controls:** Supports 10, 25, 50 rows per page across DSCE's 1,233+ student roster.

### 5.3 Student Detailed Profile & Evidentiary Dossier (`/institution/students/:id`)
- **Profile Header:** Displays student name, roll number, 12-digit APAAR ID (`XXXX-XXXX-XXXX`), branch, admission cycle, admission status.
- **Tab 1: "Student Details":**
  - Demographics, admission details, supernumerary/NRI classification, mock Aadhaar match score.
  - **Button: "Edit Student Record" (FileEdit icon)** -> Toggles inline editing mode.
  - **Button: "Save Changes" (Save icon)** -> Persists edits to backend.
  - **Button: "Cancel Edit"** -> Restores original values.
  - **Button: "Run Validation Engine on Record" (Sparkles icon)** -> Re-evaluates all 9 rules on this candidate in real time.
- **Tab 2: "Audit & Version History":**
  - Complete version-by-version audit trail showing changed fields, timestamp, and actor ID.
- **Tab 3: "Compliance & Anomaly Issues":**
  - Lists open validation issues for this student.
  - **Button: "Resolve Issue"** -> Opens resolution modal with actions (`Resolved`, `False Positive`, `Exception Approved`) and justification notes.
  - **Button: "Reopen Issue"** -> Reopens resolved issue.
- **Tab 4: "OCR Document Reconciliation":**
  - Simulates AI-assisted marksheet verification:
  - Document type dropdown, file name input, extracted marksheet attributes (Name, Roll, DOB, Institution, Marks).
  - **Button: "Run AI Document Cross-Reconciliation" (ScanLine icon)** -> Calls `/api/v1/ocr/reconcile`, calculates confidence percentage, flags mismatches, and saves to reconciliation log.
- **Tab 5: "Verifiable Credential & PKI Signature":**
  - Displays W3C-compliant Verifiable Credential JSON payload, SHA-256 PKI signature, and QR code.
  - **Button: "Generate / Download Verifiable Credential"** -> Exports signed JSON-LD.
  - **Button: "Open Degree Certificate Modal"** -> Opens certificate modal.

### 5.4 Batch CSV Data Ingestion Engine (`/institution/upload`)
- **Drag-and-Drop Upload Area:** Drag `.csv` file or click to browse file system.
- **Button: "Download Sample AICTE-Compliant CSV Template" (Download icon)**:
  - Downloads `DSCE_Sample_Student_Upload_Batch.csv`.
  - Pre-filled with valid DSCE engineering students and 12-digit hyphenated APAAR IDs.
- **In-Browser Pre-Upload Preview Table:** Displays parsed rows, verifies required column headers, checks APAAR formatting before sending to server.
- **Button: "Submit Batch for AICTE Algorithmic Verification" (UploadCloud icon)**:
  - Sends file to `POST /api/v1/uploads`.
  - Executes batch validation against all 9 rules.
  - Displays summary: Total Rows, Valid Rows, Invalid Rows, and breakdown of detected rule violations.
- **Button: "View Uploaded Batch in History"** -> Navigates to `/institution/uploads`.

### 5.5 APAAR Quick Desk — Rapid Rectification Testbench (`/institution/apaar-desk`)
- **Gatekeeper Query Input:** Enter 12-digit APAAR ID (`XXXX-XXXX-XXXX`).
- **Quick Pick Demo Chips:**
  - `DSCE Cyber Security (Aarav)` (`9876-5432-1011`)
  - `DSCE CS Student` (`9039-4117-5224`)
  - `IIT Delhi Student` (`5955-6904-7397`)
  - `NIT Surathkal` (`1001-8368-1205`)
- **Button: "Fetch & Unlock Student Record" (Search icon)**:
  - Calls `GET /api/v1/students/lookup/apaar/{id}`.
  - Unlocks editable form and displays student's current program, institution, and open anomaly issues.
- **Rapid Update Form:**
  - Editable fields: Proposed Name, Proposed Category, Proposed Status, Proposed DOB, Proposed Gender, Proposed Supernumerary Category.
  - Document Upload simulation: Document type, file name, SHA-256 checksum input.
  - **Button: "Verify Document Checksum" (ShieldCheck icon)** -> Validates hash against tamper registry.
  - Mandatory Regulatory Justification textarea.
  - **Button: "Submit Rapid Correction Petition to AICTE" (Send icon)**:
    - Calls `POST /api/v1/corrections-workflow`.
    - Automatically updates student record, attaches justification, and routes ticket to AICTE.

### 5.6 Upload History & Checksum Roster (`/institution/uploads`)
- Renders table of all batch uploads with filename, submission timestamp, total rows, valid rows, invalid rows, and SHA-256 file checksum.
- **Button per batch: "Download Error Roster (CSV)"** -> Downloads only the invalid rows with rule violation reasons.
- **Button per batch: "Inspect Batch Details"** -> Displays detailed row-by-row breakdown.

### 5.7 Validation Issues & Anomaly Desk (`/institution/issues`)
- **Filter Tabs by Severity:** `All Issues`, `Critical`, `High`, `Medium`.
- **Filter Tabs by Status:** `Open`, `Under Review`, `Resolved`.
- **Issues Roster Table:**
  - Displays Rule Code, Affected Field, Observed vs. Expected Condition, Student Name, Roll Number, Severity.
  - **Button: "Open Correction Ticket"** -> Opens correction petition modal.
  - **Button: "View Student"** -> Jumps to student detail page.

### 5.8 Corrections & Rectification Petition Workflow (`/institution/corrections`)
- **Button: "Submit New Correction Petition" (Plus icon)**:
  - Opens modal to select student, target field (Name, Roll No, Category, Quota), input corrected value, registrar justification, and attach evidence.
  - **Button: "Submit Petition to AICTE"** -> Sends ticket to `/api/v1/corrections`.
- **Corrections Tracking Board:** Shows status cards: `Submitted`, `Under AICTE Scrutiny`, `Approved & Reconciled`, `Rejected`.

### 5.9 Intake & Quotas Compliance Desk (`/institution/compliance`)
- **Program Intake vs. Enrolment Matrix:**
  - Table of all 13 branches with AICTE Approved Intake, Actual Admitted Students, and Utilization Percentage.
  - Highlights capacity overages in red (e.g. AI & ML at 122 enrolled vs. 120 approved).
- **Supernumerary Quotas Breakdown:**
  - Specific counts for NRI seats, Foreign National seats, Kashmiri Migrants, and reservation categories.
- **Button: "Export Institutional Compliance Roster (CSV)" (Download icon)**:
  - Downloads full student roster with admission category and quota metadata.

### 5.10 Program Intake Matrix & Sanction Orders (`/institution/intake`)
- Tabular ledger of AICTE Extension of Approval (EoA) sanction orders, program codes, and effective academic years.

### 5.11 Campus ERP & Institutional Integration APIs (`/institution/api-keys`)
- **Institutional API Keys:**
  - **Button: "Generate New API Key" (Plus icon)** -> Opens modal, generates key with scopes (`student:read`, `student:write`, `batch:upload`), displays secret with copy button.
  - **Button: "Revoke Key" (Trash2 icon)** -> Inactivates key with confirmation alert.
  - **Button: "Copy Token" (Copy icon)** -> Copies key to clipboard.
- **Webhook Endpoint Management:**
  - Inputs: Target Webhook URL, Secret Token.
  - Event checkboxes: `issue.flagged`, `review.decided`, `intake.warning`.
  - **Button: "Save Webhook Configuration" (Save icon)** -> Stores webhook endpoint.
  - **Button: "Dispatch Test Webhook Ping" (Send icon)** -> Sends mock JSON event payload.
- **Interactive Live SIS Ingestion Simulator:**
  - **Button: "Simulate Live Student Registration Push from Campus ERP"**:
    - Dispatches a live student payload from campus ERP to verify automated real-time validation.
- **Quick Integration Code Snippets:** Tabs with copyable integration code in cURL, Python, and Node.js.

### 5.12 Institution Statutory Reports Generator (`/institution/reports`)
- College-level reports generator (AICTE Form-A, NAAC Accreditation, Intake Saturation).
- **Button: "Generate Report Preview"** -> Displays live table preview.
- **Button: "Download CSV"** -> Exports report.
- **Button: "Print / Export PDF"** -> Generates print-ready document.

---

## 6. Student Consent Portal Gateway (`/student`)
*(Benchmarked with Aarav Sharma, Cyber Security, DSCE — or newly registered student)*

The Student Portal enforces the **Digital Personal Data Protection (DPDP) Act 2023**, ensuring students maintain exclusive sovereignty over who can inspect their academic credentials.

- **Dynamic Student Identity Card:**
  - Displays official APAAR emblem, student photograph, 12-digit hyphenated APAAR ID (`XXXX-XXXX-XXXX`), full legal name, institution name, branch, admission cycle, and verification badge.
  - **Button: "Copy APAAR ID" (Copy icon)** -> Copies formatted ID to clipboard.
  - **Button: "Download Digital APAAR Card" (Download icon)** -> Exports clean identity card image.
- **Academic Progress & Enrolled Courses Summary:**
  - Semester-by-semester course tabs (Semester 1 to Semester 8).
  - Displays Subject Code, Course Title, Credits, Letter Grade, Points Earned.
  - Summary metrics: Total Credits Completed, Cumulative Grade Point Average (CGPA).
- **Button: "View Printable Academic Dossier" (Printer icon)**:
  - Opens `PrintableAcademicDossierModal` displaying official transcript with AICTE watermark and verification QR code.
- **Zero-Trust Background Check Request Center (DPDP Act Consent Wall):**
  - Lists incoming verification requests sent by third-party agencies (e.g. NTA, TCS, Infosys, Wipro).
  - Displays Requesting Agency Name, Organization Type, Declared Purpose (e.g. `Pre-Employment Background Verification`, `Exam Eligibility Clearance`), Requested Attributes, and Timestamp.
  - **Button: "Approve Verification Request" (CheckCircle2 icon in green)**:
    - Calls `POST /api/v1/consent/students/request/{id}/approve`.
    - Unlocks transcripts *only* for that authorized stakeholder.
    - Updates status badge to `Approved by Student`.
    - Shows toast: `Consent authorization granted! Stakeholder can now verify academic credentials.`
  - **Button: "Deny / Reject Request" (XCircle icon in rose)**:
    - Permanently locks transcripts from that agency.
    - Updates status badge to `Denied by Student`.
- **Stakeholder Reviewer Determinations Desk:**
  - Displays official audit findings stamped by external agencies (e.g. TCS review verdict `VERIFIED_ELIGIBLE`, reviewer name, verification seal hash, and date).
- **Multi-Stage Data Correction Petitions:**
  - **Button: "Raise Data Discrepancy / Correction" (Edit3 icon)** -> Opens correction modal:
    - Select field to update (Full Name, Date of Birth, Gender, Roll Number, Branch, Category), enter proposed new value, state justification reason.
    - **Button: "Submit Correction Petition"** -> Submits petition to institution operator.
  - Workflow Tracking Stepper: Shows multi-stage status: `Student Submitted` -> `Institution Endorsed` -> `AICTE Apex Approved`.
- **Button: "Sign Out" (LogOut icon)** -> Clears session and returns to login.

---

## 7. Stakeholder Verification Workspace (`/stakeholder`)
*(For external verification agencies: NTA, TCS Talent Acquisition, Wipro, Corporate Recruiters)*

- **Header Bar:** Displays stakeholder identity, agency badge, and active zero-trust consent gate indicator.
- **Acting Stakeholder Identity Selector Dropdown:**
  - `National Testing Agency (NTA)` (Government Exam Body)
  - `Tata Consultancy Services (TCS)` (Corporate Employer)
  - `Infosys Verification Services` (Corporate Employer)
  - `First Advantage Screening` (Background Verifier)
- **Candidate Query Desk:**
  - *Input:* Enter candidate 12-Digit APAAR ID (`XXXX-XXXX-XXXX`).
  - **Button: "Verify Credential" (ShieldCheck icon)** -> Queries platform for candidate status.
  - **Button: "Request Background Check" (Send icon)** -> Opens background check request modal.
- **Case 1: When Student Has NOT Yet Approved Consent (Locked State):**
  - Displays red privacy shield: **"Access Restricted: Consent Not Granted"**.
  - Message explaining records are private and require explicit student permission.
  - Displays masked student identifier.
  - **Button: "Send Official Background Check Request to Candidate" (Send icon)**:
    - Pushes a real-time background check request directly to candidate's Student Portal.
    - Sets status to `Request Dispatched — Awaiting Student Approval in Portal`.
- **Case 2: When Student HAS Approved Consent (Unlocked State):**
  - Displays green authorized shield: **"Applicant Consent Verified — Records Unlocked"**.
  - Unlocks candidate name, college, branch, roll number, admission cycle.
  - Displays verified academic marksheets with cryptographic SHA-256 hashes.
  - **Button: "Print Verified Dossier" (Printer icon)** -> Opens printable academic dossier.
- **Reviewer of Stakeholders Determination Desk:**
  - Official third-party audit station for recording background check results:
  - *Input:* Reviewing Officer Name & Designation.
  - *Dropdown: "Official Determination Verdict"* -> `Verified & Recommended`, `Discrepancy Found in Submitted Claims`, `Incomplete Documentation / Unverified`.
  - *Textarea:* Detailed review notes and justification.
  - **Button: "Submit Official Review Determination" (UserCheck icon)**:
    - Calls `POST /api/v1/consent/stakeholder-reviews`.
    - Generates SHA-256 verification seal hash.
    - Permanently logs determination in historical audit roster.
- **Past Verifications Log Table:** Lists all candidate checks performed with determination stamps.

---

## 8. Public Verifier Gateway (`/verify` & `/verify/result`)

- **Zero-Login Universal Verification:** Accessible publicly without an account.
- **Verification Modes:**
  - *Mode 1: "Verify by 12-Digit APAAR ID or Roll Number"*:
    - Role selector (Employer, AICTE Auditor, University Registrar, Testing Body).
    - Purpose selector (Employment Screening, Admission Verification, Transfer, Exam Registration).
    - **Button: "Verify Credential"** -> Calls `/api/v1/verification/verify-identifier`.
  - *Mode 2: "Demonstration Personas & Quick Verification Showcase"*:
    - 1-click verification cards for Aarav Sharma (Cyber Security), Kavya Venkatesh (Supernumerary NRI Quota), Rohan Verma (General Quota), Sneha Kulkarni (EWS Quota).
  - *Mode 3: "Verify by Cryptographic Token / QR Code Scan"*:
    - JWT token input textarea.
    - **Button: "Paste Sample Token"** -> Injects demo token.
    - **Button: "Simulate QR Camera Scan"** -> Decodes sample QR code.
    - **Button: "Verify Cryptographic PKI Signature"** -> Validates RS256 signature against AICTE JWKS endpoint.
- **Verification Results Page (`/verify/result`):**
  - Renders official AICTE digital seal.
  - Displays cryptographic integrity status: `100% Cryptographically Authentic & Untampered`.
  - Shows student name, granting college, conferment date, and blockchain-style validation block.

---

## 9. Core 9-Rule Algorithmic Validation Engine & Specific Problem Cases

The deterministic engine evaluates every candidate during batch ingestion and live API submission:

| Rule Code | Severity | Algorithmic Check & Rule Logic |
| :--- | :--- | :--- |
| **Rule 1: FORMAT_VALIDATION** | High | Enforces strict 12-digit hyphenated APAAR ID format (`XXXX-XXXX-XXXX`). Rejects bad formats. |
| **Rule 2: MANDATORY_FIELDS** | High | Validates presence of Name, DOB, Roll No, Branch, Admission Cycle, and Category. |
| **Rule 3: IDENTITY_PROOF_MATCH** | Critical | Matches candidate against authoritative master with cryptographic confidence scoring. |
| **Rule 4: DUPLICATE_LOCAL_RECORD** | High | Flags duplicate enrollments or repeated roll numbers within the same institution in the same cycle. |
| **Rule 5: POTENTIAL_CROSS_INSTITUTION_DUPLICATE** | Critical | Flags duplicate active admissions across two or more colleges nationwide (stops seat-blocking scams). |
| **Rule 6: INTAKE_EXCEEDED** | High | Flags branch admissions exceeding AICTE approved capacity (e.g. DSCE AI & ML at 122 vs 120 cap). |
| **Rule 7: CATEGORY_INCONSISTENCY** | High | Flags quota violations, unverified caste reservation certificates, or exhausted supernumerary allocations. |
| **Rule 8: CHRONOLOGICAL_SANITY** | Medium | Verifies admission date occurs after high school graduation date and date of birth. |
| **Rule 9: TRANSCRIPT_INTEGRITY** | High | Validates SHA-256 tamper-evident hash matches institutional repository record. |

### The 4 Specific Problem Cases Seeded for Demonstration
Strictly seeded across 4 selected institutions (DSCE Bengaluru, Demo Engineering College Pune, NIT Demo, IIT Demo) with exactly 5 students per problem college:
1. **Rule 4 Case (Local Deduplication):** Candidate identity reference has duplicate active enrollment record in same institution (`count(identity_reference) > 1`).
2. **Rule 5 Case (Cross-Institution Duplicate):** Dual active enrollment detected across national seat allotment database (`unique_active_enrolment == 2`).
3. **Rule 6 Case (Capacity Limit Breach):** Program intake capacity exceeded against AICTE sanctioned quota (`enrolled > approved_capacity`). Benchmark: DSCE B.Tech AI & Machine Learning has 122 enrolled against 120 approved capacity.
4. **Rule 7 Case (Admission Category Consistency):** Inconsistent admission category or lapsed quota certificate detected (`category_verified == False`).

---

## 10. Automated Seeding, Startup Lifecycle & Cloud Deployment Mechanics

To guarantee zero setup friction on any cloud environment (such as **Render, Docker, or localhost**):

1. **Automated Self-Healing Seeding in FastAPI (`app/main.py`):**
   - In the server's `lifespan(app)` startup hook, the platform automatically inspects database counts on boot.
   - If the database is clean, or if DSCE has fewer than 1,000 students, it automatically triggers `seed_expanded_colleges.run_seed()`.
   - **Populates automatically:**
     - **58 AICTE Recognized Colleges** across India.
     - **All 13 Core Engineering Branches** for every institution (including Computer Science, Cyber Security, AI & ML, Robotics, Biotechnology, Data Science).
     - **1,233+ Student Records specifically for DSCE** (exceeding the 1,111 minimum requirement).
     - **20,700+ Student Records nationwide**, all formatted with strict 12-digit hyphenated APAAR IDs (`XXXX-XXXX-XXXX`).
     - **The 4 Specific Problem Cases** seeded into DSCE, DEC Pune, NIT Demo, and IIT Demo demonstrating Rules 4, 5, 6, and 7.

2. **One-Click Local Runners:**
   - [`run_local.bat`](file:///c:/Users/Keerthi/OneDrive/Desktop/sih%203.0/apaar-verify/run_local.bat) (Windows) and [`run_local.sh`](file:///c:/Users/Keerthi/OneDrive/Desktop/sih%203.0/apaar-verify/run_local.sh) (Linux/macOS) install dependencies, seed both datasets, build the frontend, and launch the server on `http://localhost:8000`.

3. **Multi-Stage Cloud Dockerfile:**
   - Combines a Node.js 20 frontend builder with a lightweight Python 3.11 server serving both API endpoints and the compiled single-page application from a single port.

---

### Verification & Feature Completeness Checklist
- [x] Strict 12-digit APAAR ID format (`XXXX-XXXX-XXXX`) enforced across all pages, forms, and database records.
- [x] All 58 AICTE recognized member colleges populated with complete NBA, NAAC, complaints, and quota portfolios.
- [x] Full 13 engineering departments seeded in DSCE with **1,233+ students**, including dedicated **Cyber Security branch**.
- [x] AICTE Command Center navigation streamlined (external student & stakeholder links removed from admin sidebar).
- [x] Institutional Academic Workspace equipped with complete compliance, intake, and corrections tools.
- [x] Comprehensive Statutory Reports generator supporting college-specific filtering and export (e.g. DSCE only).
- [x] DPDP Act compliant Student Consent Gateway with encrypted background check authorization.
- [x] Dedicated Stakeholder Verification Workspace with Reviewer of Stakeholders Determination Desk.
- [x] High-contrast, crystal-clear UI design across all cards, badges, buttons, and telemetry widgets.
- [x] Dual-repo GitHub deployment live on `apaar-verify` and `apaar-verify3.0`.
