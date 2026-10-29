"""
Expanded Seeding Script for APAAR Verify.
Seeds 54+ AICTE Recognised Colleges across India, each with all 12 core engineering branches,
realistic intake limits, synthetic student records across categories, and comprehensive
Institute Portfolio metadata (NBA, NAAC, Complaints, New Intake Approvals, Category Seat Quotas).
"""
import uuid
import random
import json
import re
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
import app.models  # Register all models
from app.models.institution import Institution, Program, IntakeLimit, InstitutionPortfolio
from app.models.student import StudentRecord, StudentIdentity
from app.models.validation import ValidationIssue

# The 12 standard engineering branches offered across all AICTE recognised colleges
CORE_BRANCHES_SPEC = [
    ("CS", "B.Tech Computer Science & Engineering", "Computer Science", 180, 175),
    ("IT", "B.Tech Information Technology", "Information Technology", 120, 116),
    ("AI", "B.Tech Artificial Intelligence & Machine Learning", "Artificial Intelligence", 120, 118),
    ("DS", "B.Tech Data Science & Engineering", "Data Science", 60, 58),
    ("EC", "B.Tech Electronics & Communication Engineering", "Electronics", 180, 172),
    ("EE", "B.Tech Electrical & Electronics Engineering", "Electrical", 120, 114),
    ("ME", "B.Tech Mechanical Engineering", "Mechanical", 120, 110),
    ("CE", "B.Tech Civil Engineering", "Civil", 90, 82),
    ("CH", "B.Tech Chemical Engineering", "Chemical", 60, 55),
    ("AE", "B.Tech Aerospace & Aeronautical Engineering", "Aeronautical", 60, 57),
    ("RA", "B.Tech Robotics & Automation", "Robotics", 60, 56),
    ("BT", "B.Tech Biotechnology & Biochemical Engineering", "Biotechnology", 60, 54),
]

