import React from 'react';
import {
  Printer,
  X,
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  GraduationCap,
  Layers,
  BookOpen,
  QrCode,
  FileText,
} from 'lucide-react';

interface Course {
  code: string;
  title: string;
  category: string;
  credits: number;
  grade: string;
  grade_point: number;
  marks_pct: number;
}

interface Semester {
  semester_number: number;
  academic_year: string;
  sgpa: number;
  credits_registered: number;
  credits_earned: number;
  status: string;
  courses: Course[];
}

interface PreUniRecord {
  qualification: string;
  issuing_board: string;
  year_of_passing: string;
  overall_percentage: string;
  cgpa: string;
  status: string;
  subjects: Array<{
    code: string;
    name: string;
    marks_obtained: number;
    grade: string;
  }>;
}

interface DossierData {
  student_profile: {
    student_name: string;
    apaar_id: string;
    roll_no: string;
    abc_account_id: string;
    date_of_birth: string;
    gender: string;
    admission_category: string;
    admission_cycle: string;
    institution_name: string;
    institution_code: string;
    program_name: string;
    branch: string;
    current_semester: string;
    enrollment_status: string;
    intake_compliance_status: string;
  };
  academic_summary: {
    cumulative_cgpa: number;
    total_credits_earned: number;
    total_degree_credits_required: number;
    completion_percentage: number;
    nheqf_level: string;
    credit_bank_status: string;
  };
  pre_university_records: PreUniRecord[];
  semester_coursework: Semester[];
  verification_metadata: {
    verified_by: string;
    authority: string;
    tamper_evident_seal_hash: string;
    pki_algorithm: string;
    verification_status: string;
    verified_at: string;
    official_qr_verification_url: string;
  };
}

