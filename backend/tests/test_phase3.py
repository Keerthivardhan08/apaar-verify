"""
Phase 3 Comprehensive Test Suite.

Verifies:
1. Approved Institutional Direct SIS/ERP APIs (Key Generation, Header Auth, Direct Batch Ingestion).
2. Institutional Webhooks.
3. Authoritative Reference Master Synchronization and Capacity Reconciliation.
4. Source Freshness Monitoring and Regulatory SLA compliance tracking.
5. Expanded Multi-Stage Correction Reconciliation (Operator -> Inst Admin -> AICTE Reviewer).
6. Zero-Knowledge & Blinded Privacy Claim Proofs (RS256 PKI signed zero-PII assertions).
"""
import uuid
import datetime
import pytest

from app.models.institution import Institution, Program
from app.models.student import StudentRecord
from app.services.reference_data import sync_authoritative_registry, reconcile_intake_against_master
from app.services.freshness import get_freshness_overview, get_institution_freshness_profile
from app.services.zk_exchange import generate_blinded_claim_proof, verify_blinded_claim_proof


def test_institutional_api_keys_and_sis_push(client, operator_token, db_session):
    """Test Institutional API Key generation, authorization, and direct SIS ERP ingestion."""
    inst = db_session.query(Institution).first()
    prog = db_session.query(Program).first()

    headers = {"Authorization": f"Bearer {operator_token}"}

    # 1. Generate Institutional API Key
    key_resp = client.post(
        "/api/v1/institution-api/keys",
        headers=headers,
        json={
            "institution_id": str(inst.id),
            "key_name": "Campus ERP Primary Gateway",
            "permissions": ["student:read", "student:write", "batch:upload"],
        },
    )
    assert key_resp.status_code == 201
    key_data = key_resp.json()
    assert "api_key_secret" in key_data
    raw_api_key = key_data["api_key_secret"]
    assert raw_api_key.startswith("inst_live_")

    # 2. List keys
    list_resp = client.get("/api/v1/institution-api/keys", headers=headers)
    assert list_resp.status_code == 200
    assert any(k["id"] == key_data["id"] for k in list_resp.json())

    # 3. Direct Machine-to-Machine SIS ERP Ingestion
    sis_headers = {"X-Institution-API-Key": raw_api_key}
    push_payload = {
        "admission_cycle": "2026-27",
        "records": [
            {
                "institution_student_id": "ERP-BATCH-001",
                "student_name": "Rahul Verma",
                "program_id": str(prog.id),
                "admission_cycle": "2026-27",
                "admission_category": "general",
                "admission_status": "admitted",
                "identity_reference": "DEMO-RAHUL-001",
            },
            {
                "institution_student_id": "ERP-BATCH-002",
                "student_name": "Priya Nair",
                "program_id": str(prog.id),
                "admission_cycle": "2026-27",
                "admission_category": "obc",
                "admission_status": "admitted",
                "identity_reference": "DEMO-PRIYA-002",
            },
        ],
    }

    push_resp = client.post(
        "/api/v1/institution-api/v1/sis/push-records",
        headers=sis_headers,
        json=push_payload,
    )
    assert push_resp.status_code == 200
    res_data = push_resp.json()
    assert res_data["status"] == "success"
    assert res_data["records_imported"] == 2

    # 4. Revoke Key
    del_resp = client.delete(f"/api/v1/institution-api/keys/{key_data['id']}", headers=headers)
    assert del_resp.status_code == 200

    # Test revoked key rejected
    push_rejected = client.post(
        "/api/v1/institution-api/v1/sis/push-records",
        headers=sis_headers,
        json=push_payload,
    )
    assert push_rejected.status_code == 401