RAW_COLLEGES = [
    # 1. Demo Colleges (with test breach scenarios for compliance demonstration)
    {
        "code": "IIT-DEMO",
        "name": "Indian Institute of Technology (Demo)",
        "type": "CENTRAL_INSTITUTE",
        "state": "Delhi",
        "city": "New Delhi",
        "naac_grade": "A++", "naac_cgpa": "3.88", "naac_cycle": "Cycle 4", "naac_valid": "2029-05-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 12 Branches Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITD/2024/01",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Zero pending grievances; anti-ragging cell certified 100% compliant.",
        "eoa_ref": "AICTE/EOA/2026-27/IITD-001",
        "new_applied": 60, "new_branch": "B.Tech Quantum Computing & Systems", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Central Scrutiny Committee for 60 supernumerary seats.",
        "breaches": {"CS": (10, 12)}  # Deliberate breach demo
    },
    {
        "code": "NIT-DEMO",
        "name": "National Institute of Technology (Demo)",
        "type": "CENTRAL_INSTITUTE",
        "state": "Karnataka",
        "city": "Surathkal",
        "naac_grade": "A++", "naac_cgpa": "3.76", "naac_cycle": "Cycle 3", "naac_valid": "2028-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITK/2024/02",
        "complaints_total": 6, "complaints_resolved": 5, "complaints_pending": 1,
        "complaints_summary": "1 scholarship disbursement query pending with state social welfare board.",
        "eoa_ref": "AICTE/EOA/2026-27/NITK-002",
        "new_applied": 60, "new_branch": "B.Tech Computational & Data Science", "new_status": "Approved",
        "new_remarks": "Sanctioned under National Education Policy multidisciplinary expansion.",
        "breaches": {}
    },
    {
        "code": "DSCE-BLR",
        "name": "Dayananda Sagar College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A+", "naac_cgpa": "3.52", "naac_cycle": "Cycle 2", "naac_valid": "2027-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited including Cyber Security", "nba_valid": "2027-06-30", "nba_ref": "NBA/DSCE/2023/11",
        "complaints_total": 4, "complaints_resolved": 3, "complaints_pending": 1,
        "complaints_summary": "1 student fee adjustment query pending with internal committee.",
        "eoa_ref": "AICTE/EOA/2026-27/DSCE-847",
        "new_applied": 60, "new_branch": "B.E. Robotics & Artificial Intelligence", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Expert Committee with zero deficiency report.",
        "breaches": {"AI": (120, 122)},  # Deliberate breach demo
        "extra_branches": [
            ("CY", "B.E. Computer Science & Engineering (Cyber Security)", "Cyber Security", 60, 58)
        ]
    },
    {
        "code": "DEC-DEMO",
        "name": "Demo Engineering College",
        "type": "PRIVATE_COLLEGE",
        "state": "Maharashtra",
        "city": "Pune",
        "naac_grade": "A", "naac_cgpa": "3.35", "naac_cycle": "Cycle 2", "naac_valid": "2027-09-30",
        "nba_tier": "Tier-2", "nba_status": "Accredited", "nba_branches": "CSE, IT, E&TC, Mech, Civil (Accredited)", "nba_valid": "2026-06-30", "nba_ref": "NBA/DEC/2022/44",
        "complaints_total": 5, "complaints_resolved": 4, "complaints_pending": 1,
        "complaints_summary": "1 campus placement transparency query under AICTE ombudsman examination.",
        "eoa_ref": "AICTE/EOA/2026-27/DEC-339",
        "new_applied": 60, "new_branch": "B.Tech Cloud Computing & DevOps", "new_status": "Under Review",
        "new_remarks": "Pending physical site inspection by AICTE Western Regional Office.",
        "breaches": {}
    },
    # 2. Premier Central Institutions (IITs, NITs, BITS, IIITs)
    {
        "code": "IITB-MUM",
        "name": "Indian Institute of Technology Bombay",
        "type": "CENTRAL_INSTITUTE",
        "state": "Maharashtra",
        "city": "Mumbai",
        "naac_grade": "A++", "naac_cgpa": "3.91", "naac_cycle": "Cycle 4", "naac_valid": "2029-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2029-06-30", "nba_ref": "NBA/IITB/2024/001",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Institute of Eminence status; 100% regulatory compliance record.",
        "eoa_ref": "AICTE/EOA/2026-27/IITB-001",
        "new_applied": 60, "new_branch": "B.Tech Clean Energy & Environmental Engineering", "new_status": "Approved",
        "new_remarks": "Approved with special green technology grant under PM GatiShakti.",
        "breaches": {}
    },
    {
        "code": "IITD-DEL",
        "name": "Indian Institute of Technology Delhi",
        "type": "CENTRAL_INSTITUTE",
        "state": "Delhi",
        "city": "New Delhi",
        "naac_grade": "A++", "naac_cgpa": "3.92", "naac_cycle": "Cycle 4", "naac_valid": "2029-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Engineering Programs Accredited", "nba_valid": "2029-06-30", "nba_ref": "NBA/IITD/2024/002",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "National Institute of Eminence; zero audit exceptions.",
        "eoa_ref": "AICTE/EOA/2026-27/IITD-002",
        "new_applied": 60, "new_branch": "B.Tech Cyber-Physical Systems & IoT", "new_status": "Approved",
        "new_remarks": "Sanctioned under National Quantum Mission initiative.",
        "breaches": {}
    },
    {
        "code": "IITM-CHE",
        "name": "Indian Institute of Technology Madras",
        "type": "CENTRAL_INSTITUTE",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "naac_grade": "A++", "naac_cgpa": "3.95", "naac_cycle": "Cycle 4", "naac_valid": "2030-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 12 Disciplines Tier-1 Accredited", "nba_valid": "2029-06-30", "nba_ref": "NBA/IITM/2024/005",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "NIRF Rank 1 overall; fully compliant academic audit.",
        "eoa_ref": "AICTE/EOA/2026-27/IITM-003",
        "new_applied": 60, "new_branch": "B.Tech Quantum Science & Technology", "new_status": "Approved",
        "new_remarks": "Flagship multidisciplinary intake approved under NEP framework.",
        "breaches": {}
    },
    {
        "code": "IITK-KAN",
        "name": "Indian Institute of Technology Kanpur",
        "type": "CENTRAL_INSTITUTE",
        "state": "Uttar Pradesh",
        "city": "Kanpur",
        "naac_grade": "A++", "naac_cgpa": "3.89", "naac_cycle": "Cycle 3", "naac_valid": "2028-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Departments Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITK/2024/012",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Pioneering cybersecurity and aerospace research center.",
        "eoa_ref": "AICTE/EOA/2026-27/IITK-004",
        "new_applied": 60, "new_branch": "B.Tech Space Engineering & Planetary Systems", "new_status": "Approved",
        "new_remarks": "Approved with ISRO partnership grant.",
        "breaches": {}
    },
    {
        "code": "IITK-KGP",
        "name": "Indian Institute of Technology Kharagpur",
        "type": "CENTRAL_INSTITUTE",
        "state": "West Bengal",
        "city": "Kharagpur",
        "naac_grade": "A++", "naac_cgpa": "3.86", "naac_cycle": "Cycle 3", "naac_valid": "2028-09-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITKGP/2023/04",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "First IIT established in India; rigorous grievance redressing.",
        "eoa_ref": "AICTE/EOA/2026-27/IITKGP-005",
        "new_applied": 60, "new_branch": "B.Tech Precision Agriculture & Automation", "new_status": "Approved",
        "new_remarks": "Approved under AICTE Emerging Areas initiative.",
        "breaches": {}
    },
    {
        "code": "IITR-ROO",
        "name": "Indian Institute of Technology Roorkee",
        "type": "CENTRAL_INSTITUTE",
        "state": "Uttarakhand",
        "city": "Roorkee",
        "naac_grade": "A++", "naac_cgpa": "3.82", "naac_cycle": "Cycle 3", "naac_valid": "2028-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "Civil, Hydro, Electrical, Mech, CSE Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/IITR/2023/18",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Asia's oldest technical institute (1847); zero audit flags.",
        "eoa_ref": "AICTE/EOA/2026-27/IITR-006",
        "new_applied": 60, "new_branch": "B.Tech Disaster Resilience & Infrastructure", "new_status": "Approved",
        "new_remarks": "Approved for Himalayan geotechnical corridor research.",
        "breaches": {}
    },
    {
        "code": "IITG-GUW",
        "name": "Indian Institute of Technology Guwahati",
        "type": "CENTRAL_INSTITUTE",
        "state": "Assam",
        "city": "Guwahati",
        "naac_grade": "A++", "naac_cgpa": "3.80", "naac_cycle": "Cycle 3", "naac_valid": "2028-10-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITG/2024/007",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Northeast regional center of excellence; zero pending issues.",
        "eoa_ref": "AICTE/EOA/2026-27/IITG-007",
        "new_applied": 60, "new_branch": "B.Tech Biomedical Engineering & Nanotechnology", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Council with high acclaim.",
        "breaches": {}
    },
    {
        "code": "IITH-HYD",
        "name": "Indian Institute of Technology Hyderabad",
        "type": "CENTRAL_INSTITUTE",
        "state": "Telangana",
        "city": "Hyderabad",
        "naac_grade": "A++", "naac_cgpa": "3.84", "naac_cycle": "Cycle 3", "naac_valid": "2029-01-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 12 Disciplines Tier-1 Accredited", "nba_valid": "2029-06-30", "nba_ref": "NBA/IITH/2024/008",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Top 10 national ranking with state-of-the-art semiconductor cleanrooms.",
        "eoa_ref": "AICTE/EOA/2026-27/IITH-008",
        "new_applied": 60, "new_branch": "B.Tech Semiconductor & VLSI Design", "new_status": "Approved",
        "new_remarks": "Approved under India Semiconductor Mission (ISM) mandate.",
        "breaches": {}
    },
    {
        "code": "IITBHU-VAR",
        "name": "Indian Institute of Technology (BHU) Varanasi",
        "type": "CENTRAL_INSTITUTE",
        "state": "Uttar Pradesh",
        "city": "Varanasi",
        "naac_grade": "A++", "naac_cgpa": "3.78", "naac_cycle": "Cycle 3", "naac_valid": "2028-05-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 12 Disciplines Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITBHU/2024/009",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Historic heritage technical campus with stellar alumni network.",
        "eoa_ref": "AICTE/EOA/2026-27/IITBHU-009",
        "new_applied": 60, "new_branch": "B.Tech Ceramic & Materials Innovation", "new_status": "Approved",
        "new_remarks": "Approved with central research endowment.",
        "breaches": {}
    },
    {
        "code": "IIT-ISM",
        "name": "Indian Institute of Technology (ISM) Dhanbad",
        "type": "CENTRAL_INSTITUTE",
        "state": "Jharkhand",
        "city": "Dhanbad",
        "naac_grade": "A++", "naac_cgpa": "3.75", "naac_cycle": "Cycle 3", "naac_valid": "2028-04-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/ISM/2024/010",
        "complaints_total": 3, "complaints_resolved": 2, "complaints_pending": 1,
        "complaints_summary": "1 hostel maintenance grievance resolving this quarter.",
        "eoa_ref": "AICTE/EOA/2026-27/ISM-010",
        "new_applied": 60, "new_branch": "B.Tech Geothermal & Sustainable Resources", "new_status": "Approved",
        "new_remarks": "Sanctioned under Ministry of Mines & Energy.",
        "breaches": {}
    },
    {
        "code": "NITT-TRI",
        "name": "National Institute of Technology Tiruchirappalli",
        "type": "CENTRAL_INSTITUTE",
        "state": "Tamil Nadu",
        "city": "Tiruchirappalli",
        "naac_grade": "A++", "naac_cgpa": "3.84", "naac_cycle": "Cycle 3", "naac_valid": "2029-01-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITT/2023/009",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "NIRF Rank 1 among all NITs in India; exceptional audit health.",
        "eoa_ref": "AICTE/EOA/2026-27/NITT-011",
        "new_applied": 60, "new_branch": "B.Tech Cyber Security & Forensics", "new_status": "Approved",
        "new_remarks": "Approved with full infrastructure readiness score.",
        "breaches": {}
    },
    {
        "code": "NITK-SUR",
        "name": "National Institute of Technology Karnataka Surathkal",
        "type": "CENTRAL_INSTITUTE",
        "state": "Karnataka",
        "city": "Surathkal",
        "naac_grade": "A++", "naac_cgpa": "3.81", "naac_cycle": "Cycle 3", "naac_valid": "2028-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITK/2024/012",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Premier coastal technical campus with beachside testing facilities.",
        "eoa_ref": "AICTE/EOA/2026-27/NITK-012",
        "new_applied": 60, "new_branch": "B.Tech Marine & Coastal Engineering", "new_status": "Approved",
        "new_remarks": "Approved under Blue Economy innovation grant.",
        "breaches": {}
    },
    {
        "code": "NITW-WAR",
        "name": "National Institute of Technology Warangal",
        "type": "CENTRAL_INSTITUTE",
        "state": "Telangana",
        "city": "Warangal",
        "naac_grade": "A++", "naac_cgpa": "3.79", "naac_cycle": "Cycle 3", "naac_valid": "2028-08-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 12 Disciplines Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITW/2024/013",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Historic Regional Engineering College (REC); zero non-compliances.",
        "eoa_ref": "AICTE/EOA/2026-27/NITW-013",
        "new_applied": 60, "new_branch": "B.Tech Intelligent Systems & Mechatronics", "new_status": "Approved",
        "new_remarks": "Sanctioned by AICTE National Executive Council.",
        "breaches": {}
    },
    {
        "code": "NITC-CAL",
        "name": "National Institute of Technology Calicut",
        "type": "CENTRAL_INSTITUTE",
        "state": "Kerala",
        "city": "Kozhikode",
        "naac_grade": "A++", "naac_cgpa": "3.77", "naac_cycle": "Cycle 3", "naac_valid": "2028-07-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, ECE, EEE, Mech, Civil, Biotech Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITC/2023/11",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Consistently top 3 NIT in South India; 100% grievance compliance.",
        "eoa_ref": "AICTE/EOA/2026-27/NITC-014",
        "new_applied": 60, "new_branch": "B.Tech Materials & Nanotechnology", "new_status": "Approved",
        "new_remarks": "Approved with zero deficiency remarks.",
        "breaches": {}
    },
    {
        "code": "VNIT-NAG",
        "name": "Visvesvaraya National Institute of Technology",
        "type": "CENTRAL_INSTITUTE",
        "state": "Maharashtra",
        "city": "Nagpur",
        "naac_grade": "A++", "naac_cgpa": "3.75", "naac_cycle": "Cycle 3", "naac_valid": "2028-04-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/VNIT/2023/19",
        "complaints_total": 5, "complaints_resolved": 4, "complaints_pending": 1,
        "complaints_summary": "1 campus hostel mess fee adjustment query pending with student council.",
        "eoa_ref": "AICTE/EOA/2026-27/VNIT-015",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Robotics", "new_status": "Approved",
        "new_remarks": "Approved by Western Regional Committee.",
        "breaches": {}
    },
    {
        "code": "NITR-ROU",
        "name": "National Institute of Technology Rourkela",
        "type": "CENTRAL_INSTITUTE",
        "state": "Odisha",
        "city": "Rourkela",
        "naac_grade": "A++", "naac_cgpa": "3.80", "naac_cycle": "Cycle 3", "naac_valid": "2028-09-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITR/2024/016",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "High-research output campus with robust anti-ragging measures.",
        "eoa_ref": "AICTE/EOA/2026-27/NITR-016",
        "new_applied": 60, "new_branch": "B.Tech Industrial IoT & Automation", "new_status": "Approved",
        "new_remarks": "Approved with regional metallurgical grant.",
        "breaches": {}
    },
    {
        "code": "MNIT-JAI",
        "name": "Malaviya National Institute of Technology Jaipur",
        "type": "CENTRAL_INSTITUTE",
        "state": "Rajasthan",
        "city": "Jaipur",
        "naac_grade": "A++", "naac_cgpa": "3.76", "naac_cycle": "Cycle 3", "naac_valid": "2028-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/MNIT/2024/017",
        "complaints_total": 4, "complaints_resolved": 3, "complaints_pending": 1,
        "complaints_summary": "1 hostel water infrastructure upgrade grievance in progress.",
        "eoa_ref": "AICTE/EOA/2026-27/MNIT-017",
        "new_applied": 60, "new_branch": "B.Tech Renewable Energy & Solar Tech", "new_status": "Approved",
        "new_remarks": "Approved under National Solar Mission initiative.",
        "breaches": {}
    },
    {
        "code": "MNNIT-ALL",
        "name": "Motilal Nehru National Institute of Technology Allahabad",
        "type": "CENTRAL_INSTITUTE",
        "state": "Uttar Pradesh",
        "city": "Prayagraj",
        "naac_grade": "A++", "naac_cgpa": "3.78", "naac_cycle": "Cycle 3", "naac_valid": "2028-07-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/MNNIT/2024/018",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "First institution in India to offer an undergraduate degree in Computer Science (1977).",
        "eoa_ref": "AICTE/EOA/2026-27/MNNIT-018",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Data Science", "new_status": "Approved",
        "new_remarks": "Approved by Northern Regional Committee.",
        "breaches": {}
    },
    {
        "code": "MANIT-BHO",
        "name": "Maulana Azad National Institute of Technology Bhopal",
        "type": "CENTRAL_INSTITUTE",
        "state": "Madhya Pradesh",
        "city": "Bhopal",
        "naac_grade": "A++", "naac_cgpa": "3.72", "naac_cycle": "Cycle 3", "naac_valid": "2028-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/MANIT/2024/019",
        "complaints_total": 5, "complaints_resolved": 4, "complaints_pending": 1,
        "complaints_summary": "1 central sports facility renovation appeal being processed.",
        "eoa_ref": "AICTE/EOA/2026-27/MANIT-019",
        "new_applied": 60, "new_branch": "B.Tech Cyber-Physical Systems", "new_status": "Approved",
        "new_remarks": "Approved with central sanction.",
        "breaches": {}
    },
    {
        "code": "NITK-KUR",
        "name": "National Institute of Technology Kurukshetra",
        "type": "CENTRAL_INSTITUTE",
        "state": "Haryana",
        "city": "Kurukshetra",
        "naac_grade": "A++", "naac_cgpa": "3.74", "naac_cycle": "Cycle 3", "naac_valid": "2028-05-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITKKR/2024/020",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Excellent placement record; comprehensive student support.",
        "eoa_ref": "AICTE/EOA/2026-27/NITKKR-020",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Machine Learning", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Council.",
        "breaches": {}
    },
    {
        "code": "SVNIT-SUR",
        "name": "Sardar Vallabhbhai National Institute of Technology Surat",
        "type": "CENTRAL_INSTITUTE",
        "state": "Gujarat",
        "city": "Surat",
        "naac_grade": "A++", "naac_cgpa": "3.75", "naac_cycle": "Cycle 3", "naac_valid": "2028-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/SVNIT/2024/021",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Top technical hub of western India with strong chemical and civil focus.",
        "eoa_ref": "AICTE/EOA/2026-27/SVNIT-021",
        "new_applied": 60, "new_branch": "B.Tech Smart City Engineering & Urban Tech", "new_status": "Approved",
        "new_remarks": "Approved under Western Regional Office oversight.",
        "breaches": {}
    },
    {
        "code": "BITS-PIL",
        "name": "Birla Institute of Technology & Science",
        "type": "CENTRAL_INSTITUTE",
        "state": "Rajasthan",
        "city": "Pilani",
        "naac_grade": "A++", "naac_cgpa": "3.85", "naac_cycle": "Cycle 3", "naac_valid": "2029-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/BITS/2023/001",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Institute of Eminence; transparent merit-based admissions.",
        "eoa_ref": "AICTE/EOA/2026-27/BITS-022",
        "new_applied": 60, "new_branch": "B.E. Semiconductor Technologies", "new_status": "Approved",
        "new_remarks": "Approved under AICTE National Talent Initiative.",
        "breaches": {}
    },
    {
        "code": "BITS-GOA",
        "name": "BITS Pilani K. K. Birla Goa Campus",
        "type": "CENTRAL_INSTITUTE",
        "state": "Goa",
        "city": "Zuarinagar",
        "naac_grade": "A++", "naac_cgpa": "3.85", "naac_cycle": "Cycle 3", "naac_valid": "2029-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/BITSGOA/2024/023",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Top tier private deemed institute with international research output.",
        "eoa_ref": "AICTE/EOA/2026-27/BITSGOA-023",
        "new_applied": 60, "new_branch": "B.E. Computing Systems & Edge AI", "new_status": "Approved",
        "new_remarks": "Approved with zero remarks.",
        "breaches": {}
    },
    {
        "code": "BITS-HYD",
        "name": "BITS Pilani Hyderabad Campus",
        "type": "CENTRAL_INSTITUTE",
        "state": "Telangana",
        "city": "Hyderabad",
        "naac_grade": "A++", "naac_cgpa": "3.85", "naac_cycle": "Cycle 3", "naac_valid": "2029-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/BITSHYD/2024/024",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Advanced biotechnology, pharmacy and computing research center.",
        "eoa_ref": "AICTE/EOA/2026-27/BITSHYD-024",
        "new_applied": 60, "new_branch": "B.E. Pharmaceutical Engineering & Data Analytics", "new_status": "Approved",
        "new_remarks": "Approved under biotechnology corridor framework.",
        "breaches": {}
    },
    {
        "code": "IIITH-HYD",
        "name": "International Institute of Information Technology Hyderabad",
        "type": "CENTRAL_INSTITUTE",
        "state": "Telangana",
        "city": "Hyderabad",
        "naac_grade": "A++", "naac_cgpa": "3.81", "naac_cycle": "Cycle 3", "naac_valid": "2028-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IIITH/2023/007",
        "complaints_total": 1, "complaints_resolved": 1, "complaints_pending": 0,
        "complaints_summary": "Leading premier computer science institution; zero pending grievances.",
        "eoa_ref": "AICTE/EOA/2026-27/IIITH-025",
        "new_applied": 60, "new_branch": "B.Tech Computer Science & Artificial Intelligence", "new_status": "Approved",
        "new_remarks": "Elite research track program sanctioned by AICTE Council.",
        "breaches": {}
    },
    {
        "code": "IIITB-BLR",
        "name": "International Institute of Information Technology Bangalore",
        "type": "CENTRAL_INSTITUTE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A++", "naac_cgpa": "3.78", "naac_cycle": "Cycle 3", "naac_valid": "2028-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IIITB/2023/008",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Silicon valley think tank; 100% compliant admissions and intake controls.",
        "eoa_ref": "AICTE/EOA/2026-27/IIITB-026",
        "new_applied": 60, "new_branch": "B.Tech AI & Data Engineering", "new_status": "Approved",
        "new_remarks": "Approved with industry advisory panel endorsement.",
        "breaches": {}
    },
    {
        "code": "IIITD-DEL",
        "name": "Indraprastha Institute of Information Technology Delhi",
        "type": "STATE_UNIVERSITY",
        "state": "Delhi",
        "city": "New Delhi",
        "naac_grade": "A++", "naac_cgpa": "3.80", "naac_cycle": "Cycle 3", "naac_valid": "2028-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IIITD/2024/027",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Top state technical university in the capital; premier research hub.",
        "eoa_ref": "AICTE/EOA/2026-27/IIITD-027",
        "new_applied": 60, "new_branch": "B.Tech Computer Science & Biosciences", "new_status": "Approved",
        "new_remarks": "Approved with zero audit objections.",
        "breaches": {}
    },
    {
        "code": "IIITA-ALL",
        "name": "Indian Institute of Information Technology Allahabad",
        "type": "CENTRAL_INSTITUTE",
        "state": "Uttar Pradesh",
        "city": "Prayagraj",
        "naac_grade": "A++", "naac_cgpa": "3.77", "naac_cycle": "Cycle 3", "naac_valid": "2028-09-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IIITA/2024/028",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Central Institute of National Importance with world-class coding culture.",
        "eoa_ref": "AICTE/EOA/2026-27/IIITA-028",
        "new_applied": 60, "new_branch": "B.Tech Software Engineering & DevOps", "new_status": "Approved",
        "new_remarks": "Approved by Northern Regional Committee.",
        "breaches": {}
    },
    # 3. Premier State Technological Universities & Top Govt Engineering Colleges
    {
        "code": "DTU-DEL",
        "name": "Delhi Technological University",
        "type": "STATE_UNIVERSITY",
        "state": "Delhi",
        "city": "Delhi",
        "naac_grade": "A+", "naac_cgpa": "3.62", "naac_cycle": "Cycle 3", "naac_valid": "2028-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/DTU/2023/041",
        "complaints_total": 6, "complaints_resolved": 5, "complaints_pending": 1,
        "complaints_summary": "1 scholarship query under state verification; zero anti-ragging issues.",
        "eoa_ref": "AICTE/EOA/2026-27/DTU-029",
        "new_applied": 60, "new_branch": "B.Tech Computer Science (Cyber Security)", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Northern Regional Office.",
        "breaches": {}
    },
    {
        "code": "NSUT-DEL",
        "name": "Netaji Subhas University of Technology",
        "type": "STATE_UNIVERSITY",
        "state": "Delhi",
        "city": "Delhi",
        "naac_grade": "A+", "naac_cgpa": "3.58", "naac_cycle": "Cycle 2", "naac_valid": "2027-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/NSUT/2023/018",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Zero pending grievances; all statutory committees active.",
        "eoa_ref": "AICTE/EOA/2026-27/NSUT-030",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Machine Learning", "new_status": "Approved",
        "new_remarks": "Approved under expanding AI education framework.",
        "breaches": {}
    },
    {
        "code": "COEP-PUN",
        "name": "COEP Technological University",
        "type": "STATE_UNIVERSITY",
        "state": "Maharashtra",
        "city": "Pune",
        "naac_grade": "A++", "naac_cgpa": "3.83", "naac_cycle": "Cycle 3", "naac_valid": "2028-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/COEP/2024/002",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Established 1854; exemplary academic integrity with zero compliance defects.",
        "eoa_ref": "AICTE/EOA/2026-27/COEP-031",
        "new_applied": 60, "new_branch": "B.Tech Robotics & Autonomous Systems", "new_status": "Approved",
        "new_remarks": "Sanctioned under Western Regional technical modernizing plan.",
        "breaches": {}
    },
    {
        "code": "VJTI-MUM",
        "name": "Veermata Jijabai Technological Institute",
        "type": "STATE_UNIVERSITY",
        "state": "Maharashtra",
        "city": "Mumbai",
        "naac_grade": "A+", "naac_cgpa": "3.67", "naac_cycle": "Cycle 2", "naac_valid": "2027-10-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/VJTI/2023/014",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Heritage Mumbai engineering institute; full compliance with AICTE norms.",
        "eoa_ref": "AICTE/EOA/2026-27/VJTI-032",
        "new_applied": 60, "new_branch": "B.Tech Data Science & Analytics", "new_status": "Approved",
        "new_remarks": "Approved with state government quota seat allocation matrix.",
        "breaches": {}
    },
    {
        "code": "SPIT-MUM",
        "name": "Sardar Patel Institute of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Maharashtra",
        "city": "Mumbai",
        "naac_grade": "A+", "naac_cgpa": "3.64", "naac_cycle": "Cycle 2", "naac_valid": "2027-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/SPIT/2024/033",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Top-tier autonomous engineering college in Andheri Mumbai.",
        "eoa_ref": "AICTE/EOA/2026-27/SPIT-033",
        "new_applied": 60, "new_branch": "B.Tech Cyber Security & Systems", "new_status": "Approved",
        "new_remarks": "Approved with high faculty to student ratio accreditation.",
        "breaches": {}
    },
    {
        "code": "WALCH-SAN",
        "name": "Walchand College of Engineering",
        "type": "STATE_UNIVERSITY",
        "state": "Maharashtra",
        "city": "Sangli",
        "naac_grade": "A", "naac_cgpa": "3.42", "naac_cycle": "Cycle 2", "naac_valid": "2027-05-31",
        "nba_tier": "Tier-2", "nba_status": "Accredited", "nba_branches": "CSE, IT, Electrical, Mechanical, Civil Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/WCE/2023/077",
        "complaints_total": 4, "complaints_resolved": 3, "complaints_pending": 1,
        "complaints_summary": "1 campus internet bandwidth upgrading request underway.",
        "eoa_ref": "AICTE/EOA/2026-27/WCE-034",
        "new_applied": 30, "new_branch": "B.Tech Computer Science (Cyber Security)", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Western Regional Council.",
        "breaches": {}
    },
    {
        "code": "ANNA-CEG",
        "name": "College of Engineering Guindy Anna University",
        "type": "STATE_UNIVERSITY",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "naac_grade": "A++", "naac_cgpa": "3.83", "naac_cycle": "Cycle 3", "naac_valid": "2028-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/CEG/2024/020",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Oldest technical college in India (est. 1794); zero regulatory deficiencies.",
        "eoa_ref": "AICTE/EOA/2026-27/CEG-035",
        "new_applied": 60, "new_branch": "B.E. Artificial Intelligence & Data Science", "new_status": "Approved",
        "new_remarks": "Approved with state government quota seat allocation matrix.",
        "breaches": {}
    },
    {
        "code": "JADAV-KOL",
        "name": "Jadavpur University Faculty of Engineering",
        "type": "STATE_UNIVERSITY",
        "state": "West Bengal",
        "city": "Kolkata",
        "naac_grade": "A++", "naac_cgpa": "3.81", "naac_cycle": "Cycle 3", "naac_valid": "2028-08-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/JU/2023/006",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Elite state technological university; renowned for research and placements.",
        "eoa_ref": "AICTE/EOA/2026-27/JU-036",
        "new_applied": 60, "new_branch": "B.Tech Information Technology & Cloud", "new_status": "Approved",
        "new_remarks": "Sanctioned under Eastern Regional AICTE council.",
        "breaches": {}
    },
    {
        "code": "CET-TRV",
        "name": "College of Engineering Trivandrum",
        "type": "STATE_UNIVERSITY",
        "state": "Kerala",
        "city": "Thiruvananthapuram",
        "naac_grade": "A++", "naac_cgpa": "3.73", "naac_cycle": "Cycle 2", "naac_valid": "2028-04-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/CET/2024/037",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Kerala's flagship government engineering institution established in 1939.",
        "eoa_ref": "AICTE/EOA/2026-27/CET-037",
        "new_applied": 60, "new_branch": "B.Tech Robotics & Artificial Intelligence", "new_status": "Approved",
        "new_remarks": "Approved with state technological university affiliation.",
        "breaches": {}
    },
    {
        "code": "HBTU-KAN",
        "name": "Harcourt Butler Technical University",
        "type": "STATE_UNIVERSITY",
        "state": "Uttar Pradesh",
        "city": "Kanpur",
        "naac_grade": "A+", "naac_cgpa": "3.65", "naac_cycle": "Cycle 2", "naac_valid": "2027-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "Chemical, Mech, Civil, CSE, IT Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/HBTU/2024/038",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Centenary technical university with premier chemical and oil engineering heritage.",
        "eoa_ref": "AICTE/EOA/2026-27/HBTU-038",
        "new_applied": 60, "new_branch": "B.Tech Food Technology & Biochemical Innovation", "new_status": "Approved",
        "new_remarks": "Approved under industrial upgrade program.",
        "breaches": {}
    },
    {
        "code": "JNTUH-HYD",
        "name": "JNTU College of Engineering Hyderabad",
        "type": "STATE_UNIVERSITY",
        "state": "Telangana",
        "city": "Hyderabad",
        "naac_grade": "A++", "naac_cgpa": "3.76", "naac_cycle": "Cycle 3", "naac_valid": "2028-05-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/JNTUH/2024/039",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Flagship university college of Telangana; zero compliance deficits.",
        "eoa_ref": "AICTE/EOA/2026-27/JNTUH-039",
        "new_applied": 60, "new_branch": "B.Tech Cyber Security & Threat Intelligence", "new_status": "Approved",
        "new_remarks": "Approved by South-Central Regional AICTE Committee.",
        "breaches": {}
    },
    {
        "code": "PEC-CHD",
        "name": "Punjab Engineering College",
        "type": "STATE_UNIVERSITY",
        "state": "Chandigarh",
        "city": "Chandigarh",
        "naac_grade": "A+", "naac_cgpa": "3.68", "naac_cycle": "Cycle 3", "naac_valid": "2028-02-28",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/PEC/2024/040",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "One of India's pioneer technical institutes with aerospace excellence.",
        "eoa_ref": "AICTE/EOA/2026-27/PEC-040",
        "new_applied": 60, "new_branch": "B.Tech Aerospace Systems & Avionics", "new_status": "Approved",
        "new_remarks": "Approved with zero audit objections.",
        "breaches": {}
    },
    # 4. Top Accredited Private & Autonomous Engineering Colleges Across India
    {
        "code": "RVCE-BLR",
        "name": "RV College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A+", "naac_cgpa": "3.68", "naac_cycle": "Cycle 2", "naac_valid": "2028-04-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 12 Disciplines Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/RVCE/2024/003",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Top ranked engineering college in Karnataka; 100% compliant intake telemetry.",
        "eoa_ref": "AICTE/EOA/2026-27/RVCE-041",
        "new_applied": 60, "new_branch": "B.E. Electric Vehicle & Autonomous Systems", "new_status": "Approved",
        "new_remarks": "Approved under AICTE mobility innovation corridor grant.",
        "breaches": {}
    },
    {
        "code": "BMSCE-BLR",
        "name": "BMS College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A++", "naac_cgpa": "3.83", "naac_cycle": "Cycle 3", "naac_valid": "2028-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/BMSCE/2024/005",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "First private engineering college in India (est. 1946); zero regulatory flags.",
        "eoa_ref": "AICTE/EOA/2026-27/BMSCE-042",
        "new_applied": 60, "new_branch": "B.E. Aerospace & Propulsion Engineering", "new_status": "Approved",
        "new_remarks": "Sanctioned with state-of-the-art wind tunnel certification.",
        "breaches": {}
    },
    {
        "code": "MSRIT-BLR",
        "name": "Ramaiah Institute of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A+", "naac_cgpa": "3.66", "naac_cycle": "Cycle 2", "naac_valid": "2027-08-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 12 Disciplines Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/MSRIT/2023/008",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Premier autonomous college in Bengaluru; robust internal student grievance portal.",
        "eoa_ref": "AICTE/EOA/2026-27/MSRIT-043",
        "new_applied": 60, "new_branch": "B.E. Biotechnology & Genetic Engineering", "new_status": "Approved",
        "new_remarks": "Approved with zero remarks from AICTE Southwest Committee.",
        "breaches": {}
    },
    {
        "code": "PES-BLR",
        "name": "PES University",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A+", "naac_cgpa": "3.61", "naac_cycle": "Cycle 2", "naac_valid": "2027-09-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/PES/2024/044",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Renowned private technological university; student satellite mission (PISAT) pioneer.",
        "eoa_ref": "AICTE/EOA/2026-27/PES-044",
        "new_applied": 60, "new_branch": "B.Tech Embedded Systems & Robotics", "new_status": "Approved",
        "new_remarks": "Approved by Southwest Regional Council.",
        "breaches": {}
    },
    {
        "code": "PSG-CBE",
        "name": "PSG College of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Coimbatore",
        "naac_grade": "A++", "naac_cgpa": "3.81", "naac_cycle": "Cycle 3", "naac_valid": "2028-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/PSG/2024/007",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Industry-backed technical college with in-house manufacturing enterprise.",
        "eoa_ref": "AICTE/EOA/2026-27/PSG-045",
        "new_applied": 60, "new_branch": "B.Tech Smart Manufacturing & Automation", "new_status": "Approved",
        "new_remarks": "Approved under Industry 4.0 center of excellence mandate.",
        "breaches": {}
    },
    {
        "code": "SSN-CHE",
        "name": "Sri Sivasubramaniya Nadar College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "naac_grade": "A++", "naac_cgpa": "3.75", "naac_cycle": "Cycle 3", "naac_valid": "2028-09-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/SSN/2023/024",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Shiv Nadar Foundation flagship institute; 100% compliant institutional governance.",
        "eoa_ref": "AICTE/EOA/2026-27/SSN-046",
        "new_applied": 60, "new_branch": "B.Tech Cyber Security & Trust Systems", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Southern Regional Committee.",
        "breaches": {}
    },
    {
        "code": "SASTRA-TN",
        "name": "SASTRA Deemed University",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Thanjavur",
        "naac_grade": "A++", "naac_cgpa": "3.79", "naac_cycle": "Cycle 3", "naac_valid": "2028-10-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/SASTRA/2024/047",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Premier research institution home to Srinivasa Ramanujan Centre.",
        "eoa_ref": "AICTE/EOA/2026-27/SASTRA-047",
        "new_applied": 60, "new_branch": "B.Tech Cognitive Systems & Brain Sciences", "new_status": "Approved",
        "new_remarks": "Approved with zero audit objections.",
        "breaches": {}
    },
    {
        "code": "TIET-PAT",
        "name": "Thapar Institute of Engineering and Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Punjab",
        "city": "Patiala",
        "naac_grade": "A++", "naac_cgpa": "3.80", "naac_cycle": "Cycle 3", "naac_valid": "2028-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/TIET/2024/001",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Premier private technical university in North India; top tier infrastructure.",
        "eoa_ref": "AICTE/EOA/2026-27/TIET-048",
        "new_applied": 60, "new_branch": "B.Tech Computer Science (Data Science)", "new_status": "Approved",
        "new_remarks": "Sanctioned under Northern Regional Council.",
        "breaches": {}
    },
    {
        "code": "MANIP-MAHE",
        "name": "Manipal Institute of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Manipal",
        "naac_grade": "A++", "naac_cgpa": "3.85", "naac_cycle": "Cycle 3", "naac_valid": "2029-02-28",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/MIT/2023/048",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Institute of Eminence MAHE; global technical training center.",
        "eoa_ref": "AICTE/EOA/2026-27/MIT-049",
        "new_applied": 60, "new_branch": "B.Tech Computational Intelligence", "new_status": "Approved",
        "new_remarks": "Approved with international academic exchange accreditation.",
        "breaches": {}
    },
    {
        "code": "BIT-MES",
        "name": "Birla Institute of Technology Mesra",
        "type": "PRIVATE_COLLEGE",
        "state": "Jharkhand",
        "city": "Ranchi",
        "naac_grade": "A+", "naac_cgpa": "3.62", "naac_cycle": "Cycle 3", "naac_valid": "2027-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/BITM/2024/050",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Established in 1955; first institute to launch department of space engineering.",
        "eoa_ref": "AICTE/EOA/2026-27/BITM-050",
        "new_applied": 60, "new_branch": "B.Tech Space Engineering & Rocketry", "new_status": "Approved",
        "new_remarks": "Approved with central space science grant.",
        "breaches": {}
    },
    {
        "code": "VIT-VEL",
        "name": "Vellore Institute of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Vellore",
        "naac_grade": "A++", "naac_cgpa": "3.88", "naac_cycle": "Cycle 4", "naac_valid": "2029-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/VIT/2024/051",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Institute of Eminence status; comprehensive ABET and NBA accreditations.",
        "eoa_ref": "AICTE/EOA/2026-27/VIT-051",
        "new_applied": 120, "new_branch": "B.Tech AI & Health Informatics", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Central Scrutiny Committee.",
        "breaches": {}
    },
    {
        "code": "SRM-CHE",
        "name": "SRM Institute of Science and Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "naac_grade": "A++", "naac_cgpa": "3.82", "naac_cycle": "Cycle 3", "naac_valid": "2028-10-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/SRM/2024/052",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Large scale engineering university with high placement indices.",
        "eoa_ref": "AICTE/EOA/2026-27/SRM-052",
        "new_applied": 120, "new_branch": "B.Tech Artificial Intelligence & Cognitive Computing", "new_status": "Approved",
        "new_remarks": "Approved with full infrastructure readiness score.",
        "breaches": {}
    },
    {
        "code": "MIT-PUN",
        "name": "MIT World Peace University",
        "type": "PRIVATE_COLLEGE",
        "state": "Maharashtra",
        "city": "Pune",
        "naac_grade": "A+", "naac_cgpa": "3.63", "naac_cycle": "Cycle 2", "naac_valid": "2027-10-31",
        "nba_tier": "Tier-2", "nba_status": "Accredited", "nba_branches": "CSE, Mechanical, Civil, ECE Tier-2 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/MITWPU/2024/053",
        "complaints_total": 4, "complaints_resolved": 3, "complaints_pending": 1,
        "complaints_summary": "1 scholarship reimbursement query pending with state directorate.",
        "eoa_ref": "AICTE/EOA/2026-27/MITWPU-053",
        "new_applied": 60, "new_branch": "B.Tech Sustainable Energy & Mobility", "new_status": "Approved",
        "new_remarks": "Approved by Western Regional Committee.",
        "breaches": {}
    },
    {
        "code": "KCT-CBE",
        "name": "Kumaraguru College of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Coimbatore",
        "naac_grade": "A++", "naac_cgpa": "3.72", "naac_cycle": "Cycle 3", "naac_valid": "2028-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/KCT/2024/054",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Premier autonomous engineering college with state-of-the-art innovation garage.",
        "eoa_ref": "AICTE/EOA/2026-27/KCT-054",
        "new_applied": 60, "new_branch": "B.Tech Mechatronics & Autonomous Mobility", "new_status": "Approved",
        "new_remarks": "Approved with high innovation ranking.",
        "breaches": {}
    }
]

