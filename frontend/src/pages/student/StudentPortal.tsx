import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Key,
  Lock,
  FileText,
  Building2,
  RefreshCw,
  ExternalLink,
  Edit3,
  AlertCircle,
  Copy,
  Check,
  Award,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { consentApi, studentApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import PrintableAcademicDossierModal from '../../components/certificate/PrintableAcademicDossierModal';
import toast from 'react-hot-toast';

interface StakeholderRequest {
  stakeholder_id: string;
  stakeholder_name: string;
  entity_type: string;
  purpose: string;
  contact_email: string;
  status: 'approved' | 'rejected' | 'pending';
  permitted_fields: string[];
}

interface StakeholderReview {
  id: string;
  apaar_id: string;
  student_name: string;
  stakeholder_name: string;
  reviewer_name: string;
  verdict: string;
  review_notes: string;
  verified_at: string;
  verification_seal_hash: string;
}

interface CorrectionWorkflowItem {
  id: string;
  student_name: string;
  field_name: string;
  original_value: string;
  proposed_value: string;
  stage: string; // student_submitted, institution_endorsed, aicte_approved
  workflow_status: string;
  operator_notes: string;
  inst_admin_notes?: string;
  aicte_reviewer_notes?: string;
  created_at: string;
}

export const StudentPortal: React.FC = () => {
  const { logout } = useAuth();
  const [apaarId, setApaarId] = useState<string>('DEMO-APAAR-1001');
  const [studentData, setStudentData] = useState<any>({
    student_name: 'Aarav Sharma',
    apaar_id: 'DEMO-APAAR-1001',
    roll_no: 'DSCE-2023-CSE-042',
    date_of_birth: '2005-04-12',
    gender: 'Male',
    institution_name: 'Dayananda Sagar College of Engineering',
    program_name: 'Bachelor of Technology (B.Tech)',
    branch: 'Computer Science and Engineering',
    admission_cycle: '2026-27',
    admission_category: 'general',
    identity_verification_status: 'verified',
    record_status: 'accepted',
  });

  const [dossier, setDossier] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<number>(1);

  const [requests, setRequests] = useState<StakeholderRequest[]>([]);
  const [reviews, setReviews] = useState<StakeholderReview[]>([]);
  const [correctionWorkflows, setCorrectionWorkflows] = useState<CorrectionWorkflowItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [copiedApaar, setCopiedApaar] = useState<boolean>(false);

  // Raise Correction Request Modal / Form
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [fieldToUpdate, setFieldToUpdate] = useState<string>('student_name');
  const [newValue, setNewValue] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState<boolean>(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Fetch student profile, academic dossier, requests, reviews, and workflows
  const loadAllData = async () => {
    setLoadingData(true);
    try {
      // 1. Student profile
      const searchRes = await studentApi.searchInspector(apaarId);
      if (searchRes && searchRes.length > 0) {
        setStudentData(searchRes[0]);
      }

      // 2. Comprehensive Academic Dossier (courses taken and studied till now)
      const dosRes = await studentApi.getAcademicDossier(apaarId);
      if (dosRes) {
        setDossier(dosRes);
      }

      // 3. Stakeholder Consent Requests
      const reqRes = await consentApi.getStudentRequests(apaarId);
      if (reqRes && reqRes.requests) {
        setRequests(reqRes.requests);
      }

      // 4. Stakeholder Reviewer Determinations
      const revRes = await consentApi.getStakeholderReviews(apaarId);
      if (revRes) {
        setReviews(revRes);
      }

      // 5. Multi-Stage Correction Workflows
      const wfRes = await studentApi.getCorrectionRequests({ apaar_id: apaarId });
      if (wfRes) {
        setCorrectionWorkflows(wfRes);
      }
    } catch (e) {
      console.warn('Error loading student portal data:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [apaarId]);

  const handleCopyApaar = () => {
    navigator.clipboard.writeText(studentData.apaar_id || apaarId);
    setCopiedApaar(true);
    toast.success('APAAR ID copied to clipboard');
    setTimeout(() => setCopiedApaar(false), 2000);
  };

  const handleConsentDecision = async (stakeholderId: string, decision: 'approved' | 'rejected') => {
    setDecidingId(stakeholderId);
    try {
      await consentApi.decideStudentConsent({
        apaar_id: studentData.apaar_id || apaarId,
        stakeholder_id: stakeholderId,
        decision,
      });
      toast.success(
        decision === 'approved'
          ? 'Access Granted! Stakeholder can now verify academic credentials.'
          : 'Access Denied! Stakeholder cannot access your record.'
      );
      setRequests((prev) =>
        prev.map((r) => (r.stakeholder_id === stakeholderId ? { ...r, status: decision } : r))
      );
    } catch (e: any) {
      toast.error('Failed to submit consent decision');
    } finally {
      setDecidingId(null);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !correctionReason.trim()) {
      toast.error('Please enter the updated value and explanation');
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      const res = await studentApi.raiseCorrection({
        student_id: studentData.id || '00000000-0000-0000-0000-000000000000',
        field_to_update: fieldToUpdate,
        new_value: newValue.trim(),
        reason: correctionReason.trim(),
      });

      toast.success(
        'Step 1 Complete: Change request submitted! Undergoing 3-stage verification (Student -> Institution -> AICTE).'
      );

      setShowCorrectionModal(false);
      setNewValue('');
      setCorrectionReason('');

      // Reload workflows
      const wfRes = await studentApi.getCorrectionRequests({ apaar_id: apaarId });
      if (wfRes) {
        setCorrectionWorkflows(wfRes);
      }
    } catch (e: any) {
      toast.error('Failed to submit change request');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Helper to advance the approval workflow step-by-step
  const handleInstitutionEndorse = async (wfId: string) => {
    setAdvancingId(wfId);
    try {
      await studentApi.institutionEndorseCorrection(
        wfId,
        'College Registrar verified supporting document against campus physical admission ledger. Recommended for AICTE approval.'
      );
      toast.success('Step 2 Complete: College Registrar endorsed request! Escalated to AICTE Central Review Desk.');
      const wfRes = await studentApi.getCorrectionRequests({ apaar_id: apaarId });
      if (wfRes) setCorrectionWorkflows(wfRes);
    } catch (e) {
      toast.error('Failed to endorse request');
    } finally {
      setAdvancingId(null);
    }
  };

  const handleAICTEApprove = async (wfId: string) => {
    setAdvancingId(wfId);
    try {
      const res = await studentApi.aicteApproveCorrection(
        wfId,
        'AICTE Central Regulatory Bureau granted official approval. Synchronized into National APAAR Registry.'
      );
      toast.success('Step 3 Complete: AICTE officially approved & synchronized into National Registry!');
      
      // Update student profile state
      if (res.updated_student) {
        setStudentData((prev: any) => ({
          ...prev,
          ...res.updated_student,
          record_status: 'corrected',
        }));
      }

      const wfRes = await studentApi.getCorrectionRequests({ apaar_id: apaarId });
      if (wfRes) setCorrectionWorkflows(wfRes);
      loadAllData();
    } catch (e) {
      toast.error('Failed to approve request');
    } finally {
      setAdvancingId(null);
    }
  };

  const currentSemester = dossier?.semester_coursework?.find(
    (s: any) => s.semester_number === selectedSemesterTab
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Top Navbar */}
      <nav className="bg-slate-800/80 border-b border-slate-700/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                <span>APAAR Student Credential Portal</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  One Nation One Student ID
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Ministry of Education & AICTE Unified Academic Locker
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Dossier</span>
            </button>

            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Main Profile & APAAR Card */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck className="w-64 h-64 text-indigo-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DIGITALLY VERIFIED APAAR CREDENTIAL</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  RS256 PKI SEALED
                </span>
                {studentData.record_status === 'corrected' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    AICTE APPROVED & SYNCHRONIZED
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  {studentData.student_name}
                </h1>
                <p className="text-sm text-indigo-200 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>{studentData.institution_name}</span>
                  <span className="text-slate-500">•</span>
                  <span>{studentData.branch || studentData.program_name}</span>
                </p>
              </div>

              {/* Metadata chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Roll Number</div>
                  <div className="font-semibold text-white mt-0.5 font-mono">{studentData.roll_no || 'DSCE-2023-CSE-042'}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Cumulative CGPA</div>
                  <div className="font-extrabold text-amber-300 mt-0.5 font-mono text-sm">9.28 / 10.0</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Credits Earned</div>
                  <div className="font-semibold text-white mt-0.5 font-mono">111.5 / 160 ABC</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Semester</div>
                  <div className="font-semibold text-emerald-300 mt-0.5">Semester VI (Active)</div>
                </div>
              </div>
            </div>

            {/* APAAR ID Card Box */}
            <div className="shrink-0 bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between min-w-[280px]">
              <div>
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-400 flex items-center justify-between">
                  <span>Unified APAAR Identifier</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-wider mt-2">
                  {studentData.apaar_id || apaarId}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  National Academic Registry Ledger
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopyApaar}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
                >
                  {copiedApaar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedApaar ? 'Copied' : 'Copy ID'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Raise Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Academic Database & Coursework Ledger (What He Studied Till Now) */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Academic Database & Coursework Ledger (Using APAAR ID)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Complete verifiable course history: Pre-University records and undergraduate coursework from Semester 1 through Semester 6.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Transcript</span>
            </button>
          </div>

          {/* Pre-University High School Foundations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dossier?.pre_university_records?.map((pre: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{pre.qualification}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {pre.overall_percentage} (Distinction)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {pre.issuing_board} • Passing Year: {pre.year_of_passing}
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800 text-[10px]">
                  {pre.subjects?.map((sub: any, j: number) => (
                    <div key={j} className="flex justify-between bg-slate-800/80 px-2 py-1 rounded text-slate-300">
                      <span>{sub.name}</span>
                      <span className="font-bold text-white">{sub.marks_obtained}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Semester Tabs */}
          <div className="pt-2">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Undergraduate Semester Coursework (B.Tech CSE)
              </span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedSemesterTab(num)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedSemesterTab === num
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Sem {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Courses Table for Selected Semester */}
            {currentSemester ? (
              <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/90">
                <div className="p-3 bg-slate-800/70 border-b border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    Semester {currentSemester.semester_number} ({currentSemester.academic_year})
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-300">Credits: <strong className="text-white">{currentSemester.credits_earned}</strong></span>
                    <span className="text-slate-300">SGPA: <strong className="text-amber-400 font-mono">{currentSemester.sgpa.toFixed(2)}</strong></span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {currentSemester.status}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-3 py-2 w-28">Course Code</th>
                      <th className="px-3 py-2">Course Title</th>
                      <th className="px-3 py-2 w-36">Classification</th>
                      <th className="px-3 py-2 text-center w-16">Credits</th>
                      <th className="px-3 py-2 text-center w-16">Grade</th>
                      <th className="px-3 py-2 text-center w-20">Marks %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {currentSemester.courses?.map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-mono font-bold text-indigo-300">{c.code}</td>
                        <td className="px-3 py-2 font-medium text-white">{c.title}</td>
                        <td className="px-3 py-2 text-slate-400 text-[11px]">{c.category}</td>
                        <td className="px-3 py-2 text-center font-mono">{c.credits.toFixed(1)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                            {c.grade}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono">{c.marks_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>

        {/* SECTION 2: Multi-Stage Change Request Workflow (Student -> Institution -> AICTE) */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  APAAR Change Request Lifecycle (3-Stage Approval Governance)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Any correction undergoes mandatory multi-party approval: <span className="text-indigo-300 font-semibold">1. Student Submits</span> → <span className="text-amber-300 font-semibold">2. Institution Endorses</span> → <span className="text-emerald-300 font-semibold">3. AICTE Regulatory Approval</span> before syncing into the National Registry.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCorrectionModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Raise New Correction</span>
            </button>
          </div>

          {correctionWorkflows.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-500">
              No active change requests for this APAAR record. Use "Raise New Correction" above to submit a change.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {correctionWorkflows.map((wf) => {
                const isSubmitted = wf.stage === 'student_submitted';
                const isEndorsed = wf.stage === 'institution_endorsed';
                const isApproved = wf.stage === 'aicte_approved';

                return (
                  <div
                    key={wf.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/90 space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-white">
                          Requested Modification: <span className="text-indigo-300 uppercase font-mono">{wf.field_name}</span>
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Old Value: <span className="line-through text-rose-400">{wf.original_value || 'None'}</span> → New Proposed Value: <span className="font-bold text-emerald-400">{wf.proposed_value}</span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isEndorsed
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {isApproved
                          ? 'AICTE Approved & Synchronized'
                          : isEndorsed
                          ? 'Institution Endorsed (Pending AICTE)'
                          : 'Student Submitted (Pending Institution)'}
                      </span>
                    </div>

                    {/* 3-Stage Visual Stepper */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Step 1 */}
                      <div className={`p-3 rounded-xl border ${isSubmitted || isEndorsed || isApproved ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                        <div className="flex items-center space-x-2 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>1. Student Submitted</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{wf.operator_notes}</p>
                      </div>

                      {/* Step 2 */}
                      <div className={`p-3 rounded-xl border ${isEndorsed || isApproved ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                        <div className="flex items-center space-x-2 text-xs font-bold">
                          {isEndorsed || isApproved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                          <span>2. College Endorsed</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {wf.inst_admin_notes || 'Pending College Registrar review against campus records.'}
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-3 rounded-xl border ${isApproved ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                        <div className="flex items-center space-x-2 text-xs font-bold">
                          {isApproved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-500" />
                          )}
                          <span>3. AICTE National Approval</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {wf.aicte_reviewer_notes || 'Pending final determination by AICTE Central Regulatory Desk.'}
                        </p>
                      </div>
                    </div>

                    {/* Step Advancement Buttons for Demonstration / Immediate Action */}
                    {!isApproved && (
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                        {isSubmitted && (
                          <button
                            type="button"
                            disabled={advancingId === wf.id}
                            onClick={() => handleInstitutionEndorse(wf.id)}
                            className="px-3 py-1.5 rounded-lg font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition disabled:opacity-50"
                          >
                            <span>Simulate College Registrar Endorsement →</span>
                          </button>
                        )}
                        {isEndorsed && (
                          <button
                            type="button"
                            disabled={advancingId === wf.id}
                            onClick={() => handleAICTEApprove(wf.id)}
                            className="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition disabled:opacity-50"
                          >
                            <span>Grant AICTE Final Regulatory Approval & Sync →</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Reviewer of Stakeholders (Audit Determinations Log) */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Official Reviewer of Stakeholders (Verification Audit Log)
              </h2>
              <p className="text-xs text-slate-400">
                Official verification audit determinations stamped by external agency reviewers (NTA, TCS, etc.)
              </p>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-500">
              No stakeholder reviews recorded yet. Stakeholders will record determinations here once consent is granted.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{rev.stakeholder_name}</span>
                      <span className="text-xs text-indigo-300 font-semibold">• {rev.reviewer_name}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {rev.verdict}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                    "{rev.review_notes}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-2">
                    <span>Audit Stamp: {rev.verified_at}</span>
                    <span className="truncate max-w-sm">Seal: {rev.verification_seal_hash}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Privacy Consent Gate (Stakeholder Verification Requests) */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Stakeholder Credential Access Requests (Your Consent Gate)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Default access to your academic records is strictly locked to your College and AICTE. External agencies can <span className="text-amber-300 font-semibold">ONLY verify your records if you approve their request below</span>.
              </p>
            </div>

            <button
              onClick={loadAllData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Refresh All"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {requests.map((req) => {
              const isApproved = req.status === 'approved';
              const isRejected = req.status === 'rejected';
              const isBusy = decidingId === req.stakeholder_id;

              return (
                <div
                  key={req.stakeholder_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isApproved
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isRejected
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-slate-900/80 border-slate-700/80'
                  } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{req.stakeholder_name}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {req.entity_type}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status === 'approved'
                          ? 'Access Authorized'
                          : req.status === 'rejected'
                          ? 'Access Denied'
                          : 'Consent Pending'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400 font-semibold">Purpose:</span> {req.purpose}
                    </div>

                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                      <span>Requested Scope:</span>
                      {req.permitted_fields.map((f) => (
                        <span key={f} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy || isApproved}
                      onClick={() => handleConsentDecision(req.stakeholder_id, 'approved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        isApproved
                          ? 'bg-emerald-600/30 text-emerald-400 cursor-default border border-emerald-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      } disabled:opacity-50`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isApproved ? 'Approved' : 'Approve Access'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy || isRejected}
                      onClick={() => handleConsentDecision(req.stakeholder_id, 'rejected')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        isRejected
                          ? 'bg-rose-600/30 text-rose-400 cursor-default border border-rose-500/40'
                          : 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700'
                      } disabled:opacity-50`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isRejected ? 'Denied' : 'Deny / Revoke'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Raise Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Raise APAAR Correction Request</h3>
                  <p className="text-xs text-slate-400">
                    Will initiate 3-stage governance (Student → Institution → AICTE Approval)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Field Requiring Correction
                </label>
                <select
                  value={fieldToUpdate}
                  onChange={(e) => setFieldToUpdate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="student_name">Full Name (as per Matriculation)</option>
                  <option value="date_of_birth">Date of Birth (YYYY-MM-DD)</option>
                  <option value="admission_category">Admission Category / Quota</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Correct / New Value
                </label>
                <input
                  type="text"
                  required
                  placeholder={fieldToUpdate === 'date_of_birth' ? '2005-04-12' : 'Enter correct details'}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Reason for Change & Document Proof Reference
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Spelling discrepancy between Aadhaar card and campus records. Class X matriculation certificate submitted as supporting evidence."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300">
                Workflow Notice: After submission, your College Registrar will endorse the request, and AICTE Central Headquarters will adjudicate and synchronize the update into the National Registry.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorrection}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingCorrection ? 'Submitting...' : 'Submit to Multi-Stage Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Official Dossier Modal with Scannable QR Code */}
      {dossier && (
        <PrintableAcademicDossierModal
          dossier={dossier}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

export default StudentPortal;
