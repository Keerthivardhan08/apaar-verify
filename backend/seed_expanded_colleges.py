"""
Expanded Seeding Script for APAAR Verify.
Seeds 28 Premier Engineering Colleges across India, each with 4 to 8 engineering branches,
realistic intake limits, synthetic student records across categories, and comprehensive
Institute Portfolio metadata (NBA, NAAC, Complaints, New Intake Approvals, Category Seat Quotas).
"""
import uuid
import random
import json
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
import app.models  # Register all models
from app.models.institution import Institution, Program, IntakeLimit, InstitutionPortfolio
from app.models.student import StudentRecord, StudentIdentity
from app.models.validation import ValidationIssue

COLLEGES = [
    {
        "code": "IIT-DEMO",
        "name": "Indian Institute of Technology (Demo)",
        "type": "CENTRAL_INSTITUTE",
        "state": "Delhi",
        "city": "New Delhi",
        "naac_grade": "A++", "naac_cgpa": "3.88", "naac_cycle": "Cycle 4", "naac_valid": "2029-05-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, EE, ME, Civil, Chemical, AI (All Core)", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITD/2024/01",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Zero pending grievances; anti-ragging cell certified 100% compliant.",
        "eoa_ref": "AICTE/EOA/2026-27/IITD-001",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Machine Learning", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Central Scrutiny Committee for 60 supernumerary seats in AI.",
        "branches": [
            ("CS-UG-2026", "B.Tech Computer Science & Engineering", "Computer Science", 10, 12),  # Deliberate breach demo
            ("EE-UG-2026", "B.Tech Electrical Engineering", "Electrical", 60, 58),
            ("ME-UG-2026", "B.Tech Mechanical Engineering", "Mechanical", 60, 56),
            ("CE-UG-2026", "B.Tech Civil Engineering", "Civil", 60, 54),
            ("CH-UG-2026", "B.Tech Chemical Engineering", "Chemical", 60, 55),
            ("AI-UG-2026", "B.Tech Artificial Intelligence", "Artificial Intelligence", 60, 60),
            ("DS-UG-2026", "B.Tech Data Science & Engineering", "Data Science", 60, 57),
        ]
    },
    {
        "code": "NIT-DEMO",
        "name": "National Institute of Technology (Demo)",
        "type": "CENTRAL_INSTITUTE",
        "state": "Karnataka",
        "city": "Surathkal",
        "naac_grade": "A++", "naac_cgpa": "3.76", "naac_cycle": "Cycle 3", "naac_valid": "2028-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, ECE, EEE, ME, Civil, IT (6 Accredited)", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITK/2024/02",
        "complaints_total": 6, "complaints_resolved": 5, "complaints_pending": 1,
        "complaints_summary": "1 scholarship disbursement query pending with state social welfare board.",
        "eoa_ref": "AICTE/EOA/2026-27/NITK-002",
        "new_applied": 60, "new_branch": "B.Tech Computational & Data Science", "new_status": "Approved",
        "new_remarks": "Sanctioned under National Education Policy multidisciplinary expansion.",
        "branches": [
            ("CS-NIT-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 118),
            ("EC-NIT-2026", "B.Tech Electronics & Communication", "Electronics", 120, 116),
            ("EE-NIT-2026", "B.Tech Electrical & Electronics", "Electrical", 90, 88),
            ("ME-NIT-2026", "B.Tech Mechanical Engineering", "Mechanical", 90, 85),
            ("CE-NIT-2026", "B.Tech Civil Engineering", "Civil", 60, 56),
            ("IT-NIT-2026", "B.Tech Information Technology", "Information Technology", 60, 59),
            ("AI-NIT-2026", "B.Tech Artificial Intelligence", "Artificial Intelligence", 60, 58),
        ]
    },
    {
        "code": "DSCE-BLR",
        "name": "Dayananda Sagar College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A+", "naac_cgpa": "3.52", "naac_cycle": "Cycle 2", "naac_valid": "2027-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, ISE, ECE, EEE, ME, Civil (6 Accredited)", "nba_valid": "2027-06-30", "nba_ref": "NBA/DSCE/2023/11",
        "complaints_total": 8, "complaints_resolved": 7, "complaints_pending": 1,
        "complaints_summary": "Hostel cafeteria menu query resolved; 1 fee structure dispute pending resolution.",
        "eoa_ref": "AICTE/EOA/2026-27/DSCE-847",
        "new_applied": 60, "new_branch": "B.E. Robotics & Artificial Intelligence", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Expert Committee with zero deficiency report.",
        "branches": [
            ("CS-DSCE-2026", "B.E. Computer Science & Engineering", "Computer Science", 180, 180),
            ("AI-DSCE-2026", "B.E. Artificial Intelligence & Machine Learning", "Artificial Intelligence", 120, 122),  # Breach
            ("IS-DSCE-2026", "B.E. Information Science & Engineering", "Information Science", 120, 117),
            ("EC-DSCE-2026", "B.E. Electronics & Communication", "Electronics", 120, 115),
            ("EE-DSCE-2026", "B.E. Electrical & Electronics Engineering", "Electrical", 60, 54),
            ("ME-DSCE-2026", "B.E. Mechanical Engineering", "Mechanical", 60, 48),
            ("CV-DSCE-2026", "B.E. Civil Engineering", "Civil", 60, 46),
            ("AE-DSCE-2026", "B.E. Aeronautical Engineering", "Aeronautical", 60, 58),
        ]
    },
    {
        "code": "DEC-DEMO",
        "name": "Demo Engineering College",
        "type": "PRIVATE_COLLEGE",
        "state": "Maharashtra",
        "city": "Pune",
        "naac_grade": "A", "naac_cgpa": "3.35", "naac_cycle": "Cycle 2", "naac_valid": "2027-09-30",
        "nba_tier": "Tier-2", "nba_status": "Accredited", "nba_branches": "CSE, IT, E&TC (3 Accredited)", "nba_valid": "2026-06-30", "nba_ref": "NBA/DEC/2022/44",
        "complaints_total": 5, "complaints_resolved": 4, "complaints_pending": 1,
        "complaints_summary": "1 campus placement transparency query under AICTE ombudsman examination.",
        "eoa_ref": "AICTE/EOA/2026-27/DEC-339",
        "new_applied": 30, "new_branch": "B.Tech Cloud Computing & DevOps", "new_status": "Under Inspection",
        "new_remarks": "Joint virtual inspection scheduled by AICTE Western Regional Office.",
        "branches": [
            ("CS-DEC-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 115),
            ("IT-DEC-2026", "B.Tech Information Technology", "Information Technology", 60, 57),
            ("ETC-DEC-2026", "B.Tech Electronics & Telecommunication", "Electronics", 60, 52),
            ("ME-DEC-2026", "B.Tech Mechanical Engineering", "Mechanical", 60, 45),
            ("CE-DEC-2026", "B.Tech Civil Engineering", "Civil", 60, 42),
            ("CH-DEC-2026", "B.Tech Chemical Engineering", "Chemical", 60, 40),
        ]
    },
    {
        "code": "IITB-MUM",
        "name": "Indian Institute of Technology Bombay",
        "type": "CENTRAL_INSTITUTE",
        "state": "Maharashtra",
        "city": "Mumbai",
        "naac_grade": "A++", "naac_cgpa": "3.95", "naac_cycle": "Cycle 4", "naac_valid": "2030-01-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Undergraduate Programs Accredited", "nba_valid": "2029-06-30", "nba_ref": "NBA/IITB/2024/001",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Zero unresolved grievances; Institute of National Eminence compliant.",
        "eoa_ref": "AICTE/EOA/2026-27/IITB-001",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Data Science", "new_status": "Approved",
        "new_remarks": "Approved with zero remarks; exceptional infrastructure accreditation.",
        "branches": [
            ("CS-IITB-2026", "B.Tech Computer Science & Engineering", "Computer Science", 150, 150),
            ("EE-IITB-2026", "B.Tech Electrical Engineering", "Electrical", 140, 138),
            ("ME-IITB-2026", "B.Tech Mechanical Engineering", "Mechanical", 120, 119),
            ("CE-IITB-2026", "B.Tech Civil Engineering", "Civil", 100, 98),
            ("CH-IITB-2026", "B.Tech Chemical Engineering", "Chemical", 90, 89),
            ("AE-IITB-2026", "B.Tech Aerospace Engineering", "Aerospace", 60, 60),
            ("MM-IITB-2026", "B.Tech Metallurgical Engineering & Materials Science", "Metallurgy", 60, 59),
        ]
    },
    {
        "code": "IITM-CHE",
        "name": "Indian Institute of Technology Madras",
        "type": "CENTRAL_INSTITUTE",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "naac_grade": "A++", "naac_cgpa": "3.94", "naac_cycle": "Cycle 4", "naac_valid": "2029-08-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Engineering Programs Tier-1", "nba_valid": "2029-06-30", "nba_ref": "NBA/IITM/2024/002",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "NIRF Rank #1 Overall; exemplary grievance governance standards.",
        "eoa_ref": "AICTE/EOA/2026-27/IITM-001",
        "new_applied": 60, "new_branch": "B.Tech Medical Science & Engineering", "new_status": "Approved",
        "new_remarks": "Innovative interdisciplinary medical engineering program sanctioned.",
        "branches": [
            ("CS-IITM-2026", "B.Tech Computer Science & Engineering", "Computer Science", 140, 140),
            ("EE-IITM-2026", "B.Tech Electrical Engineering", "Electrical", 130, 129),
            ("ME-IITM-2026", "B.Tech Mechanical Engineering", "Mechanical", 120, 118),
            ("CE-IITM-2026", "B.Tech Civil Engineering", "Civil", 90, 88),
            ("AE-IITM-2026", "B.Tech Aerospace Engineering", "Aerospace", 60, 60),
            ("NA-IITM-2026", "B.Tech Naval Architecture & Ocean Engineering", "Ocean Engg", 50, 48),
            ("CH-IITM-2026", "B.Tech Chemical Engineering", "Chemical", 80, 79),
        ]
    },
    {
        "code": "IITK-KGP",
        "name": "Indian Institute of Technology Kharagpur",
        "type": "CENTRAL_INSTITUTE",
        "state": "West Bengal",
        "city": "Kharagpur",
        "naac_grade": "A++", "naac_cgpa": "3.84", "naac_cycle": "Cycle 3", "naac_valid": "2028-10-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All B.Tech Programs Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITKGP/2023/008",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Fully compliant student welfare & internal complaints committee.",
        "eoa_ref": "AICTE/EOA/2026-27/IITKGP-003",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Robotics", "new_status": "Approved",
        "new_remarks": "Approved under center of excellence in industrial cybernetics.",
        "branches": [
            ("CS-KGP-2026", "B.Tech Computer Science & Engineering", "Computer Science", 150, 150),
            ("EC-KGP-2026", "B.Tech Electronics & Electrical Communication", "Electronics", 120, 119),
            ("EE-KGP-2026", "B.Tech Electrical Engineering", "Electrical", 120, 118),
            ("ME-KGP-2026", "B.Tech Mechanical Engineering", "Mechanical", 120, 117),
            ("CE-KGP-2026", "B.Tech Civil Engineering", "Civil", 100, 97),
            ("MN-KGP-2026", "B.Tech Mining Engineering", "Mining", 60, 56),
            ("OE-KGP-2026", "B.Tech Ocean Engineering & Naval Architecture", "Ocean Engg", 50, 49),
            ("CH-KGP-2026", "B.Tech Chemical Engineering", "Chemical", 80, 78),
        ]
    },
    {
        "code": "IITR-ROO",
        "name": "Indian Institute of Technology Roorkee",
        "type": "CENTRAL_INSTITUTE",
        "state": "Uttarakhand",
        "city": "Roorkee",
        "naac_grade": "A++", "naac_cgpa": "3.80", "naac_cycle": "Cycle 3", "naac_valid": "2028-04-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Branches Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IITR/2024/005",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Zero audit observations from Ministry technical education desk.",
        "eoa_ref": "AICTE/EOA/2026-27/IITR-004",
        "new_applied": 60, "new_branch": "B.Tech Data Science & AI", "new_status": "Approved",
        "new_remarks": "Approved with state-of-the-art supercomputing laboratory verification.",
        "branches": [
            ("CS-IITR-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 120),
            ("EC-IITR-2026", "B.Tech Electronics & Communication", "Electronics", 110, 108),
            ("EE-IITR-2026", "B.Tech Electrical Engineering", "Electrical", 110, 107),
            ("ME-IITR-2026", "B.Tech Mechanical Engineering", "Mechanical", 110, 106),
            ("CE-IITR-2026", "B.Tech Civil Engineering", "Civil", 120, 118),
            ("CH-IITR-2026", "B.Tech Chemical Engineering", "Chemical", 80, 77),
        ]
    },
    {
        "code": "NITT-TRI",
        "name": "National Institute of Technology Tiruchirappalli",
        "type": "CENTRAL_INSTITUTE",
        "state": "Tamil Nadu",
        "city": "Tiruchirappalli",
        "naac_grade": "A++", "naac_cgpa": "3.75", "naac_cycle": "Cycle 3", "naac_valid": "2028-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All 8 Engineering Departments Tier-1", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITT/2024/011",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Ranked #1 NIT in India; full compliance with central quota guidelines.",
        "eoa_ref": "AICTE/EOA/2026-27/NITT-005",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Data Science", "new_status": "Approved",
        "new_remarks": "Permanent expansion sanctioned by AICTE Southern Regional Committee.",
        "branches": [
            ("CS-NITT-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 120),
            ("EC-NITT-2026", "B.Tech Electronics & Communication", "Electronics", 120, 118),
            ("EE-NITT-2026", "B.Tech Electrical & Electronics", "Electrical", 100, 98),
            ("ME-NITT-2026", "B.Tech Mechanical Engineering", "Mechanical", 100, 97),
            ("CE-NITT-2026", "B.Tech Civil Engineering", "Civil", 90, 87),
            ("PR-NITT-2026", "B.Tech Production Engineering", "Production", 60, 58),
            ("CH-NITT-2026", "B.Tech Chemical Engineering", "Chemical", 60, 59),
            ("IC-NITT-2026", "B.Tech Instrumentation & Control", "Instrumentation", 60, 57),
        ]
    },
    {
        "code": "NITW-WAR",
        "name": "National Institute of Technology Warangal",
        "type": "CENTRAL_INSTITUTE",
        "state": "Telangana",
        "city": "Warangal",
        "naac_grade": "A+", "naac_cgpa": "3.68", "naac_cycle": "Cycle 3", "naac_valid": "2028-05-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, ECE, EEE, ME, Civil, Chemical (6 Accredited)", "nba_valid": "2027-06-30", "nba_ref": "NBA/NITW/2023/014",
        "complaints_total": 7, "complaints_resolved": 6, "complaints_pending": 1,
        "complaints_summary": "1 campus hostel water filtration complaint undergoing physical facility overhaul.",
        "eoa_ref": "AICTE/EOA/2026-27/NITW-006",
        "new_applied": 60, "new_branch": "B.Tech Computer Science & Design", "new_status": "Approved",
        "new_remarks": "Approved with AICTE South-Central Committee recommendation.",
        "branches": [
            ("CS-NITW-2026", "B.Tech Computer Science & Engineering", "Computer Science", 130, 129),
            ("EC-NITW-2026", "B.Tech Electronics & Communication", "Electronics", 120, 117),
            ("EE-NITW-2026", "B.Tech Electrical & Electronics", "Electrical", 110, 108),
            ("ME-NITW-2026", "B.Tech Mechanical Engineering", "Mechanical", 110, 105),
            ("CE-NITW-2026", "B.Tech Civil Engineering", "Civil", 90, 86),
            ("CH-NITW-2026", "B.Tech Chemical Engineering", "Chemical", 70, 68),
            ("BT-NITW-2026", "B.Tech Biotechnology", "Biotechnology", 60, 56),
        ]
    },
    {
        "code": "NITC-CAL",
        "name": "National Institute of Technology Calicut",
        "type": "CENTRAL_INSTITUTE",
        "state": "Kerala",
        "city": "Kozhikode",
        "naac_grade": "A+", "naac_cgpa": "3.61", "naac_cycle": "Cycle 3", "naac_valid": "2027-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Engineering Programs Tier-1", "nba_valid": "2028-06-30", "nba_ref": "NBA/NITC/2024/019",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Zero unresolved grievances; high student satisfaction index in southwest region.",
        "eoa_ref": "AICTE/EOA/2026-27/NITC-007",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Robotics", "new_status": "Approved",
        "new_remarks": "Approved for 60 capacity expansion in robotics innovation center.",
        "branches": [
            ("CS-NITC-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 119),
            ("EC-NITC-2026", "B.Tech Electronics & Communication", "Electronics", 120, 116),
            ("EE-NITC-2026", "B.Tech Electrical & Electronics", "Electrical", 100, 97),
            ("ME-NITC-2026", "B.Tech Mechanical Engineering", "Mechanical", 100, 95),
            ("CE-NITC-2026", "B.Tech Civil Engineering", "Civil", 90, 84),
            ("CH-NITC-2026", "B.Tech Chemical Engineering", "Chemical", 60, 58),
        ]
    },
    {
        "code": "VNIT-NAG",
        "name": "Visvesvaraya National Institute of Technology",
        "type": "CENTRAL_INSTITUTE",
        "state": "Maharashtra",
        "city": "Nagpur",
        "naac_grade": "A+", "naac_cgpa": "3.58", "naac_cycle": "Cycle 3", "naac_valid": "2027-08-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, ECE, EEE, ME, Civil, Metallurgy (6 Accredited)", "nba_valid": "2027-06-30", "nba_ref": "NBA/VNIT/2023/022",
        "complaints_total": 5, "complaints_resolved": 4, "complaints_pending": 1,
        "complaints_summary": "1 campus transport connectivity grievance forwarded to municipal corporation.",
        "eoa_ref": "AICTE/EOA/2026-27/VNIT-008",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Data Engineering", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Western Regional Committee.",
        "branches": [
            ("CS-VNIT-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 118),
            ("EC-VNIT-2026", "B.Tech Electronics & Communication", "Electronics", 110, 107),
            ("EE-VNIT-2026", "B.Tech Electrical & Electronics", "Electrical", 100, 96),
            ("ME-VNIT-2026", "B.Tech Mechanical Engineering", "Mechanical", 100, 94),
            ("CE-VNIT-2026", "B.Tech Civil Engineering", "Civil", 90, 85),
            ("MM-VNIT-2026", "B.Tech Metallurgical & Materials", "Metallurgy", 60, 57),
            ("MN-VNIT-2026", "B.Tech Mining Engineering", "Mining", 50, 47),
        ]
    },
    {
        "code": "BITS-PIL",
        "name": "Birla Institute of Technology & Science",
        "type": "CENTRAL_INSTITUTE",
        "state": "Rajasthan",
        "city": "Pilani",
        "naac_grade": "A++", "naac_cgpa": "3.85", "naac_cycle": "Cycle 4", "naac_valid": "2029-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Undergraduate Engineering Tier-1 Accredited", "nba_valid": "2029-06-30", "nba_ref": "NBA/BITS/2024/004",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "Institute of Eminence; zero fee or capitation complaints recorded.",
        "eoa_ref": "AICTE/EOA/2026-27/BITS-001",
        "new_applied": 60, "new_branch": "B.E. Artificial Intelligence & Computing", "new_status": "Approved",
        "new_remarks": "Approved with state-of-the-art AI cluster accreditation.",
        "branches": [
            ("CS-BITS-2026", "B.E. Computer Science", "Computer Science", 140, 140),
            ("EC-BITS-2026", "B.E. Electronics & Communication", "Electronics", 120, 119),
            ("EE-BITS-2026", "B.E. Electrical & Electronics", "Electrical", 120, 118),
            ("ME-BITS-2026", "B.E. Mechanical Engineering", "Mechanical", 100, 98),
            ("CE-BITS-2026", "B.E. Civil Engineering", "Civil", 80, 77),
            ("CH-BITS-2026", "B.E. Chemical Engineering", "Chemical", 80, 76),
        ]
    },
    {
        "code": "IIITH-HYD",
        "name": "International Institute of Information Technology Hyderabad",
        "type": "CENTRAL_INSTITUTE",
        "state": "Telangana",
        "city": "Hyderabad",
        "naac_grade": "A++", "naac_cgpa": "3.81", "naac_cycle": "Cycle 3", "naac_valid": "2028-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE & ECE Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/IIITH/2023/007",
        "complaints_total": 1, "complaints_resolved": 1, "complaints_pending": 0,
        "complaints_summary": "Leading premier computer science institution; zero pending grievances.",
        "eoa_ref": "AICTE/EOA/2026-27/IIITH-001",
        "new_applied": 30, "new_branch": "B.Tech Computer Science & Artificial Intelligence", "new_status": "Approved",
        "new_remarks": "Elite research track program sanctioned by AICTE Council.",
        "branches": [
            ("CS-IIITH-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 120),
            ("EC-IIITH-2026", "B.Tech Electronics & Communication", "Electronics", 90, 89),
            ("CL-IIITH-2026", "B.Tech Computational Linguistics", "Computational Linguistics", 40, 39),
            ("CSD-IIITH-2026", "B.Tech Computer Science & Human Sciences", "Computer Science", 40, 40),
        ]
    },
    {
        "code": "IIITB-BLR",
        "name": "International Institute of Information Technology Bangalore",
        "type": "CENTRAL_INSTITUTE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A+", "naac_cgpa": "3.71", "naac_cycle": "Cycle 3", "naac_valid": "2028-04-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, ECE, Data Science (Tier-1)", "nba_valid": "2028-06-30", "nba_ref": "NBA/IIITB/2024/015",
        "complaints_total": 2, "complaints_resolved": 2, "complaints_pending": 0,
        "complaints_summary": "100% compliant technical research institute under Karnataka jurisdiction.",
        "eoa_ref": "AICTE/EOA/2026-27/IIITB-001",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Machine Learning", "new_status": "Approved",
        "new_remarks": "Approved with state-of-the-art cyber defense laboratory.",
        "branches": [
            ("CS-IIITB-2026", "B.Tech Computer Science & Engineering", "Computer Science", 90, 90),
            ("EC-IIITB-2026", "B.Tech Electronics & Communication", "Electronics", 90, 88),
            ("DS-IIITB-2026", "B.Tech Data Science & AI", "Data Science", 60, 60),
            ("IT-IIITB-2026", "B.Tech Information Technology", "Information Technology", 60, 58),
            ("CY-IIITB-2026", "B.Tech Cyber Security & Trust Networks", "Cyber Security", 40, 39),
        ]
    },
    {
        "code": "DTU-DEL",
        "name": "Delhi Technological University",
        "type": "STATE_UNIVERSITY",
        "state": "Delhi",
        "city": "New Delhi",
        "naac_grade": "A+", "naac_cgpa": "3.60", "naac_cycle": "Cycle 3", "naac_valid": "2028-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Major Engineering Streams Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/DTU/2023/041",
        "complaints_total": 8, "complaints_resolved": 7, "complaints_pending": 1,
        "complaints_summary": "1 sports complex renovation query pending university development board review.",
        "eoa_ref": "AICTE/EOA/2026-27/DTU-101",
        "new_applied": 120, "new_branch": "B.Tech Artificial Intelligence & Machine Learning", "new_status": "Approved",
        "new_remarks": "Delhi government subsidized AICTE intake increase approved.",
        "branches": [
            ("CS-DTU-2026", "B.Tech Computer Science & Engineering", "Computer Science", 180, 180),
            ("SE-DTU-2026", "B.Tech Software Engineering", "Software Engineering", 120, 119),
            ("IT-DTU-2026", "B.Tech Information Technology", "Information Technology", 120, 118),
            ("EC-DTU-2026", "B.Tech Electronics & Communication", "Electronics", 180, 176),
            ("EE-DTU-2026", "B.Tech Electrical Engineering", "Electrical", 120, 115),
            ("ME-DTU-2026", "B.Tech Mechanical Engineering", "Mechanical", 180, 172),
            ("CE-DTU-2026", "B.Tech Civil Engineering", "Civil", 120, 112),
            ("EN-DTU-2026", "B.Tech Environmental Engineering", "Environmental", 60, 54),
        ]
    },
    {
        "code": "NSUT-DEL",
        "name": "Netaji Subhas University of Technology",
        "type": "STATE_UNIVERSITY",
        "state": "Delhi",
        "city": "New Delhi",
        "naac_grade": "A", "naac_cgpa": "3.48", "naac_cycle": "Cycle 2", "naac_valid": "2027-07-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, IT, ECE, ICE (4 Accredited)", "nba_valid": "2027-06-30", "nba_ref": "NBA/NSUT/2023/055",
        "complaints_total": 6, "complaints_resolved": 5, "complaints_pending": 1,
        "complaints_summary": "1 hostel allotment waitlist dispute under administrative hearing.",
        "eoa_ref": "AICTE/EOA/2026-27/NSUT-102",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence", "new_status": "Approved",
        "new_remarks": "Approved with AICTE Northern Regional Office clearance.",
        "branches": [
            ("CS-NSUT-2026", "B.Tech Computer Science & Engineering", "Computer Science", 180, 180),
            ("AI-NSUT-2026", "B.Tech Artificial Intelligence", "Artificial Intelligence", 60, 60),
            ("IT-NSUT-2026", "B.Tech Information Technology", "Information Technology", 120, 118),
            ("EC-NSUT-2026", "B.Tech Electronics & Communication", "Electronics", 120, 116),
            ("EE-NSUT-2026", "B.Tech Electrical Engineering", "Electrical", 90, 86),
            ("ME-NSUT-2026", "B.Tech Mechanical Engineering", "Mechanical", 90, 83),
            ("IC-NSUT-2026", "B.Tech Instrumentation & Control", "Instrumentation", 60, 55),
        ]
    },
    {
        "code": "COEP-PUN",
        "name": "COEP Technological University",
        "type": "STATE_UNIVERSITY",
        "state": "Maharashtra",
        "city": "Pune",
        "naac_grade": "A+", "naac_cgpa": "3.65", "naac_cycle": "Cycle 3", "naac_valid": "2028-09-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Departments Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/COEP/2024/030",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Historic premier engineering college; zero regulatory non-compliances.",
        "eoa_ref": "AICTE/EOA/2026-27/COEP-103",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Robotics", "new_status": "Approved",
        "new_remarks": "Approved under Maharashtra State Technology Modernization Grant.",
        "branches": [
            ("CS-COEP-2026", "B.Tech Computer Engineering", "Computer Science", 120, 120),
            ("AI-COEP-2026", "B.Tech Artificial Intelligence & Machine Learning", "Artificial Intelligence", 60, 60),
            ("ETC-COEP-2026", "B.Tech Electronics & Telecommunication", "Electronics", 120, 117),
            ("EE-COEP-2026", "B.Tech Electrical Engineering", "Electrical", 90, 88),
            ("ME-COEP-2026", "B.Tech Mechanical Engineering", "Mechanical", 120, 115),
            ("CE-COEP-2026", "B.Tech Civil Engineering", "Civil", 90, 86),
            ("PR-COEP-2026", "B.Tech Production Engineering", "Production", 60, 58),
            ("MM-COEP-2026", "B.Tech Metallurgical Engineering", "Metallurgy", 60, 56),
        ]
    },
    {
        "code": "VJTI-MUM",
        "name": "Veermata Jijabai Technological Institute",
        "type": "STATE_UNIVERSITY",
        "state": "Maharashtra",
        "city": "Mumbai",
        "naac_grade": "A+", "naac_cgpa": "3.60", "naac_cycle": "Cycle 3", "naac_valid": "2028-02-28",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Branches Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/VJTI/2023/048",
        "complaints_total": 6, "complaints_resolved": 5, "complaints_pending": 1,
        "complaints_summary": "1 scholarship document verification delay under municipal social welfare review.",
        "eoa_ref": "AICTE/EOA/2026-27/VJTI-104",
        "new_applied": 60, "new_branch": "B.Tech Computer Science (Data Science)", "new_status": "Approved",
        "new_remarks": "Approved with AICTE Western Regional Committee clearance.",
        "branches": [
            ("CS-VJTI-2026", "B.Tech Computer Engineering", "Computer Science", 120, 120),
            ("IT-VJTI-2026", "B.Tech Information Technology", "Information Technology", 90, 89),
            ("EL-VJTI-2026", "B.Tech Electronics Engineering", "Electronics", 90, 87),
            ("EE-VJTI-2026", "B.Tech Electrical Engineering", "Electrical", 90, 86),
            ("ME-VJTI-2026", "B.Tech Mechanical Engineering", "Mechanical", 90, 84),
            ("CE-VJTI-2026", "B.Tech Civil Engineering", "Civil", 90, 83),
            ("PR-VJTI-2026", "B.Tech Production Engineering", "Production", 60, 56),
            ("TX-VJTI-2026", "B.Tech Textile Engineering", "Textile", 60, 51),
        ]
    },
    {
        "code": "RVCE-BLR",
        "name": "RV College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A++", "naac_cgpa": "3.83", "naac_cycle": "Cycle 3", "naac_valid": "2029-04-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Undergraduate Programs Tier-1 Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/RVCE/2024/018",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Karnataka top-ranked private autonomous college; zero unresolved grievances.",
        "eoa_ref": "AICTE/EOA/2026-27/RVCE-201",
        "new_applied": 60, "new_branch": "B.E. Computer Science (Cyber Security)", "new_status": "Approved",
        "new_remarks": "Approved with industry partnership MOU verification.",
        "branches": [
            ("CS-RVCE-2026", "B.E. Computer Science & Engineering", "Computer Science", 180, 180),
            ("AI-RVCE-2026", "B.E. Artificial Intelligence & Machine Learning", "Artificial Intelligence", 120, 120),
            ("IS-RVCE-2026", "B.E. Information Science & Engineering", "Information Science", 120, 119),
            ("EC-RVCE-2026", "B.E. Electronics & Communication", "Electronics", 180, 178),
            ("EE-RVCE-2026", "B.E. Electrical & Electronics", "Electrical", 90, 88),
            ("ME-RVCE-2026", "B.E. Mechanical Engineering", "Mechanical", 90, 85),
            ("CV-RVCE-2026", "B.E. Civil Engineering", "Civil", 60, 56),
            ("AE-RVCE-2026", "B.E. Aerospace Engineering", "Aerospace", 60, 60),
        ]
    },
    {
        "code": "BMSCE-BLR",
        "name": "BMS College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A++", "naac_cgpa": "3.83", "naac_cycle": "Cycle 3", "naac_valid": "2029-01-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Engineering Branches Tier-1", "nba_valid": "2028-06-30", "nba_ref": "NBA/BMSCE/2024/025",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Pioneering private college founded in 1946; excellent governance track record.",
        "eoa_ref": "AICTE/EOA/2026-27/BMSCE-202",
        "new_applied": 60, "new_branch": "B.E. Artificial Intelligence & Data Science", "new_status": "Approved",
        "new_remarks": "Approved under VTU autonomous curriculum expansion.",
        "branches": [
            ("CS-BMS-2026", "B.E. Computer Science & Engineering", "Computer Science", 180, 180),
            ("AI-BMS-2026", "B.E. Artificial Intelligence & Machine Learning", "Artificial Intelligence", 120, 118),
            ("IS-BMS-2026", "B.E. Information Science & Engineering", "Information Science", 120, 117),
            ("EC-BMS-2026", "B.E. Electronics & Communication", "Electronics", 180, 175),
            ("EE-BMS-2026", "B.E. Electrical & Electronics", "Electrical", 90, 87),
            ("ME-BMS-2026", "B.E. Mechanical Engineering", "Mechanical", 90, 82),
            ("CV-BMS-2026", "B.E. Civil Engineering", "Civil", 90, 78),
            ("MD-BMS-2026", "B.E. Medical Electronics Engineering", "Medical Electronics", 60, 54),
        ]
    },
    {
        "code": "MSRIT-BLR",
        "name": "Ramaiah Institute of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Bengaluru",
        "naac_grade": "A+", "naac_cgpa": "3.62", "naac_cycle": "Cycle 3", "naac_valid": "2028-07-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "CSE, ISE, ECE, EEE, ME, Civil (6 Accredited)", "nba_valid": "2027-06-30", "nba_ref": "NBA/MSRIT/2023/033",
        "complaints_total": 6, "complaints_resolved": 5, "complaints_pending": 1,
        "complaints_summary": "1 examination re-evaluation turnaround complaint under institutional ombudsman.",
        "eoa_ref": "AICTE/EOA/2026-27/MSRIT-203",
        "new_applied": 60, "new_branch": "B.E. Artificial Intelligence & Machine Learning", "new_status": "Approved",
        "new_remarks": "Approved with AICTE Southwestern Regional Committee sanction.",
        "branches": [
            ("CS-MSRIT-2026", "B.E. Computer Science & Engineering", "Computer Science", 180, 180),
            ("AI-MSRIT-2026", "B.E. Artificial Intelligence & Machine Learning", "Artificial Intelligence", 120, 119),
            ("IS-MSRIT-2026", "B.E. Information Science & Engineering", "Information Science", 120, 118),
            ("EC-MSRIT-2026", "B.E. Electronics & Communication", "Electronics", 150, 146),
            ("EE-MSRIT-2026", "B.E. Electrical & Electronics", "Electrical", 90, 85),
            ("ME-MSRIT-2026", "B.E. Mechanical Engineering", "Mechanical", 90, 81),
            ("CV-MSRIT-2026", "B.E. Civil Engineering", "Civil", 60, 52),
            ("CH-MSRIT-2026", "B.E. Chemical Engineering", "Chemical", 60, 54),
        ]
    },
    {
        "code": "PSG-CBE",
        "name": "PSG College of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Coimbatore",
        "naac_grade": "A++", "naac_cgpa": "3.78", "naac_cycle": "Cycle 4", "naac_valid": "2029-03-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Undergraduate Engineering Streams", "nba_valid": "2028-06-30", "nba_ref": "NBA/PSG/2024/027",
        "complaints_total": 3, "complaints_resolved": 3, "complaints_pending": 0,
        "complaints_summary": "Pioneering industry-integrated institution; zero pending grievances.",
        "eoa_ref": "AICTE/EOA/2026-27/PSG-204",
        "new_applied": 60, "new_branch": "B.E. Robotics & Automation Engineering", "new_status": "Approved",
        "new_remarks": "Approved with modern robotic arm simulation lab clearance.",
        "branches": [
            ("CS-PSG-2026", "B.E. Computer Science & Engineering", "Computer Science", 180, 180),
            ("IT-PSG-2026", "B.Tech Information Technology", "Information Technology", 120, 118),
            ("EC-PSG-2026", "B.E. Electronics & Communication", "Electronics", 180, 177),
            ("EE-PSG-2026", "B.E. Electrical & Electronics", "Electrical", 120, 116),
            ("ME-PSG-2026", "B.E. Mechanical Engineering", "Mechanical", 120, 114),
            ("PR-PSG-2026", "B.E. Production Engineering", "Production", 60, 58),
            ("CV-PSG-2026", "B.E. Civil Engineering", "Civil", 60, 54),
            ("RO-PSG-2026", "B.E. Robotics & Automation", "Robotics", 60, 60),
        ]
    },
    {
        "code": "SSN-CHE",
        "name": "Sri Sivasubramaniya Nadar College of Engineering",
        "type": "PRIVATE_COLLEGE",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "naac_grade": "A++", "naac_cgpa": "3.75", "naac_cycle": "Cycle 3", "naac_valid": "2028-10-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Major Engineering Streams Accredited", "nba_valid": "2028-06-30", "nba_ref": "NBA/SSN/2024/035",
        "complaints_total": 4, "complaints_resolved": 4, "complaints_pending": 0,
        "complaints_summary": "Autonomous Anna University affiliate; high research funding and student trust.",
        "eoa_ref": "AICTE/EOA/2026-27/SSN-205",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Data Science", "new_status": "Approved",
        "new_remarks": "Approved with AICTE Southern Regional Committee certificate.",
        "branches": [
            ("CS-SSN-2026", "B.E. Computer Science & Engineering", "Computer Science", 180, 180),
            ("IT-SSN-2026", "B.Tech Information Technology", "Information Technology", 120, 119),
            ("EC-SSN-2026", "B.E. Electronics & Communication", "Electronics", 180, 178),
            ("EE-SSN-2026", "B.E. Electrical & Electronics", "Electrical", 90, 87),
            ("ME-SSN-2026", "B.E. Mechanical Engineering", "Mechanical", 90, 84),
            ("CV-SSN-2026", "B.E. Civil Engineering", "Civil", 60, 53),
            ("CH-SSN-2026", "B.Tech Chemical Engineering", "Chemical", 60, 56),
            ("BM-SSN-2026", "B.E. Biomedical Engineering", "Biomedical", 60, 58),
        ]
    },
    {
        "code": "TIET-PAT",
        "name": "Thapar Institute of Engineering and Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Punjab",
        "city": "Patiala",
        "naac_grade": "A+", "naac_cgpa": "3.62", "naac_cycle": "Cycle 3", "naac_valid": "2028-06-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Core Programs Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/TIET/2023/040",
        "complaints_total": 7, "complaints_resolved": 6, "complaints_pending": 1,
        "complaints_summary": "1 fee instalment schedule inquiry under review with academic bursar.",
        "eoa_ref": "AICTE/EOA/2026-27/TIET-206",
        "new_applied": 120, "new_branch": "B.E. Computer Science (Business Systems)", "new_status": "Approved",
        "new_remarks": "Approved in partnership with TCS Academic Alliance.",
        "branches": [
            ("CS-TIET-2026", "B.E. Computer Science & Engineering", "Computer Science", 240, 240),
            ("CB-TIET-2026", "B.E. Computer Science & Business Systems", "Computer Science", 120, 117),
            ("EC-TIET-2026", "B.E. Electronics & Communication", "Electronics", 180, 175),
            ("EE-TIET-2026", "B.E. Electrical & Computer", "Electrical", 120, 114),
            ("ME-TIET-2026", "B.E. Mechanical Engineering", "Mechanical", 120, 110),
            ("CE-TIET-2026", "B.E. Civil Engineering", "Civil", 60, 52),
            ("MC-TIET-2026", "B.E. Mechatronics Engineering", "Mechatronics", 60, 57),
        ]
    },
    {
        "code": "MANIP-MAHE",
        "name": "Manipal Institute of Technology",
        "type": "PRIVATE_COLLEGE",
        "state": "Karnataka",
        "city": "Manipal",
        "naac_grade": "A++", "naac_cgpa": "3.75", "naac_cycle": "Cycle 3", "naac_valid": "2028-11-30",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Major Engineering Streams Tier-1", "nba_valid": "2028-06-30", "nba_ref": "NBA/MIT/2024/029",
        "complaints_total": 5, "complaints_resolved": 5, "complaints_pending": 0,
        "complaints_summary": "Institution of Eminence affiliate; zero pending student grievances.",
        "eoa_ref": "AICTE/EOA/2026-27/MIT-207",
        "new_applied": 60, "new_branch": "B.Tech Artificial Intelligence & Machine Learning", "new_status": "Approved",
        "new_remarks": "Approved under center of excellence in healthcare computing.",
        "branches": [
            ("CS-MIT-2026", "B.Tech Computer Science & Engineering", "Computer Science", 200, 200),
            ("DS-MIT-2026", "B.Tech Data Science & Engineering", "Data Science", 120, 119),
            ("IT-MIT-2026", "B.Tech Information Technology", "Information Technology", 120, 118),
            ("EC-MIT-2026", "B.Tech Electronics & Communication", "Electronics", 180, 174),
            ("EE-MIT-2026", "B.Tech Electrical & Electronics", "Electrical", 120, 112),
            ("ME-MIT-2026", "B.Tech Mechanical Engineering", "Mechanical", 120, 108),
            ("CE-MIT-2026", "B.Tech Civil Engineering", "Civil", 60, 51),
            ("AE-MIT-2026", "B.Tech Aeronautical Engineering", "Aeronautical", 60, 59),
        ]
    },
    {
        "code": "JADAV-KOL",
        "name": "Jadavpur University Faculty of Engineering",
        "type": "STATE_UNIVERSITY",
        "state": "West Bengal",
        "city": "Kolkata",
        "naac_grade": "A", "naac_cgpa": "3.52", "naac_cycle": "Cycle 3", "naac_valid": "2027-12-31",
        "nba_tier": "Tier-1", "nba_status": "Accredited", "nba_branches": "All Engineering Streams Tier-1 Accredited", "nba_valid": "2027-06-30", "nba_ref": "NBA/JU/2023/062",
        "complaints_total": 7, "complaints_resolved": 6, "complaints_pending": 1,
        "complaints_summary": "1 campus hostel security audit underway with state higher education department.",
        "eoa_ref": "AICTE/EOA/2026-27/JU-105",
        "new_applied": 30, "new_branch": "B.Tech Artificial Intelligence", "new_status": "Approved",
        "new_remarks": "Sanctioned under West Bengal state technical university grant.",
        "branches": [
            ("CS-JU-2026", "B.Tech Computer Science & Engineering", "Computer Science", 90, 90),
            ("IT-JU-2026", "B.Tech Information Technology", "Information Technology", 60, 60),
            ("ETC-JU-2026", "B.Tech Electronics & Telecommunication", "Electronics", 90, 89),
            ("EE-JU-2026", "B.Tech Electrical Engineering", "Electrical", 90, 88),
            ("ME-JU-2026", "B.Tech Mechanical Engineering", "Mechanical", 90, 86),
            ("CE-JU-2026", "B.Tech Civil Engineering", "Civil", 90, 84),
            ("CH-JU-2026", "B.Tech Chemical Engineering", "Chemical", 60, 58),
            ("PR-JU-2026", "B.Tech Production Engineering", "Production", 50, 48),
        ]
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
        "eoa_ref": "AICTE/EOA/2026-27/CEG-106",
        "new_applied": 60, "new_branch": "B.E. Artificial Intelligence & Data Science", "new_status": "Approved",
        "new_remarks": "Approved with state government quota seat allocation matrix.",
        "branches": [
            ("CS-CEG-2026", "B.E. Computer Science & Engineering", "Computer Science", 180, 180),
            ("IT-CEG-2026", "B.Tech Information Technology", "Information Technology", 120, 118),
            ("EC-CEG-2026", "B.E. Electronics & Communication", "Electronics", 180, 176),
            ("EE-CEG-2026", "B.E. Electrical & Electronics", "Electrical", 120, 115),
            ("ME-CEG-2026", "B.E. Mechanical Engineering", "Mechanical", 120, 112),
            ("CE-CEG-2026", "B.E. Civil Engineering", "Civil", 120, 108),
            ("MF-CEG-2026", "B.E. Manufacturing Engineering", "Manufacturing", 60, 54),
            ("GI-CEG-2026", "B.E. Geo-Informatics Engineering", "Geo-Informatics", 50, 46),
        ]
    },
    {
        "code": "WALCH-SAN",
        "name": "Walchand College of Engineering",
        "type": "STATE_UNIVERSITY",
        "state": "Maharashtra",
        "city": "Sangli",
        "naac_grade": "A", "naac_cgpa": "3.42", "naac_cycle": "Cycle 2", "naac_valid": "2027-05-31",
        "nba_tier": "Tier-2", "nba_status": "Accredited", "nba_branches": "CSE, IT, Electrical, Mechanical, Civil", "nba_valid": "2027-06-30", "nba_ref": "NBA/WCE/2023/077",
        "complaints_total": 4, "complaints_resolved": 3, "complaints_pending": 1,
        "complaints_summary": "1 campus internet bandwidth upgrading request underway.",
        "eoa_ref": "AICTE/EOA/2026-27/WCE-107",
        "new_applied": 30, "new_branch": "B.Tech Computer Science (Cyber Security)", "new_status": "Approved",
        "new_remarks": "Approved by AICTE Western Regional Council.",
        "branches": [
            ("CS-WCE-2026", "B.Tech Computer Science & Engineering", "Computer Science", 120, 118),
            ("IT-WCE-2026", "B.Tech Information Technology", "Information Technology", 60, 58),
            ("EL-WCE-2026", "B.Tech Electronics Engineering", "Electronics", 60, 56),
            ("EE-WCE-2026", "B.Tech Electrical Engineering", "Electrical", 60, 55),
            ("ME-WCE-2026", "B.Tech Mechanical Engineering", "Mechanical", 60, 52),
            ("CE-WCE-2026", "B.Tech Civil Engineering", "Civil", 60, 50),
        ]
    }
]

FIRST_NAMES = ["Aarav", "Ananya", "Rohan", "Sneha", "Aditya", "Ishita", "Rahul", "Pooja", "Vikram", "Neha", "Karthik", "Divya", "Siddharth", "Meera", "Varun", "Rhea", "Arjun", "Tanvi", "Gautam", "Shruti"]
LAST_NAMES = ["Sharma", "Verma", "Iyer", "Patil", "Reddy", "Nair", "Gupta", "Kulkarni", "Singh", "Das", "Rao", "Joshi", "Bose", "Mehta", "Gowda", "Mukherjee", "Agarwal", "Bhat"]

def generate_apaar_id():
    """Format: 12-digit APAAR ID."""
    p1 = random.randint(1000, 9999)
    p2 = random.randint(1000, 9999)
    p3 = random.randint(1000, 9999)
    return f"{p1}-{p2}-{p3}"

def run_seed():
    print(f"Executing expanded seeding for {len(COLLEGES)} colleges...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        from app.models.user import User
        admin_user = db.query(User).first()
        admin_id = admin_user.id if admin_user else uuid.uuid4()
        categories_pool = ["general", "general", "obc", "obc", "sc", "st", "ews"]

        for col_data in COLLEGES:
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
                print(f"Created institution: {col_data['name']} ({code})")
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
            portfolio.complaints_total = col_data["complaints_total"]
            portfolio.complaints_resolved = col_data["complaints_resolved"]
            portfolio.complaints_pending = col_data["complaints_pending"]
            portfolio.complaints_summary = col_data["complaints_summary"]
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

            # Seed Programs & Intake Limits
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

                # Check existing student count
                current_students_count = db.query(StudentRecord).filter(
                    StudentRecord.program_id == prog.id,
                    StudentRecord.admission_cycle == "2026-27",
                ).count()

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

        db.commit()
        print("Expanded college seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
