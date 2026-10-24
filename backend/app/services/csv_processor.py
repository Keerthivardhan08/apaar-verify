import csv
import io
import re
import uuid
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Set, Tuple
from sqlalchemy.orm import Session

from app.config import settings
from app.models.institution import Program
from app.models.student import StudentRecord
from app.core.security import compute_identifier_fingerprint


EXPECTED_COLUMNS = [
    "institution_student_id",
    "student_name",
    "date_of_birth",
    "gender",
    "identity_reference",
    "admission_category",
    "nri_category",
    "oci_status",
    "foreign_national_status",
    "supernumerary_category",
    "admission_status",
    "program_code",
]

VALID_CATEGORIES = {
    "general", "obc", "sc", "st", "ews", "nri", "oci",
    "foreign_national", "management_quota"
}

VALID_STATUSES = {"admitted", "provisional", "cancelled", "migrated"}
VALID_YES_NO = {"applicable", "not_applicable"}
VALID_SUPERNUMERARY = {"none", "nri", "foreign_national", "kashmiri_migrant", "other"}
DEMO_IDENTIFIER_PATTERN = re.compile(r"^DEMO-[A-Z0-9_-]{4,25}$|^[0-9]{12}$")


def sanitize_formula_injection(val: Any) -> str:
    """
    Sanitize potential formula injection in CSV cells.
    Any string starting with =, +, -, or @ is prefixed with a single quote.
    """
    if val is None:
        return ""
    s = str(val).strip()
    if s and s[0] in ("=", "+", "-", "@"):
        return f"'{s}"
    return s


def sanitize_row_for_export(row: Dict[str, Any]) -> Dict[str, str]:
    """Sanitize all values in a dictionary row for CSV export."""
    return {k: sanitize_formula_injection(v) for k, v in row.items()}


def export_csv_sanitized(rows: List[Dict[str, Any]], fieldnames: List[str]) -> str:
    """
    Generate CSV text from a list of dicts with formula injection protection applied.
    """
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        sanitized_row = {k: sanitize_formula_injection(row.get(k)) for k in fieldnames}
        writer.writerow(sanitized_row)
    return output.getvalue()


