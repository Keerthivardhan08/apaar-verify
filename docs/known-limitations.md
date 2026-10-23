# Known Limitations — APAAR Verify MVP

> This document is part of the required demonstration disclosure.  
> All limitations must be clearly communicated to evaluators and stakeholders.

---

## 1. Authorization and Legal Status

- **APAAR Verify is a prototype**, not an official AICTE service.
- It has **no authorization** to access real APAAR, UDISE+, or any government identity infrastructure.
- It cannot issue legally binding academic credentials.
- No regulatory decision made using this platform has official standing.
- Institutions using this platform for real student data must independently establish their lawful basis for processing.

---

## 2. Identity Verification

- The verification provider is a **mock adapter** that always returns `mock_verified`.
- The system **cannot perform real APAAR identity verification**.
- `mock_verified` status means: the identifier was submitted to the demo provider and received a simulated positive response. It **does not** mean the identifier is valid or belongs to the student.
- The `verified` status is reserved for an authorized provider workflow that does not exist in this MVP.

---

## 3. Intake Limits

- All approved intake figures are **seeded demonstration data**.
- They do not reflect official AICTE-approved capacity for any real institution.
- Category-level capacity calculations follow simplified rules and may not match the current official policy for all seat types.
- The system assumes intake data is available; in production, the source and authorization of every intake figure must be independently validated.

---

## 4. Identifier Format

- The demo identifier validation uses a **fictional format** (`DEMO-[A-Z0-9]{4,20}` or 12-digit).
- This is **not the official APAAR identifier format**.
- Do not publish or implement based on the format used here. Obtain the official format from the authorized documentation before building a production system.

---

## 5. Cryptographic Credentials

- QR credentials are signed using **HS256** (symmetric key) for demonstration.
- Production credentials require **RS256** (asymmetric key) with proper key management (HSM, rotation, escrow).
- The signing key is stored as an environment variable — acceptable for demonstration, **not acceptable** for production.
- The demo issuer (`apaar-verify-demo`) has no trust anchor in any public PKI.
- Credential verification demonstrates the technical workflow, not official issuer trust.

---

## 6. Data Privacy

- The platform is built to work with **synthetic data only**.
- Do not load real student records into this system.
- The identifier fingerprinting uses a keyed HMAC — appropriate for matching, but the key must be rotated, protected, and managed independently in production.
- No consent management, right-to-erasure, or data portability workflows are implemented in the MVP.

---

## 7. Audit Trail

- The hash-chained audit log detects modifications to individual events, but does **not** provide cryptographic non-repudiation.
- A privileged attacker who can rewrite the entire event chain can defeat the basic implementation.
- Production audit assurance requires: protected write-once storage, restricted admin access, off-system audit copies, and independent log verification.

---

## 8. Performance

- The system is designed and tested for a **demonstration dataset of ~1,000 records**.
- It has not been load-tested for national-scale usage.
- Background job processing for large uploads is not implemented in the MVP.
- Dashboard queries are not optimized with materialized views or caching.

---

## 9. Validation Rules

- Rule weights and severity levels are configurable but **not calibrated against real data**.
- Category inconsistency rules are based on the development team's reading of policy descriptions. They must be reviewed against official policy before production.
- The unusual update pattern rule uses a simple threshold (>5 versions in 24h) that may need adjustment based on real institutional behavior.

---

## 10. Student Portal

- The Student Trust Portal is an optional Phase 1 feature and is **not implemented** in the 7-day MVP.
- Student authentication requires a separate, approved identity mechanism (e.g., DigiLocker, official government ID verification) before real records can be exposed.

---

## 11. Deployment

- Free-tier hosting may have sleep/idle timeouts that affect demo reliability.
- Database persistence on free tiers may not be guaranteed across deployments.
- Always test the complete demo workflow on the actual deployment environment before presenting.

---

*Known limitations version: 0.1 — MVP Demonstration*  
*Review before any production deployment.*
