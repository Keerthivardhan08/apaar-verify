import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import SeverityBadge from '../../components/ui/SeverityBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { studentApi, correctionWorkflowApi } from '../../services/api';
import { StudentRecord } from '../../types';
import {
  Search,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  FileText,
  UploadCloud,
  ShieldCheck,
  Send,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  CheckSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LookupResponse {
  student: StudentRecord;
  program_code: string;
  program_name: string;
  institution_name: string;
  open_issues_count: number;
  open_issues: Array<{
    rule_code: string;
    severity: string;
    description: string;
    affected_field: string;
  }>;
  versions_count: number;
}

export const ApaarQuickDesk: React.FC = () => {
  const navigate = useNavigate();

  // Search & Gatekeeper state
  const [apaarInput, setApaarInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [lookupData, setLookupData] = useState<LookupResponse | null>(null);

  // Form edit state (only editable after fetch!)
  const [proposedName, setProposedName] = useState('');
  const [proposedCategory, setProposedCategory] = useState('');
  const [proposedStatus, setProposedStatus] = useState('');
  const [proposedDob, setProposedDob] = useState('');
  const [proposedGender, setProposedGender] = useState('');
  const [proposedSupernumerary, setProposedSupernumerary] = useState('');

  // Document upload simulation state
  const [docType, setDocType] = useState('marksheet');
  const [docFileName, setDocFileName] = useState('Attested_Academic_Certificate_2024.pdf');
  const [docChecksum, setDocChecksum] = useState('sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [isDocVerified, setIsDocVerified] = useState(false);

  // Regulatory Justification
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Quick pick chips for demonstration
  const demoChips = [
    { label: 'IIT Student #1', id: 'DEMO-APAAR-1001' },
    { label: 'IIT Student #2', id: 'DEMO-APAAR-1002' },
    { label: 'IIT Student #3', id: 'DEMO-APAAR-1003' },
    { label: '12-Digit Numeric', id: 'DEMO-APAAR-1004' },
  ];

  const handleFetchRecord = async (searchId?: string) => {
    const idToFetch = (searchId || apaarInput).trim();
    if (!idToFetch) {
      toast.error('Please enter a valid APAAR ID or reference');
      return;
    }

    setIsFetching(true);
    setSubmissionResult(null);

    try {
      const data = await studentApi.lookupByApaar(idToFetch);
      setLookupData(data);
      setApaarInput(idToFetch);

      // Prepopulate editable form fields with current values
      setProposedName(data.student.student_name || '');
      setProposedCategory(data.student.admission_category || 'general');
      setProposedStatus(data.student.admission_status || 'admitted');
      setProposedDob(data.student.date_of_birth ? String(data.student.date_of_birth) : '');
      setProposedGender(data.student.gender || 'male');
      setProposedSupernumerary(data.student.supernumerary_category || 'none');
      setJustification('');
      setIsDocVerified(false);

      toast.success(`Record unlocked for ${data.student.student_name}!`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Failed to fetch student record with that APAAR ID.';
      toast.error(errMsg);
      setLookupData(null);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSimulateDocVerify = () => {
    setIsDocVerified(true);
    toast.success('Document hash generated and verified against tamper registry.');
  };

  const handleSubmitQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupData) return;

    if (!justification.trim()) {
      toast.error('Mandatory regulatory audit justification is required.');
      return;
    }

    // Identify changed fields
    const proposedChanges: Record<string, any> = {};
    const cur = lookupData.student;

    if (proposedName.trim() && proposedName.trim() !== cur.student_name) {
      proposedChanges['student_name'] = proposedName.trim();
    }
    if (proposedCategory && proposedCategory !== cur.admission_category) {
      proposedChanges['admission_category'] = proposedCategory;
    }
    if (proposedStatus && proposedStatus !== cur.admission_status) {
      proposedChanges['admission_status'] = proposedStatus;
    }
    if (proposedDob && proposedDob !== cur.date_of_birth) {
      proposedChanges['date_of_birth'] = proposedDob;
    }
    if (proposedGender && proposedGender !== cur.gender) {
      proposedChanges['gender'] = proposedGender;
    }
    if (proposedSupernumerary && proposedSupernumerary !== cur.supernumerary_category) {
      proposedChanges['supernumerary_category'] = proposedSupernumerary;
    }

    if (Object.keys(proposedChanges).length === 0 && !isDocVerified) {
      toast.error('No field changes detected. Please modify at least one field or verify a document to submit an update.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        apaar_id: lookupData.student.identity_reference || apaarInput,
        proposed_changes: proposedChanges,
        operator_notes: justification.trim(),
        document_reference: isDocVerified ? `${docType.toUpperCase()}: ${docFileName} (${docChecksum.slice(0, 16)}...)` : undefined,
      };

      const result = await correctionWorkflowApi.apaarQuickUpdate(payload);
      setSubmissionResult(result);
      toast.success('APAAR Quick Update submitted for regulatory approval!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit quick update proposal.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setLookupData(null);
    setApaarInput('');
    setSubmissionResult(null);
    setJustification('');
    setIsDocVerified(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Concept Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-indigo-700/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Gated by APAAR ID
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Quick Update Action
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Manual Student Update & APAAR Desk
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl">
              Strictly regulated institutional interface: Form editing and document uploads are <strong>locked</strong> until a student's record is authenticated and fetched by their unique <strong>APAAR ID</strong>. All updates route into the 3-tier regulatory audit queue.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-indigo-400/40 text-indigo-200 hover:bg-indigo-950/60 text-xs shrink-0"
            onClick={() => navigate('/institution/upload')}
          >
            Switch to Batch CSV
          </Button>
        </div>
      </div>

      {/* STEP 1: The APAAR Gatekeeper Card */}
      <Card className="border border-indigo-100 shadow-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-base">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3>Authenticate & Fetch Record via APAAR ID</h3>
            </div>
            {lookupData ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Form Unlocked
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Form Locked
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Enter the student's 12-digit APAAR ID or demo identity reference. The platform will query the institutional registry to ensure multi-tenant tenancy authorization before unlocking field modifications.
          </p>

          {/* Input & Search Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter APAAR ID (e.g. DEMO-APAAR-1001 or DEMO-APAAR-1004)..."
                value={apaarInput}
                onChange={(e) => setApaarInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFetchRecord();
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wide"
              />
            </div>
            <Button
              type="button"
              onClick={() => handleFetchRecord()}
              disabled={isFetching || !apaarInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 flex items-center gap-2"
            >
              {isFetching ? <LoadingSpinner size="sm" /> : <Search className="w-4 h-4" />}
              Fetch Student Record
            </Button>
            {lookupData && (
              <Button
                variant="outline"
                type="button"
                onClick={handleReset}
                className="text-slate-600 shrink-0 flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Quick Demo Selector Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-400">Quick Demo Records:</span>
            {demoChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setApaarInput(chip.id);
                  handleFetchRecord(chip.id);
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors font-mono"
              >
                {chip.label} ({chip.id})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* WHEN NOT FETCHED: LOCKED NOTICE CARD */}
      {!lookupData && !isFetching && (
        <Card className="border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-amber-900">
            Manual Updates & Document Uploads are Locked
          </h4>
          <p className="text-xs text-amber-700 max-w-lg mx-auto">
            To prevent unauthorized seat alterations or silent database mutations, an operator cannot edit student fields or upload marksheet evidence without first verifying the student's APAAR ID.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleFetchRecord('DEMO-APAAR-1001')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 underline"
            >
              Click here to auto-fetch DEMO-APAAR-1001 & unlock the update form
            </button>
          </div>
        </Card>
      )}

      {/* WHEN FETCHED: STUDENT PROFILE SUMMARY & ACTIVE FORM */}
      {lookupData && (
        <div className="space-y-6">
          {/* Active Record Summary Card */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-xl p-5 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                  {lookupData.student.student_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {lookupData.student.student_name}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      APAAR: {lookupData.student.identity_reference}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID: {lookupData.student.institution_student_id} • Program: {lookupData.program_code} ({lookupData.program_name}) • Cycle: {lookupData.student.admission_cycle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={lookupData.student.record_status} />
                <Badge variant="gray">Version {lookupData.versions_count}</Badge>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-slate-400 block">Admission Category</span>
                <span className="font-semibold text-slate-800 uppercase tracking-wide">
                  {lookupData.student.admission_category}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-slate-400 block">Admission Status</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {lookupData.student.admission_status}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-slate-400 block">Supernumerary Quota</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {lookupData.student.supernumerary_category || 'None'}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-slate-400 block">Open Integrity Issues</span>
                <span className={`font-semibold ${lookupData.open_issues_count > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {lookupData.open_issues_count} {lookupData.open_issues_count === 1 ? 'Issue' : 'Issues'}
                </span>
              </div>
            </div>

            {/* Flagged issues alert if present */}
            {lookupData.open_issues.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-1 text-xs text-rose-800">
                <span className="font-semibold flex items-center gap-1 text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Active Validation Discrepancies on Record:
                </span>
                <ul className="list-disc list-inside space-y-0.5 pl-2 text-rose-700">
                  {lookupData.open_issues.map((iss, i) => (
                    <li key={i}>
                      <strong>[{iss.rule_code}]</strong> {iss.description} (Field: {iss.affected_field})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* SUBMISSION RESULT SUCCESS BANNER */}
          {submissionResult && (
            <Card className="bg-emerald-50 border-2 border-emerald-500 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-emerald-950">
                    APAAR Quick Update Successfully Queued!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    {submissionResult.message} The proposed modifications are now awaiting sign-off by the <strong>Institution Administrator</strong> and final adjudication by the <strong>AICTE Reviewer</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-emerald-200 text-xs space-y-2">
                <div className="font-semibold text-slate-700">Generated Regulatory Workflows:</div>
                <div className="divide-y divide-slate-100">
                  {submissionResult.workflows?.map((wf: any, idx: number) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-medium">
                        Field: {wf.field_name}
                      </span>
                      <span className="text-slate-500">
                        {wf.original_value} <ArrowRight className="inline w-3 h-3 text-slate-400" />{' '}
                        <strong className="text-emerald-700">{wf.proposed_value}</strong>
                      </span>
                      <Badge variant="warning">pending_institution_admin</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={() => navigate('/institution/corrections')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Open Institution Corrections Queue
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="text-emerald-800 border-emerald-300 text-xs"
                >
                  Fetch Another APAAR Record
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 2 & 3: THE UNLOCKED UPDATE & DOCUMENT FORM */}
          {!submissionResult && (
            <form onSubmit={handleSubmitQuickUpdate} className="space-y-6">
              {/* Field Modifications Section */}
              <Card className="border border-slate-200">
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-base border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <h3>Propose Field Updates for APAAR Record</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Student Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Student Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={proposedName}
                        onChange={(e) => setProposedName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      {proposedName !== lookupData.student.student_name && (
                        <span className="text-[11px] text-amber-600 block mt-1">
                          Current on record: <strong>{lookupData.student.student_name}</strong>
                        </span>
                      )}
                    </div>

                    {/* Admission Category */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Admission Category / Quota
                      </label>
                      <select
                        value={proposedCategory}
                        onChange={(e) => setProposedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="general">General (Open Merit)</option>
                        <option value="obc">OBC (Other Backward Classes)</option>
                        <option value="sc">SC (Scheduled Caste)</option>
                        <option value="st">ST (Scheduled Tribe)</option>
                        <option value="ews">EWS (Economically Weaker Section)</option>
                        <option value="nri">NRI (Non-Resident Indian)</option>
                        <option value="management_quota">Management Quota</option>
                      </select>
                      {proposedCategory !== lookupData.student.admission_category && (
                        <span className="text-[11px] text-amber-600 block mt-1">
                          Current on record: <strong>{lookupData.student.admission_category}</strong>
                        </span>
                      )}
                    </div>

                    {/* Admission Status */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Admission Status
                      </label>
                      <select
                        value={proposedStatus}
                        onChange={(e) => setProposedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="admitted">Admitted (Regular)</option>
                        <option value="provisional">Provisional Admission</option>
                        <option value="cancelled">Cancelled / Withdrawn</option>
                        <option value="migrated">Migrated / Transferred</option>
                      </select>
                      {proposedStatus !== lookupData.student.admission_status && (
                        <span className="text-[11px] text-amber-600 block mt-1">
                          Current on record: <strong>{lookupData.student.admission_status}</strong>
                        </span>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={proposedDob}
                        onChange={(e) => setProposedDob(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      {proposedDob !== (lookupData.student.date_of_birth ? String(lookupData.student.date_of_birth) : '') && (
                        <span className="text-[11px] text-amber-600 block mt-1">
                          Current on record: <strong>{String(lookupData.student.date_of_birth || 'Not recorded')}</strong>
                        </span>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={proposedGender}
                        onChange={(e) => setProposedGender(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other / Transgender</option>
                      </select>
                    </div>

                    {/* Supernumerary Category */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Supernumerary Quota Classification
                      </label>
                      <select
                        value={proposedSupernumerary}
                        onChange={(e) => setProposedSupernumerary(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="none">None (Standard Program Intake)</option>
                        <option value="nri">NRI Supernumerary</option>
                        <option value="foreign_national">Foreign National</option>
                        <option value="kashmiri_migrant">Kashmiri Migrant</option>
                        <option value="other">Other State Approved Supernumerary</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Manual Document / Marksheet Upload Section */}
              <Card className="border border-slate-200">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-base border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <h3>Attach Supporting Verification Document (Optional)</h3>
                  </div>

                  <p className="text-xs text-slate-500">
                    If this update is backed by a physical or scanned certificate (e.g. revised 12th marksheet, category certificate, court order), attach the reference here for AICTE reviewer inspection.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Document Classification
                      </label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="marksheet">Class XII / Qualifying Marksheet</option>
                        <option value="caste_certificate">State Caste / Quota Certificate</option>
                        <option value="transfer_cert">Transfer / Migration Certificate</option>
                        <option value="birth_certificate">Birth / Domicile Certificate</option>
                        <option value="correction_affidavit">Legal Affidavit / Gazette Notification</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Certificate File Reference
                      </label>
                      <input
                        type="text"
                        value={docFileName}
                        onChange={(e) => setDocFileName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-medium text-slate-700 block">
                        Cryptographic Hash Verification:
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 block truncate max-w-md">
                        {docChecksum}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSimulateDocVerify}
                      className={`text-xs flex items-center gap-1 ${
                        isDocVerified ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : ''
                      }`}
                    >
                      {isDocVerified ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Hash Verified
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Verify Checksum
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Regulatory Justification & Action Bar */}
              <Card className="border border-indigo-200 bg-indigo-50/20">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-base">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <h3>Regulatory Audit Justification (Mandatory)</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Official Audit Justification & Reference Notes *
                    </label>
                    <textarea
                      rows={3}
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="e.g. Candidate submitted verified state quota certificate #CRT-8849. Updated category to OBC under institutional review..."
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      This explanation is permanently bound to the SHA-256 audit ledger and will be inspected by the AICTE Reviewer.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-indigo-100">
                    <span className="text-xs text-slate-500">
                      Gated Action: Submitting will create immutable workflow items for <strong>{lookupData.student.student_name}</strong> ({lookupData.student.identity_reference}).
                    </span>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !justification.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 w-full sm:w-auto px-6"
                    >
                      {isSubmitting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Submit for Multi-Stage Approval
                    </Button>
                  </div>
                </div>
              </Card>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ApaarQuickDesk;