def test_institutional_webhooks(client, operator_token, db_session):
    """Test webhook registration and listing."""
    inst = db_session.query(Institution).first()
    headers = {"Authorization": f"Bearer {operator_token}"}

    resp = client.post(
        "/api/v1/institution-api/webhooks",
        headers=headers,
        json={
            "institution_id": str(inst.id),
            "target_url": "https://erp.testinstitute.edu/api/webhooks/apaar",
            "event_types": ["issue.flagged", "review.decided"],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "secret_token" in data
    assert data["target_url"] == "https://erp.testinstitute.edu/api/webhooks/apaar"

    list_resp = client.get("/api/v1/institution-api/webhooks", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1


def test_authoritative_reference_sync_and_reconciliation(client, admin_token, db_session):
    """Test authoritative reference data sync and intake reconciliation."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Trigger sync via API
    sync_resp = client.post("/api/v1/reference-data/sync/aicte_portal", headers=headers)
    assert sync_resp.status_code == 200
    sync_data = sync_resp.json()
    assert sync_data["sync_status"] == "synced"
    assert "checksum" in sync_data

    # 2. Get reconciliation report
    rec_resp = client.get("/api/v1/reference-data/reconciliation?admission_cycle=2026-27", headers=headers)
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()
    assert "reconciliation_rows" in rec_data
    assert rec_data["total_programs_evaluated"] >= 1
    assert "overall_utilization_pct" in rec_data


def test_source_freshness_and_sla_monitoring(client, admin_token, db_session):
    """Test data freshness calculation and SLA breach monitoring."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    overview_resp = client.get("/api/v1/freshness/overview", headers=headers)
    assert overview_resp.status_code == 200
    data = overview_resp.json()
    assert "sla_compliance_pct" in data
    assert "summary" in data
    assert "institutions" in data
    assert len(data["institutions"]) >= 1

    first_inst = data["institutions"][0]
    assert "days_since_last_submission" in first_inst
    assert first_inst["freshness_status"] in ["FRESH", "MODERATE", "STALE", "CRITICAL_SLA_BREACHED"]


def test_expanded_correction_workflow_lifecycle(client, operator_token, admin_token, test_student, db_session):
    """Test full multi-stage correction workflow (Operator -> Inst Admin -> AICTE Reviewer)."""
    op_headers = {"Authorization": f"Bearer {operator_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Operator submits proposal
    sub_resp = client.post(
        "/api/v1/corrections-workflow/submit",
        headers=op_headers,
        json={
            "record_id": str(test_student.id),
            "field_name": "student_name",
            "proposed_value": "Corrected Student Name",
            "operator_notes": "Official matriculation certificate verified by admissions office.",
        },
    )
    assert sub_resp.status_code == 201
    wf_data = sub_resp.json()
    wf_id = wf_data["workflow_id"]
    assert wf_data["stage"] == "operator_draft"
    assert wf_data["workflow_status"] == "pending_institution_admin"

    # 2. Institution Admin reviews and approves
    inst_action_resp = client.post(
        f"/api/v1/corrections-workflow/{wf_id}/institution-action",
        headers=op_headers,
        json={
            "decision": "approve",
            "notes": "Verified against institutional registrar register.",
        },
    )
    assert inst_action_resp.status_code == 200
    assert inst_action_resp.json()["stage"] == "inst_admin_approved"
    assert inst_action_resp.json()["workflow_status"] == "pending_aicte_review"

    # 3. AICTE Reviewer makes final regulatory determination
    aicte_action_resp = client.post(
        f"/api/v1/corrections-workflow/{wf_id}/aicte-action",
        headers=admin_headers,
        json={
            "decision": "approve",
            "notes": "Regulatory approval granted. Applying diff.",
        },
    )
    assert aicte_action_resp.status_code == 200
    assert aicte_action_resp.json()["stage"] == "aicte_verified"
    assert aicte_action_resp.json()["workflow_status"] == "approved_applied"

    # Verify student record was updated in database
    db_session.refresh(test_student)
    assert test_student.student_name == "Corrected Student Name"
    assert test_student.record_status == "corrected"


def test_zk_blinded_privacy_exchange(client, admin_token, test_student, db_session):
    """Test zero-knowledge blinded claim proof issuance and independent verification."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Issue blinded age claim proof
    issue_resp = client.post(
        "/api/v1/privacy-exchange/blinded-proof",
        headers=headers,
        json={
            "record_id": str(test_student.id),
            "predicate": "MINIMUM_AGE_18",
            "verifier_audience": "National Scholarship Portal",
        },
    )
    assert issue_resp.status_code == 201
    proof = issue_resp.json()
    assert "proof_token" in proof
    assert proof["predicate"] == "MINIMUM_AGE_18"
    assert proof["assertion"] is True
    assert proof["zero_pii"] is True
    assert "BLINDED-STD-" in proof["blinded_subject"]

    # 2. Independent Public Verification of Blinded Claim
    verify_resp = client.post(
        "/api/v1/privacy-exchange/verify-proof",
        json={"proof_token": proof["proof_token"]},
    )
    assert verify_resp.status_code == 200
    v_data = verify_resp.json()
    assert v_data["valid"] is True
    assert v_data["assertion"] is True
    assert v_data["predicate"] == "MINIMUM_AGE_18"
    assert v_data["zero_pii_confirmed"] is True