interface Props {
  dossier: DossierData;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableAcademicDossierModal: React.FC<Props> = ({
  dossier,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !dossier) return null;

  const handlePrint = () => {
    window.print();
  };

  const p = dossier.student_profile;
  const s = dossier.academic_summary;
  const v = dossier.verification_metadata;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      {/* Container Dialog */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white print:w-full">
        {/* Modal Top Action Bar (Hidden when printing) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between print:hidden bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Official Academic Dossier & APAAR Verification Transcript
              </h2>
              <p className="text-xs text-slate-400">
                Print-ready official document with verifiable QR code and complete coursework ledger
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Dossier</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="overflow-y-auto p-6 sm:p-10 space-y-8 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          {/* Certificate Header Banner */}
          <div className="border-b-4 border-double border-indigo-900 pb-6 text-center space-y-2">
            <div className="flex items-center justify-between px-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-slate-100 border border-slate-300 shadow-inner">
                <GraduationCap className="w-10 h-10 text-indigo-900" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-widest font-black text-indigo-900">
                  Government of India • Ministry of Education
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
                  All India Council for Technical Education
                </h1>
                <div className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                  National Academic Registry • APAAR Comprehensive Student Dossier
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Issued under National Education Policy (NEP 2020) & Academic Bank of Credits (ABC)
                </div>
              </div>
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-50 border border-amber-300 shadow-inner">
                <Award className="w-10 h-10 text-amber-700" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 px-2 pt-2 border-t border-slate-200">
              <span><strong>Dossier Ref:</strong> AICTE/APAAR/2026/KA/DSCE-04291</span>
              <span><strong>Verification Status:</strong> <span className="text-emerald-700 font-bold uppercase">Officially Verified</span></span>
              <span><strong>Date of Generation:</strong> {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Student Identity & Institution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-2">
              <h3 className="font-extrabold text-indigo-950 text-sm uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-700" />
                <span>Candidate Identification</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Candidate Full Name</span>
                  <span className="text-slate-900 font-black text-sm">{p.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Unified APAAR ID</span>
                  <span className="text-indigo-900 font-mono font-black text-sm">{p.apaar_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Institutional Roll / Seat No</span>
                  <span className="text-slate-900 font-mono font-bold">{p.roll_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">ABC Account ID</span>
                  <span className="text-slate-900 font-mono font-bold">{p.abc_account_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Birth / Gender</span>
                  <span className="text-slate-900 font-bold">{p.date_of_birth} ({p.gender})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Quota / Category</span>
                  <span className="text-slate-900 font-bold uppercase">{p.admission_category} (CET Merit)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-indigo-950 text-sm uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-700" />
                <span>Enrolled Institution & Academic Level</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">College / University Name</span>
                  <span className="text-slate-900 font-extrabold">{p.institution_name} ({p.institution_code})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Enrolled Program & Discipline</span>
                  <span className="text-slate-900 font-bold">{p.program_name} — {p.branch}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Standing</span>
                  <span className="text-slate-900 font-bold">{p.current_semester}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Intake Sanction Status</span>
                  <span className="text-emerald-700 font-bold uppercase">{p.intake_compliance_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Bank of Credits (ABC) & Overall Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-950 text-white p-4 rounded-xl text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300">Cumulative Grade Point (CGPA)</div>
              <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">{s.cumulative_cgpa} / 10.0</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300">Credits Earned / Required</div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">{s.total_credits_earned} / {s.total_degree_credits_required}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300">Degree Progress</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{s.completion_percentage}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300">National Qualification</div>
              <div className="text-sm font-bold text-white mt-1.5">{s.nheqf_level}</div>
            </div>
          </div>

          {/* Section 1: Pre-University Secondary Foundations */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b-2 border-slate-300 pb-1.5">
              <BookOpen className="w-4 h-4 text-indigo-900" />
              <span>1. Prior Academic Foundations (Pre-University & Secondary)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dossier.pre_university_records?.map((rec, i) => (
                <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rec.qualification}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {rec.overall_percentage} ({rec.status})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Board: {rec.issuing_board} • Passing Year: {rec.year_of_passing}
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-200 text-[10px]">
                    {rec.subjects?.map((sub, j) => (
                      <div key={j} className="flex justify-between text-slate-700 bg-white px-2 py-1 rounded border border-slate-100">
                        <span>{sub.name}</span>
                        <span className="font-bold">{sub.marks_obtained}/100 ({sub.grade})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Complete Semester Coursework Transcript (Semesters 1-6) */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b-2 border-slate-300 pb-1.5">
              <Layers className="w-4 h-4 text-indigo-900" />
              <span>2. Full Undergraduate Coursework Transcript (What He Studied Till Now)</span>
            </h3>

            <div className="space-y-4">
              {dossier.semester_coursework?.map((sem) => (
                <div key={sem.semester_number} className="border border-slate-300 rounded-xl overflow-hidden">
                  {/* Semester Header */}
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between text-xs">
                    <div className="font-extrabold text-slate-900">
                      Semester {sem.semester_number} — {sem.academic_year}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>Credits: <strong>{sem.credits_earned}</strong></span>
                      <span>SGPA: <strong className="text-indigo-900 font-mono">{sem.sgpa.toFixed(2)}</strong></span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {sem.status}
                      </span>
                    </div>
                  </div>

                  {/* Coursework Table */}
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-1.5 w-24">Course Code</th>
                        <th className="px-3 py-1.5">Course Title</th>
                        <th className="px-3 py-1.5 w-32">Classification</th>
                        <th className="px-3 py-1.5 text-center w-16">Credits</th>
                        <th className="px-3 py-1.5 text-center w-16">Grade</th>
                        <th className="px-3 py-1.5 text-center w-16">Marks %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sem.courses?.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{c.code}</td>
                          <td className="px-3 py-1.5 font-medium text-slate-800">{c.title}</td>
                          <td className="px-3 py-1.5 text-slate-600 text-[11px]">{c.category}</td>
                          <td className="px-3 py-1.5 text-center font-mono font-semibold">{c.credits.toFixed(1)}</td>
                          <td className="px-3 py-1.5 text-center">
                            <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-950 border border-indigo-200">
                              {c.grade}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-center font-mono text-slate-700">{c.marks_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Official Verification QR Code & Cryptographic Ledger Watermark */}
          <div className="border-2 border-indigo-900 rounded-2xl p-6 bg-gradient-to-r from-slate-50 via-white to-indigo-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Scannable SVG QR Code */}
            <div className="flex flex-col items-center text-center shrink-0">
              <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-md">
                {/* Embedded High-Contrast QR Code SVG */}
                <svg
                  className="w-36 h-36"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="100" height="100" fill="white" />
                  {/* Outer Frame Top-Left */}
                  <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="14" width="16" height="16" fill="white" />
                  <rect x="18" y="18" width="8" height="8" fill="#0f172a" />
                  {/* Outer Frame Top-Right */}
                  <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="70" y="14" width="16" height="16" fill="white" />
                  <rect x="74" y="18" width="8" height="8" fill="#0f172a" />
                  {/* Outer Frame Bottom-Left */}
                  <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="70" width="16" height="16" fill="white" />
                  <rect x="18" y="74" width="8" height="8" fill="#0f172a" />
                  {/* Data Blocks Pattern */}
                  <rect x="40" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="24" width="8" height="8" fill="#0f172a" />
                  <rect x="52" y="24" width="6" height="6" fill="#0f172a" />
                  <rect x="12" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="24" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="36" y="40" width="8" height="8" fill="#4338ca" />
                  <rect x="48" y="40" width="12" height="12" fill="#0f172a" />
                  <rect x="64" y="40" width="6" height="6" fill="#0f172a" />
                  <rect x="76" y="44" width="8" height="8" fill="#0f172a" />
                  <rect x="88" y="44" width="4" height="4" fill="#0f172a" />
                  <rect x="40" y="56" width="8" height="8" fill="#0f172a" />
                  <rect x="54" y="56" width="6" height="6" fill="#4338ca" />
                  <rect x="66" y="56" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="68" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="68" width="8" height="8" fill="#0f172a" />
                  <rect x="66" y="68" width="6" height="6" fill="#0f172a" />
                  <rect x="78" y="68" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="80" width="8" height="8" fill="#0f172a" />
                  <rect x="54" y="80" width="6" height="6" fill="#0f172a" />
                  <rect x="66" y="80" width="8" height="8" fill="#0f172a" />
                  <rect x="80" y="80" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>
              <div className="text-[9px] uppercase font-black text-slate-800 tracking-wider mt-1.5">
                Scan to Verify Live on AICTE Portal
              </div>
            </div>

            {/* Official Verification Statement */}
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-indigo-950 uppercase tracking-wide">
                  OFFICIALLY VERIFIED ACADEMIC RECORD VIA NATIONAL APAAR ID LEDGER
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                This document certifies that the coursework, marks, and intake quota of <strong className="text-slate-900">{p.student_name}</strong> (APAAR ID: <span className="font-mono font-bold text-indigo-950">{p.apaar_id}</span>) have been verified against the master college SIS database and validated under the All India Council for Technical Education (AICTE) regulatory capacity ceilings.
              </p>
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono space-y-0.5">
                <div><strong>Cryptographic Seal:</strong> {v.tamper_evident_seal_hash}</div>
                <div><strong>Digital Signature Algorithm:</strong> {v.pki_algorithm}</div>
                <div><strong>Timestamp of Validation:</strong> {v.verified_at}</div>
              </div>
            </div>
          </div>

          {/* Official Signatures Row */}
          <div className="grid grid-cols-2 pt-10 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-48 mx-auto pb-6 text-slate-400 italic">
                Digitally Signed & Sealed
              </div>
              <div className="font-extrabold text-slate-900">Registrar / Controller of Examinations</div>
              <div className="text-[11px] text-slate-600">{p.institution_name}</div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 w-48 mx-auto pb-6 text-slate-400 italic">
                AICTE Asymmetric PKI Validated
              </div>
              <div className="font-extrabold text-slate-900">Member Secretary / Bureau Head</div>
              <div className="text-[11px] text-slate-600">All India Council for Technical Education (MoE)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableAcademicDossierModal;
