import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Award,
  Layers,
  ArrowRight,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Sparkles,
  Printer,
  UserCheck,
  Send,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { consentApi, studentApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import PrintableAcademicDossierModal from '../../components/certificate/PrintableAcademicDossierModal';
import toast from 'react-hot-toast';

export const StakeholderWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>('stk-nta-01');
  const [apaarInput, setApaarInput] = useState<string>('9876-5432-1011');
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  // Academic dossier for printable view
  const [dossier, setDossier] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Reviewer Desk State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewerName, setReviewerName] = useState<string>('Dr. K. S. Rao (Chief Eligibility Officer)');
  const [reviewerVerdict, setReviewerVerdict] = useState<string>('VERIFIED_ELIGIBLE');
  const [reviewerNotes, setReviewerNotes] = useState<string>(
    'Coursework credits, SGPA progression, and approved intake status cross-matched against AICTE national ledger.'
  );
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Background Check Request & Tracking Desk State
  const [bgChecks, setBgChecks] = useState<any[]>([]);
  const [loadingBgChecks, setLoadingBgChecks] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [reqApaar, setReqApaar] = useState<string>('');
  const [reqPurpose, setReqPurpose] = useState<string>('employment_screening');
  const [reqCheckType, setReqCheckType] = useState<string>('Pre-Employment Academic & Enrollment Background Verification');
  const [reqNotes, setReqNotes] = useState<string>('Candidate applied for technical position; statutory degree and intake verification requested.');
  const [isSubmittingReq, setIsSubmittingReq] = useState<boolean>(false);

  const stakeholdersList = [
    { id: 'stk-nta-01', name: 'National Testing Agency (NTA)', type: 'Government Exam Body' },
    { id: 'stk-tcs-02', name: 'Tata Consultancy Services (TCS)', type: 'Corporate Employer' },
    { id: 'stk-infy-03', name: 'Infosys Verification Services', type: 'Corporate Employer' },
    { id: 'stk-firstadv-05', name: 'First Advantage Screening', type: 'Background Verifier' },
  ];

  const loadBgChecks = async () => {
    setLoadingBgChecks(true);
    try {
      const list = await consentApi.getStakeholderBackgroundChecks(selectedStakeholder);
      setBgChecks(list || []);
    } catch (err) {
      console.warn('Failed to load stakeholder background checks:', err);
    } finally {
      setLoadingBgChecks(false);
    }
  };

  const handleQuery = async (e?: React.FormEvent, customApaar?: string) => {
    if (e) e.preventDefault();
    const idToUse = (customApaar || apaarInput).trim();
    if (!idToUse) {
      toast.error('Please enter an APAAR ID to query');
      return;
    }

    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await consentApi.stakeholderQuery(idToUse, selectedStakeholder);
      setQueryResult(res);

      if (res.access_granted) {
        toast.success('Applicant consent verified! Academic records unlocked.');

        // Load academic dossier and previous reviews
        const dosRes = await studentApi.getAcademicDossier(idToUse);
        setDossier(dosRes);

        const revs = await consentApi.getStakeholderReviews(idToUse);
        setReviewsList(revs);
      } else {
        toast.error('Access restricted: Student consent pending');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to verify credential');
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    handleQuery();
    loadBgChecks();
  }, [selectedStakeholder]);

  const handleSendBackgroundCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetId = (reqApaar || apaarInput).trim();
    if (!targetId) {
      toast.error('Target APAAR ID is required');
      return;
    }

    setIsSubmittingReq(true);
    try {
      const currentStk = stakeholdersList.find((s) => s.id === selectedStakeholder);
      const res = await consentApi.createBackgroundCheckRequest({
        apaar_id: targetId,
        stakeholder_id: selectedStakeholder,
        stakeholder_name: currentStk?.name || 'Authorized Stakeholder',
        purpose: reqPurpose,
        check_type: reqCheckType,
        notes: reqNotes,
      });

      toast.success(res.message || 'Background check request dispatched to candidate!');
      setShowRequestModal(false);
      loadBgChecks();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to dispatch background check request');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerNotes.trim()) {
      toast.error('Please enter review remarks');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const currentStk = stakeholdersList.find((s) => s.id === selectedStakeholder);
      const res = await consentApi.submitStakeholderReview({
        apaar_id: apaarInput.trim(),
        stakeholder_id: selectedStakeholder,
        stakeholder_name: currentStk?.name || 'Authorized Stakeholder',
        reviewer_name: reviewerName.trim(),
        verdict: reviewerVerdict,
        review_notes: reviewerNotes.trim(),
      });

      toast.success('Official stakeholder review determination stamped and logged!');
      setReviewsList((prev) => [res.review, ...prev]);
    } catch (err: any) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Top Navigation */}
      <nav className="bg-slate-800/80 border-b border-slate-700/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white shadow-md">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                <span>APAAR Stakeholder Verification Workspace</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  External Verifier Portal
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Authorized Third-Party Academic & Eligibility Verification Gateway
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">
                {user?.full_name || 'Stakeholder Verifier'}
              </div>
              <div className="text-[11px] text-cyan-300 font-mono">
                {stakeholdersList.find((s) => s.id === selectedStakeholder)?.name}
              </div>
            </div>
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
        {/* Privacy Framework Notice */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-cyan-950/60 p-5 shadow-xl">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Consent Gate Active
                </span>
                <span className="text-xs text-slate-300">
                  MoE / AICTE Student Privacy Protection Directive
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By AICTE regulation, student academic records are private by default and accessible <span className="text-amber-200 font-bold">only by the Parent Institution and AICTE</span>. Third-party stakeholders (NTA, recruitments, screening agencies) can view verification details <span className="text-emerald-300 font-bold">ONLY AFTER the applicant grants approval</span> from their APAAR Student Portal.
              </p>
            </div>
          </div>
        </div>

        {/* Stakeholder Selector & APAAR Search Desk */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Acting Stakeholder Identity
              </label>
              <select
                value={selectedStakeholder}
                onChange={(e) => setSelectedStakeholder(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {stakeholdersList.map((stk) => (
                  <option key={stk.id} value={stk.id}>
                    {stk.name} ({stk.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Query Candidate by APAAR ID
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={apaarInput}
                    onChange={(e) => setApaarInput(e.target.value)}
                    placeholder="Enter 12-digit APAAR ID (e.g. DEMO-APAAR-1001)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleQuery()}
                  disabled={queryLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{queryLoading ? 'Verifying...' : 'Verify Credential'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReqApaar(apaarInput);
                    setShowRequestModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Background Check</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
            <span>Try sample demo IDs:</span>
            {['DEMO-APAAR-1001', 'DEMO-APAAR-1002', 'DEMO-APAAR-1003'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setApaarInput(id);
                }}
                className="font-mono text-cyan-300 hover:underline bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Query Result Section */}
        {queryResult && (
          <div className="space-y-6">
            {!queryResult.access_granted ? (
              /* Case A: ACCESS RESTRICTED - Student Consent Pending / Denied */
              <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30 p-6 shadow-xl space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Access Restricted: Consent Not Granted
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Status: {queryResult.consent_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white">
                      Candidate Academic Details Are Shielded Under Privacy Gate
                    </h2>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {queryResult.message}
                    </p>

                    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 max-w-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Masked Student APAAR:</span>
                        <span className="font-mono text-white font-bold">{queryResult.student_identifier_masked}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Default Authorized Entities:</span>
                        <span className="text-emerald-400 font-semibold">Parent Institution & AICTE HQ Only</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Resolution Workflow:</span>
                        <span className="text-indigo-300">
                          Applicant must approve request in their Student Portal
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setReqApaar(apaarInput);
                          setShowRequestModal(true);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md transition flex items-center space-x-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Official Background Check Request to Candidate</span>
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Dispatches consent authorization request to candidate's Student Portal.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Case B: ACCESS GRANTED - Student Consent Approved */
              <div className="space-y-6">
                {/* Authorization & Printable Bar */}
                <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Unlock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs uppercase font-extrabold text-emerald-300 tracking-wider">
                        Applicant Consent Verified
                      </div>
                      <div className="text-base font-bold text-white">
                        Academic Credentials & Documents Unlocked for Verification
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPrintModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Verified Dossier</span>
                    </button>

                    <span className="hidden md:inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      SHA-256 PKI Authenticated
                    </span>
                  </div>
                </div>

                {/* Student Record Card */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                    <div>
                      <h3 className="text-2xl font-extrabold text-white">
                        {queryResult.student?.student_name}
                      </h3>
                      <div className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span>{queryResult.student?.institution_name}</span>
                        <span className="text-slate-500">•</span>
                        <span>{queryResult.student?.program_name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Verified APAAR ID</div>
                      <div className="text-lg font-mono font-bold text-white mt-0.5">
                        {queryResult.student?.apaar_id}
                      </div>
                    </div>
                  </div>

                  {/* Attribute Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Roll / Seat No</div>
                      <div className="font-semibold text-white font-mono mt-0.5">
                        {queryResult.student?.institution_student_id}
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Date of Birth</div>
                      <div className="font-semibold text-white mt-0.5">
                        {queryResult.student?.date_of_birth}
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Branch / Major</div>
                      <div className="font-semibold text-white mt-0.5">
                        {queryResult.student?.branch}
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Admission Cycle</div>
                      <div className="font-semibold text-white mt-0.5">
                        {queryResult.student?.admission_cycle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Documents Grid */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      Verified Academic Transcripts & Government Documents
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {queryResult.academic_documents?.map((doc: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col justify-between space-y-2.5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-white">{doc.doc_type}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0">
                              VERIFIED
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Authority: <span className="text-slate-200">{doc.issuing_authority}</span>
                          </div>
                          <div className="text-xs font-semibold text-emerald-300 mt-1 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>Grade / Status: {doc.grade}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 truncate">
                          Hash: <span className="text-slate-300">{doc.tamper_evident_hash}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STAKEHOLDER REVIEWER DETERMINATION DESK */}
                <div className="bg-slate-800/60 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Reviewer of Stakeholders Determination Desk
                      </h3>
                      <p className="text-xs text-slate-400">
                        Record and stamp official third-party audit determination for this candidate
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-4 bg-slate-900/80 p-5 rounded-xl border border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Reviewing Officer Name & Designation
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Verification Verdict
                        </label>
                        <select
                          value={reviewerVerdict}
                          onChange={(e) => setReviewerVerdict(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="VERIFIED_ELIGIBLE">VERIFIED_ELIGIBLE (All Criteria Satisfied)</option>
                          <option value="DISCREPANCY_FLAGGED">DISCREPANCY_FLAGGED (Under Investigation)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Reviewer Findings & Audit Notes
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="State findings regarding coursework marks, credits, and approved intake compliance."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Determination will be cryptographically hashed and reflected in the candidate's audit log.
                      </span>

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingReview ? 'Signing...' : 'Stamp Official Determination'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Previous Stakeholder Reviews Log */}
                  {reviewsList.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Audit Trail of Review Determinations
                      </h4>
                      <div className="space-y-2.5">
                        {reviewsList.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">
                                {rev.stakeholder_name} — {rev.reviewer_name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {rev.verdict}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px]">"{rev.review_notes}"</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                              <span>Verified: {rev.verified_at}</span>
                              <span className="truncate max-w-xs">Seal: {rev.verification_seal_hash}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BACKGROUND CHECK REQUEST TRACKING DESK */}
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Candidate Background Check Request Tracking Desk
                </h3>
                <p className="text-xs text-slate-400">
                  Track real-time status of verification requests sent to candidates ({stakeholdersList.find(s => s.id === selectedStakeholder)?.name})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={loadBgChecks}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Refresh Tracking Desk"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBgChecks ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setReqApaar(apaarInput);
                  setShowRequestModal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Dispatch New Request</span>
              </button>
            </div>
          </div>

          {bgChecks.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-500">
              No background check requests dispatched yet for this stakeholder. Click "+ Dispatch New Request" or enter an APAAR ID above to send one.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Candidate APAAR</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Verification Scope</th>
                    <th className="px-4 py-3">Requested At</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
                  {bgChecks.map((req) => {
                    const isPending = req.status === 'PENDING_STUDENT_APPROVAL';
                    const isApproved = req.status === 'APPROVED';
                    const isRejected = req.status === 'REJECTED';

                    return (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono text-[11px] text-cyan-300">{req.id}</td>
                        <td className="px-4 py-3 font-mono font-bold text-white">{req.apaar_id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-200">{req.student_name}</td>
                        <td className="px-4 py-3 text-slate-400">
                          <span className="truncate max-w-xs block" title={req.check_type || req.purpose}>
                            {req.check_type || req.purpose}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {new Date(req.requested_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              isApproved
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isRejected
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            }`}
                          >
                            {isApproved
                              ? '✓ Approved by Student'
                              : isRejected
                              ? '✕ Declined'
                              : '⏳ Pending Student Approval'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => {
                                setApaarInput(req.apaar_id);
                                handleQuery(undefined, req.apaar_id);
                                window.scrollTo({ top: 180, behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition inline-flex items-center space-x-1"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Inspect Records</span>
                            </button>
                          ) : isPending ? (
                            <span className="text-[11px] text-amber-400/80 italic">Awaiting Consent</span>
                          ) : (
                            <span className="text-[11px] text-rose-400/80 italic">Access Denied</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Printable Official Dossier Modal */}
      {dossier && (
        <PrintableAcademicDossierModal
          dossier={dossier}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Dispatch Background Check Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dispatch Background Check Request</h3>
                  <p className="text-xs text-slate-400">
                    Sends an official verification consent request to the candidate
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBackgroundCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Candidate APAAR ID *
                </label>
                <input
                  type="text"
                  required
                  value={reqApaar}
                  onChange={(e) => setReqApaar(e.target.value)}
                  placeholder="e.g. 9876-5432-1011"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Verification Scope / Check Type *
                </label>
                <select
                  value={reqCheckType}
                  onChange={(e) => setReqCheckType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Pre-Employment Academic & Enrollment Background Verification">
                    Pre-Employment Academic & Enrollment Background Verification
                  </option>
                  <option value="National Entrance Exam & Eligibility Check">
                    National Entrance Exam & Eligibility Check
                  </option>
                  <option value="Postgraduate Admission Credential Screening">
                    Postgraduate Admission Credential Screening
                  </option>
                  <option value="Comprehensive 4-Year Transcript & Degree Audit">
                    Comprehensive 4-Year Transcript & Degree Audit
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Purpose Category *
                </label>
                <select
                  value={reqPurpose}
                  onChange={(e) => setReqPurpose(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="employment_screening">Employment Screening</option>
                  <option value="exam_registration">Exam Registration & Eligibility</option>
                  <option value="higher_studies">Higher Studies / University Admission</option>
                  <option value="regulatory_compliance">Regulatory Compliance Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Request Notes & Reference *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Provide reference or statutory reason for background check..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReq ? 'Dispatching...' : 'Dispatch Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakeholderWorkspace;