# Transform RAW_COLLEGES to ensure ALL 12 engineering branches are present in EVERY single college
COLLEGES = []
for c in RAW_COLLEGES:
    col_code = c["code"]
    breaches = c.get("breaches", {})
    branches_list = []
    
    for b_suffix, b_name, b_discipline, default_cap, default_enr in CORE_BRANCHES_SPEC:
        p_code = f"{col_code}-{b_suffix}-2026"
        # Check if deliberate breach specified for this branch
        if b_suffix in breaches:
            approved_cap, target_enr = breaches[b_suffix]
        else:
            approved_cap = default_cap
            target_enr = default_enr
            
        branches_list.append((p_code, b_name, b_discipline, approved_cap, target_enr))
        
    if "extra_branches" in c:
        for b_suffix, b_name, b_discipline, approved_cap, target_enr in c["extra_branches"]:
            p_code = f"{col_code}-{b_suffix}-2026"
            branches_list.append((p_code, b_name, b_discipline, approved_cap, target_enr))

    c_copy = dict(c)
    c_copy["branches"] = branches_list
    COLLEGES.append(c_copy)


FIRST_NAMES = [
    "Aarav", "Ananya", "Rohan", "Sneha", "Aditya", "Ishita", "Rahul", "Pooja", "Vikram", "Neha",
    "Karthik", "Divya", "Siddharth", "Meera", "Varun", "Rhea", "Arjun", "Tanvi", "Gautam", "Shruti",
    "Abhishek", "Deepika", "Kunal", "Swati", "Nikhil", "Priyanka", "Harish", "Lavanya", "Pranav", "Kavya",
    "Manish", "Shreya", "Suresh", "Bhavna", "Rajesh", "Aishwarya", "Chirag", "Monika", "Sachin", "Preeti"
]
LAST_NAMES = [
    "Sharma", "Verma", "Iyer", "Patil", "Reddy", "Nair", "Gupta", "Kulkarni", "Singh", "Das",
    "Rao", "Joshi", "Bose", "Mehta", "Gowda", "Mukherjee", "Agarwal", "Bhat", "Deshmukh", "Choudhury",
    "Menon", "Pillai", "Nambiar", "Chatterjee", "Banerjee", "Sengupta", "Mishra", "Pandey", "Trivedi", "Shukla"
]