def parse_and_validate_csv(
    file_bytes: bytes,
    institution_id: uuid.UUID,
    admission_cycle: str,
    db: Session,
) -> Dict[str, Any]:
    """
    Parse uploaded CSV bytes, validate headers, detect intra-batch duplicates,
    verify programs belong to the institution, and return structured row data and errors.
    """
    # 1. Check size
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        return {
            "success": False,
            "error": f"File size exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB",
            "total_rows": 0,
            "valid_rows": [],
            "invalid_rows": [],
            "errors": [],
        }

    # 2. Decode content
    content_str = None
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            content_str = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if content_str is None:
        return {
            "success": False,
            "error": "Could not decode file with supported encodings (UTF-8, Latin-1)",
            "total_rows": 0,
            "valid_rows": [],
            "invalid_rows": [],
            "errors": [],
        }

    # 3. Read CSV
    stream = io.StringIO(content_str)
    reader = csv.DictReader(stream)
    if not reader.fieldnames:
        return {
            "success": False,
            "error": "CSV file is empty or missing headers",
            "total_rows": 0,
            "valid_rows": [],
            "invalid_rows": [],
            "errors": [],
        }

    # Clean headers (strip whitespace and lower-case)
    cleaned_fieldnames = [f.strip().lower() for f in reader.fieldnames if f]
    missing_headers = [col for col in EXPECTED_COLUMNS if col not in cleaned_fieldnames]
    if missing_headers:
        return {
            "success": False,
            "error": f"Missing required columns in CSV header: {', '.join(missing_headers)}",
            "total_rows": 0,
            "valid_rows": [],
            "invalid_rows": [],
            "errors": [],
        }

    # Cache programs for this institution
    programs = db.query(Program).filter(
        Program.institution_id == institution_id,
        Program.status == "active",
    ).all()
    program_map = {p.program_code.strip().upper(): p for p in programs}

    valid_rows: List[Dict[str, Any]] = []
    invalid_rows: List[Dict[str, Any]] = []
    all_errors: List[Dict[str, Any]] = []

    seen_inst_ids: Set[str] = set()
    seen_identity_refs: Set[str] = set()

    row_index = 0
    # Reset stream to re-read with fieldname mapping
    stream.seek(0)
    dict_reader = csv.DictReader(stream)

    for raw_row in dict_reader:
        row_index += 1
        # Normalize keys
        row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
        row_errors = []

        inst_student_id = row.get("institution_student_id", "")
        student_name = row.get("student_name", "")
        prog_code = row.get("program_code", "").upper()
        identity_ref = row.get("identity_reference", "")
        adm_cat = row.get("admission_category", "").lower()
        adm_status = row.get("admission_status", "admitted").lower()
        nri_cat = row.get("nri_category", "not_applicable").lower()
        oci_stat = row.get("oci_status", "not_applicable").lower()
        fn_stat = row.get("foreign_national_status", "not_applicable").lower()
        sup_cat = row.get("supernumerary_category", "none").lower()
        dob_str = row.get("date_of_birth", "")
        gender = row.get("gender", "")

        # Required fields
        if not inst_student_id:
            row_errors.append({"row": row_index, "rule_code": "REQUIRED_FIELD_MISSING", "field": "institution_student_id", "message": "Missing institution_student_id"})
        if not student_name:
            row_errors.append({"row": row_index, "rule_code": "REQUIRED_FIELD_MISSING", "field": "student_name", "message": "Missing student_name"})
        if not prog_code:
            row_errors.append({"row": row_index, "rule_code": "REQUIRED_FIELD_MISSING", "field": "program_code", "message": "Missing program_code"})
        elif prog_code not in program_map:
            row_errors.append({"row": row_index, "rule_code": "INVALID_PROGRAM", "field": "program_code", "message": f"Program code '{prog_code}' does not exist for this institution"})

        if not adm_cat:
            row_errors.append({"row": row_index, "rule_code": "REQUIRED_FIELD_MISSING", "field": "admission_category", "message": "Missing admission_category"})
        elif adm_cat not in VALID_CATEGORIES:
            row_errors.append({"row": row_index, "rule_code": "INVALID_VALUE", "field": "admission_category", "message": f"Invalid admission category '{adm_cat}'"})

        if adm_status and adm_status not in VALID_STATUSES:
            row_errors.append({"row": row_index, "rule_code": "INVALID_VALUE", "field": "admission_status", "message": f"Invalid admission status '{adm_status}'"})

        if nri_cat and nri_cat not in VALID_YES_NO:
            row_errors.append({"row": row_index, "rule_code": "INVALID_VALUE", "field": "nri_category", "message": f"Invalid nri_category '{nri_cat}'"})

        if oci_stat and oci_stat not in VALID_YES_NO:
            row_errors.append({"row": row_index, "rule_code": "INVALID_VALUE", "field": "oci_status", "message": f"Invalid oci_status '{oci_stat}'"})

        if fn_stat and fn_stat not in VALID_YES_NO:
            row_errors.append({"row": row_index, "rule_code": "INVALID_VALUE", "field": "foreign_national_status", "message": f"Invalid foreign_national_status '{fn_stat}'"})

        if sup_cat and sup_cat not in VALID_SUPERNUMERARY:
            row_errors.append({"row": row_index, "rule_code": "INVALID_VALUE", "field": "supernumerary_category", "message": f"Invalid supernumerary_category '{sup_cat}'"})

        # Intra-batch duplicate checks
        if inst_student_id:
            if inst_student_id in seen_inst_ids:
                row_errors.append({"row": row_index, "rule_code": "DUPLICATE_IN_BATCH", "field": "institution_student_id", "message": f"Duplicate institution_student_id '{inst_student_id}' found within this upload file"})
            else:
                seen_inst_ids.add(inst_student_id)

        if identity_ref:
            if identity_ref in seen_identity_refs:
                row_errors.append({"row": row_index, "rule_code": "DUPLICATE_IN_BATCH", "field": "identity_reference", "message": f"Duplicate identity_reference '{identity_ref}' found within this upload file"})
            else:
                seen_identity_refs.add(identity_ref)

            # Check format
            if not DEMO_IDENTIFIER_PATTERN.match(identity_ref):
                row_errors.append({"row": row_index, "rule_code": "APAAR_FORMAT_INVALID", "field": "identity_reference", "message": f"Identity reference format is invalid (expected DEMO-[A-Z0-9] or 12 digits)"})

        # Parse date of birth
        parsed_dob = None
        if dob_str:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    parsed_dob = datetime.strptime(dob_str, fmt).date()
                    break
                except ValueError:
                    continue
            if not parsed_dob:
                row_errors.append({"row": row_index, "rule_code": "INVALID_DATE_FORMAT", "field": "date_of_birth", "message": f"Invalid date_of_birth '{dob_str}', expected YYYY-MM-DD"})

        program_obj = program_map.get(prog_code)

        cleaned_data = {
            "row_number": row_index,
            "institution_id": institution_id,
            "program_id": program_obj.id if program_obj else None,
            "admission_cycle": admission_cycle,
            "institution_student_id": inst_student_id,
            "student_name": student_name,
            "date_of_birth": parsed_dob,
            "gender": gender or None,
            "identity_reference": identity_ref or None,
            "admission_category": adm_cat,
            "admission_status": adm_status or "admitted",
            "nri_category": nri_cat or "not_applicable",
            "oci_status": oci_stat or "not_applicable",
            "foreign_national_status": fn_stat or "not_applicable",
            "supernumerary_category": sup_cat or "none",
        }

        if row_errors:
            cleaned_data["errors"] = row_errors
            invalid_rows.append(cleaned_data)
            all_errors.extend(row_errors)
        else:
            valid_rows.append(cleaned_data)

    return {
        "success": True,
        "total_rows": row_index,
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows,
        "errors": all_errors,
    }