def generate_apaar_id():
    """Format: 12-digit APAAR ID (xxxx-xxxx-xxxx)."""
    p1 = random.randint(1000, 9999)
    p2 = random.randint(1000, 9999)
    p3 = random.randint(1000, 9999)
    return f"{p1}-{p2}-{p3}"

# Only a maximum of 4 institutes are permitted to have complaints per user requirement
COMPLAINT_ALLOWED_INSTITUTIONS = {"DSCE-BLR", "DEC-DEMO", "NIT-DEMO", "COEP-PUN"}

def run_seed():
    print(f"Executing expanded seeding for {len(COLLEGES)} AICTE Recognised Colleges with all 12 branches...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        from seed_data import ensure_demo_users
        ensure_demo_users(db)
        from app.models.user import User
        admin_user = db.query(User).filter(User.email == "admin@aicte.gov.in").first()
        if not admin_user:
            admin_user = db.query(User).first()
        admin_id = admin_user.id
        categories_pool = ["general", "general", "obc", "obc", "sc", "st", "ews"]

        for col_idx, col_data in enumerate(COLLEGES, 1):
            code = col_data["code"]
            inst = db.query(Institution).filter(Institution.institution_code == code).first()
            if not inst:
                inst = Institution(
                    id=uuid.uuid4(),
                    institution_code=code,
                    name=col_data["name"],
                    institution_type=col_data["type"],
                    state=col_data["state"],
                    city=col_data["city"],
                    status="active",
                )
                db.add(inst)
                db.flush()
                print(f"[{col_idx}/{len(COLLEGES)}] Created institution: {col_data['name']} ({code})")
            else:
                inst.name = col_data["name"]
                inst.institution_type = col_data["type"]
                inst.state = col_data["state"]
                inst.city = col_data["city"]
                db.flush()

            # Seed or Update Portfolio
            portfolio = db.query(InstitutionPortfolio).filter(InstitutionPortfolio.institution_id == inst.id).first()
            if not portfolio:
                portfolio = InstitutionPortfolio(
                    id=uuid.uuid4(),
                    institution_id=inst.id,
                )
                db.add(portfolio)

            portfolio.nba_tier = col_data["nba_tier"]
            portfolio.nba_status = col_data["nba_status"]
            portfolio.nba_accredited_branches = col_data["nba_branches"]
            portfolio.nba_valid_until = col_data["nba_valid"]
            portfolio.nba_file_ref = col_data["nba_ref"]
            portfolio.naac_grade = col_data["naac_grade"]
            portfolio.naac_cgpa = col_data["naac_cgpa"]
            portfolio.naac_cycle = col_data["naac_cycle"]
            portfolio.naac_valid_until = col_data["naac_valid"]

            # Complaints strictly restricted to max 4 institutes only
            is_complaint_allowed = code in COMPLAINT_ALLOWED_INSTITUTIONS
            portfolio.complaints_total = col_data["complaints_total"] if is_complaint_allowed else 0
            portfolio.complaints_resolved = col_data["complaints_resolved"] if is_complaint_allowed else 0
            portfolio.complaints_pending = col_data["complaints_pending"] if is_complaint_allowed else 0
            portfolio.complaints_summary = (
                col_data["complaints_summary"]
                if is_complaint_allowed
                else "Zero pending student grievances; anti-ragging cell certified 100% compliant."
            )

            portfolio.eoa_reference = col_data["eoa_ref"]
            portfolio.new_intake_applied = col_data["new_applied"]
            portfolio.new_intake_branch = col_data["new_branch"]
            portfolio.new_intake_status = col_data["new_status"]
            portfolio.new_intake_remarks = col_data["new_remarks"]
            portfolio.seat_division_json = json.dumps({
                "general": 40.5,
                "obc": 27.0,
                "sc": 15.0,
                "st": 7.5,
                "ews": 10.0,
                "supernumerary": 5.0,
            })
            db.flush()

            # Seed Programs & Intake Limits for all 12 branches
            for p_code, p_name, branch, approved_cap, target_enrolled in col_data["branches"]:
                prog = db.query(Program).filter(Program.institution_id == inst.id, Program.program_code == p_code).first()
                if not prog:
                    prog = Program(
                        id=uuid.uuid4(),
                        institution_id=inst.id,
                        program_code=p_code,
                        program_name=p_name,
                        academic_level="ug",
                        branch=branch,
                        duration_years=4,
                        status="active",
                    )
                    db.add(prog)
                    db.flush()
                else:
                    prog.program_name = p_name
                    prog.branch = branch
                    db.flush()

                # Intake Limit for 2026-27
                intake = db.query(IntakeLimit).filter(IntakeLimit.program_id == prog.id, IntakeLimit.admission_cycle == "2026-27").first()
                if not intake:
                    intake = IntakeLimit(
                        id=uuid.uuid4(),
                        program_id=prog.id,
                        admission_cycle="2026-27",
                        approved_capacity=approved_cap,
                        category="total",
                        source_type="official",
                        source_reference=col_data["eoa_ref"],
                        effective_from=date(2026, 6, 1),
                        verification_status="verified",
                    )
                    db.add(intake)
                else:
                    intake.approved_capacity = approved_cap
                db.flush()

                # Check existing student count for this branch
                current_students_count = db.query(StudentRecord).filter(
                    StudentRecord.program_id == prog.id,
                    StudentRecord.admission_cycle == "2026-27",
                ).count()

                # To ensure high database performance while maintaining high fidelity,
                # seed representative sample students (e.g. 15-25 students per branch for newly added branches)
                target_seed_students = min(target_enrolled, 25)
                needed_students = target_seed_students - current_students_count
                
                # If this is a deliberate breach scenario (e.g. IIT-DEMO CS or DSCE AI), ensure enrolled > approved
                if target_enrolled > approved_cap:
                    needed_students = target_enrolled - current_students_count

                if needed_students > 0:
                    for i in range(needed_students):
                        fn = random.choice(FIRST_NAMES)
                        ln = random.choice(LAST_NAMES)
                        cat = random.choice(categories_pool)
                        student_num = current_students_count + i + 1
                        roll_no = f"{code[:4]}-{branch[:2].upper()}-{student_num:03d}"
                        apaar_id = generate_apaar_id()

                        # 5% supernumerary / NRI representation
                        is_supernumerary = (i % 20 == 0)
                        super_cat = "nri" if is_supernumerary else "none"

                        rec = StudentRecord(
                            id=uuid.uuid4(),
                            institution_id=inst.id,
                            program_id=prog.id,
                            admission_cycle="2026-27",
                            student_name=f"{fn} {ln}",
                            institution_student_id=roll_no,
                            identity_reference=apaar_id,
                            date_of_birth=date(random.randint(2004, 2007), random.randint(1, 12), random.randint(1, 28)),
                            gender=random.choice(["male", "female"]),
                            admission_category=cat,
                            admission_status="admitted",
                            supernumerary_category=super_cat,
                            nri_category="applicable" if super_cat == "nri" else "not_applicable",
                            record_status="accepted",
                            identity_verification_status="verified",
                            created_by=admin_id,
                        )
                        db.add(rec)
                    db.flush()

        # Post-seeding Refinements:
        # 1. Normalize ALL APAAR IDs to strict 12-digit format (xxxx-xxxx-xxxx)
        print("Normalizing all student APAAR IDs to strict 12-digit format...")
        all_students = db.query(StudentRecord).all()
        for s in all_students:
            ident = s.identity_reference or ""
            # If contains 'DEMO', 'BAD', or isn't 14 chars with dashes
            clean_digits = re.sub(r'[^0-9]', '', ident)
            if len(clean_digits) == 12:
                s.identity_reference = f"{clean_digits[:4]}-{clean_digits[4:8]}-{clean_digits[8:]}"
            else:
                s.identity_reference = generate_apaar_id()
        db.flush()

        # 2. Configure canonical student demo account: Aarav Sharma in DSCE Cyber Security branch
        dsce_inst = db.query(Institution).filter(Institution.institution_code == "DSCE-BLR").first()
        if dsce_inst:
            cy_prog = db.query(Program).filter(Program.institution_id == dsce_inst.id, Program.program_code == "DSCE-CY-2026").first()
            if not cy_prog:
                cy_prog = db.query(Program).filter(Program.institution_id == dsce_inst.id).first()
            
            aarav = db.query(StudentRecord).filter(StudentRecord.institution_id == dsce_inst.id, StudentRecord.student_name == "Aarav Sharma").first()
            if not aarav:
                aarav = db.query(StudentRecord).filter(StudentRecord.institution_id == dsce_inst.id).first()
            if aarav:
                aarav.student_name = "Aarav Sharma"
                aarav.identity_reference = "9876-5432-1011"
                aarav.program_id = cy_prog.id if cy_prog else aarav.program_id
                aarav.institution_student_id = "DSCE-CY-001"
                aarav.record_status = "accepted"
                aarav.identity_verification_status = "verified"
                db.flush()

        # 3. Clean up existing validation issues and set clean accepted state
        print("Resetting validation issues and seeding strictly max 5 problem cases per problem institute...")
        db.query(ValidationIssue).delete()
        db.query(StudentRecord).update({"record_status": "accepted"})
        db.flush()

        # 4. Seed EXACTLY 5 problem student cases per institute in ONLY the problem institutes
        # "and like 5 students in problem cases in each institute"
        PROBLEM_STUDENT_INSTITUTES = ["DSCE-BLR", "DEC-DEMO", "NIT-DEMO", "IIT-DEMO"]
        PROBLEM_RULES = [
            (
                "DUPLICATE_LOCAL_RECORD",
                "high",
                "Rule 4: Local Deduplication — Candidate identity reference has duplicate active enrollment record in same institution.",
                "identity_reference",
                "count(identity_reference) == 1",
                "count(identity_reference) > 1"
            ),
            (
                "POTENTIAL_CROSS_INSTITUTION_DUPLICATE",
                "critical",
                "Rule 5: Cross-Institution Duplicates — Dual active enrollment detected across national seat allotment database.",
                "identity_reference",
                "unique_active_enrolment == 1",
                "unique_active_enrolment == 2"
            ),
            (
                "INTAKE_EXCEEDED",
                "high",
                "Rule 6: Capacity Limit Breach — Program intake capacity exceeded against AICTE sanctioned quota.",
                "admission_category",
                "enrolled <= approved_capacity",
                "enrolled > approved_capacity"
            ),
            (
                "CATEGORY_INCONSISTENCY",
                "high",
                "Rule 7: Admission Category Consistency — Inconsistent admission category or lapsed quota certificate detected.",
                "admission_category",
                "category_verified == True",
                "category_verified == False"
            ),
            (
                "DUPLICATE_LOCAL_RECORD",
                "high",
                "Rule 4: Local Deduplication — Repeated registration entry detected for candidate roll number in current cycle.",
                "institution_student_id",
                "count(institution_student_id) == 1",
                "count(institution_student_id) > 1"
            ),
        ]

        for p_code in PROBLEM_STUDENT_INSTITUTES:
            p_inst = db.query(Institution).filter(Institution.institution_code == p_code).first()
            if not p_inst:
                continue

            # Pick 5 students (skip Aarav Sharma if at DSCE)
            q = db.query(StudentRecord).filter(StudentRecord.institution_id == p_inst.id)
            if p_code == "DSCE-BLR":
                q = q.filter(StudentRecord.identity_reference != "9876-5432-1011")
            problem_students = q.order_by(StudentRecord.institution_student_id.desc()).limit(5).all()

            for idx, stud in enumerate(problem_students):
                rule_spec = PROBLEM_RULES[idx % len(PROBLEM_RULES)]
                stud.record_status = "flagged"
                issue = ValidationIssue(
                    id=uuid.uuid4(),
                    record_id=stud.id,
                    rule_code=rule_spec[0],
                    severity=rule_spec[1],
                    description=rule_spec[2],
                    affected_field=rule_spec[3],
                    expected_condition=rule_spec[4],
                    observed_condition=rule_spec[5],
                    status="open",
                    created_at=datetime.utcnow(),
                )
                db.add(issue)
            db.flush()

        db.commit()
        print(f"Expanded seeding completed successfully for {len(COLLEGES)} colleges!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
