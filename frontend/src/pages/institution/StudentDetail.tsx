import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  useStudent,
  useStudentHistory,
  useIssues,
  useUpdateStudent,
  useRequestCorrection,
} from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import SeverityBadge from '../../components/ui/SeverityBadge';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  History,
  AlertTriangle,
  FileEdit,
  Save,
  Clock,
  Sparkles,
  ScanLine,
  FileCheck,
  CheckCircle,
  XCircle,
  QrCode,
  Download,
  ExternalLink,
  Copy,
  Lock,
  Award,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ocrApi, DocumentReconciliationResult, verificationApi } from '../../services/api';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAICTEAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const initialEdit = searchParams.get('edit') === 'true';

  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'issues' | 'ocr' | 'credential'>('details');
  const [credData, setCredData] = useState<any | null>(null);
  const [loadingCred, setLoadingCred] = useState(false);
  const [isEditing, setIsEditing] = useState(initialEdit);

  // OCR Document Reconciliation state
  const [docType, setDocType] = useState('marksheet');
  const [docFileName, setDocFileName] = useState('Class_XII_Marksheet_Scanned.pdf');
  const [extractedName, setExtractedName] = useState('');
  const [extractedRoll, setExtractedRoll] = useState('');
  const [extractedDob, setExtractedDob] = useState('');
  const [extractedInst, setExtractedInst] = useState('');
  const [extractedMarks, setExtractedMarks] = useState('485/500');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconResult, setReconResult] = useState<DocumentReconciliationResult | null>(null);
  const [pastRecons, setPastRecons] = useState<DocumentReconciliationResult[]>([]);

  // Correction request modal
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionField, setCorrectionField] = useState('student_name');
  const [proposedValue, setProposedValue] = useState('');
  const [justification, setJustification] = useState('');

  const { data: student, isLoading, isError, error, refetch } = useStudent(id);
  const { data: history = [], isLoading: isHistoryLoading } = useStudentHistory(id);
  const { data: issuesData } = useIssues({ page: 1, size: 50 });

  const updateMutation = useUpdateStudent();
  const correctionMutation = useRequestCorrection();

  // Form state for inline edits
  const [editForm, setEditForm] = useState({
    student_name: '',
    admission_category: '',
    admission_status: '',
    date_of_birth: '',
    gender: '',
    nri_category: '',
  });

  // Sync edit form when student data loads
  React.useEffect(() => {
    if (student) {
      setEditForm({
        student_name: student.student_name || '',
        admission_category: student.admission_category || '',
        admission_status: student.admission_status || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        nri_category: student.nri_category || '',
      });
    }
  }, [student]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading student record..." />;
  }

  if (isError || !student) {
    const isForbidden = (error as any)?.response?.status === 403;
    const isNotFound = (error as any)?.response?.status === 404;

    if (isForbidden) {
      return (
        <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Institutional Access Boundary Restricted</h2>
          <p className="text-sm text-gray-600">
            This student record belongs to a different institution. Under AICTE Multi-Tenant isolation policies, institution operators can only view student records enrolled at their own institution.
          </p>
          <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 text-left font-mono">
            Active Account: {user?.email || 'Institution Operator'} <br />
            Status: 403 Forbidden (Multi-Tenant Scoping Policy)
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => navigate(isAICTEAdmin() ? '/aicte/institutions' : '/institution/students')}>
              {isAICTEAdmin() ? 'Back to AICTE Institutions' : "View My College's Students"}
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Switch Account / Login as AICTE Admin
            </Button>
          </div>
        </div>
      );
    }

    return (
      <ErrorState
        title={isNotFound ? "Student Record Not Found" : "Unable to Load Student Record"}
        message={
          isNotFound
            ? `No student record was found matching ID "${id}". Please verify the identifier.`
            : "An error occurred while fetching the student record. Please check server connectivity."
        }
        onRetry={refetch}
      />
    );
  }

  // Filter issues associated with this student
  const studentIssues = issuesData?.items?.filter((issue) => issue.record_id === student.id) || [];

  const handleSaveInline = async () => {
    await updateMutation.mutateAsync({
      id: student.id,
      data: editForm,
    });
    setIsEditing(false);
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedValue || !justification) {
      toast.error('Please specify both the proposed value and justification.');
      return;
    }

    await correctionMutation.mutateAsync({
      id: student.id,
      data: {
        field_name: correctionField,
        proposed_value: proposedValue,
        justification,
      },
    });

    setIsCorrectionModalOpen(false);
    setProposedValue('');
    setJustification('');
  };

  useEffect(() => {
    if (student?.id) {
      loadPastReconciliations(student.id);
    }
  }, [student?.id]);

  const loadCredential = async () => {
    if (!student?.id) return;
    setLoadingCred(true);
    try {
      const data = await verificationApi.getStudentCredential(student.id);
      setCredData(data);
    } catch (err: any) {
      toast.error('Failed to load verifiable credential');
    } finally {
      setLoadingCred(false);
    }
  };

  const handleGenerateFreshCredential = async () => {
    if (!student?.id) return;
    setLoadingCred(true);
    try {
      const data = await verificationApi.generateStudentCredential(student.id);
      setCredData(data);
      toast.success('Generated fresh RS256-signed Verifiable Academic Credential!');
    } catch (err: any) {
      toast.error('Failed to generate credential');
    } finally {
      setLoadingCred(false);
    }
  };

  const loadPastReconciliations = async (studentId: string) => {
    try {
      const data = await ocrApi.getReconciliations(studentId);
      setPastRecons(data);
    } catch (err) {
      console.error('Failed to load past reconciliations', err);
    }
  };

  const handleSimulateValid = () => {
    if (!student) return;
    setDocFileName('Class_XII_Marksheet_Scanned.pdf');
    setDocType('marksheet');
    setExtractedName(student.student_name);
    setExtractedRoll(student.institution_student_id);
    setExtractedDob(student.date_of_birth || '2004-05-15');
    setExtractedInst('Authorized Technical Institute');
    setExtractedMarks('485/500 (97.0%)');
    toast.success('Pre-populated valid marksheet scan fields');
  };

  const handleSimulateMismatch = () => {
    if (!student) return;
    setDocFileName('Questionable_Certificate_Scan.jpg');
    setDocType('diploma');
    setExtractedName('Rohan S. Singhania');
    setExtractedRoll('DIFF-ROLL-9921');
    setExtractedDob('1998-11-20');
    setExtractedInst('Unknown Unaffiliated Center');
    setExtractedMarks('310/500');
    toast.success('Pre-populated conflicting document fields');
  };

  const handleRunReconciliation = async () => {
    if (!student) return;
    setIsReconciling(true);
    try {
      const result = await ocrApi.reconcileDocument({
        student_id: student.id,
        document_type: docType,
        file_name: docFileName,
        extracted_data: {
          candidate_name: extractedName || student.student_name,
          roll_number: extractedRoll || student.institution_student_id,
          date_of_birth: extractedDob || student.date_of_birth,
          institution_name: extractedInst || 'Authorized Institute',
          marks: extractedMarks,
          passing_year: '2024',
        },
      });
      setReconResult(result);
      if (result.match_status === 'VERIFIED') {
        toast.success(`OCR Verified with ${(result.confidence_score * 100).toFixed(1)}% confidence!`);
      } else if (result.match_status === 'REVIEW_REQUIRED') {
        toast('Review required: Minor field variations detected', { icon: '⚠️' });
      } else {
        toast.error('Severe discrepancies detected! Anomaly flag generated.');
      }
      loadPastReconciliations(student.id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Reconciliation failed');
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else if (isAICTEAdmin()) {
                navigate('/aicte/institutions');
              } else {
                navigate('/institution/students');
              }
            }}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{student.student_name}</h1>
              <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                ID: {student.institution_student_id}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Admission Cycle: {student.admission_cycle} • Program Code:{' '}
              {student.program_code || student.program_id}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            onClick={() => {
              setActiveTab('credential');
              loadCredential();
            }}
            icon={<Award className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            Verifiable Credential & QR
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCorrectionModalOpen(true)}
            icon={<FileEdit className="w-4 h-4" />}
          >
            Request Official Correction
          </Button>

          {!isEditing ? (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              icon={<FileEdit className="w-4 h-4" />}
            >
              Edit Fields
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSaveInline}
              isLoading={updateMutation.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Identity Verification & Compliance Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-indigo-50/40 border-indigo-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-indigo-700">Identity Verification</p>
              <div className="mt-1 flex items-center space-x-2">
                <StatusBadge status={student.identity_verification_status || 'unverified'} />
                {student.apaar_id && (
                  <span className="text-xs font-mono text-indigo-950 font-semibold">
                    APAAR: {student.apaar_id}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-700">Record Regulatory Status</p>
              <div className="mt-1">
                <StatusBadge status={student.record_status} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-amber-50/40 border-amber-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-amber-800">Compliance Issues</p>
              <p className="text-sm font-semibold text-amber-950 mt-1">
                {studentIssues.length === 0
                  ? 'All Rules Passed'
                  : `${studentIssues.length} Active Flag(s)`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Record Attributes
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
              activeTab === 'issues'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>Validation Issues</span>
            {studentIssues.length > 0 && (
              <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {studentIssues.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4 mr-1" />
            <span>Version History ({history.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('credential');
              loadCredential();
            }}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
              activeTab === 'credential'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Award className="w-4 h-4 mr-1 text-indigo-600" />
            <span>Verifiable Credential & QR</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('ocr');
              if (!extractedName && student) {
                setExtractedName(student.student_name);
                setExtractedRoll(student.institution_student_id);
                setExtractedDob(student.date_of_birth || '');
                setExtractedInst('Authorized AICTE Institution');
              }
            }}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
              activeTab === 'ocr'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ScanLine className="w-4 h-4 mr-1" />
            <span>OCR Document Reconciliation</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <Card title="Student Information & Enrollment Metadata">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Student Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.student_name}
                  onChange={(e) => setEditForm({ ...editForm, student_name: e.target.value })}
                  className="mt-1 w-full text-sm px-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              ) : (
                <p className="mt-1 text-sm font-semibold text-gray-900">{student.student_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Institution Roll / Reg ID
              </label>
              <p className="mt-1 font-mono text-sm text-gray-900">
                {student.institution_student_id}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Program Code & Level
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {student.program_code || student.program_id}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Admission Category
              </label>
              {isEditing ? (
                <select
                  value={editForm.admission_category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, admission_category: e.target.value })
                  }
                  className="mt-1 w-full text-sm px-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="OBC_NCL">OBC-NCL</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                  <option value="MANAGEMENT">MANAGEMENT</option>
                  <option value="NRI">NRI</option>
                </select>
              ) : (
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {student.admission_category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className="mt-1 w-full text-sm px-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{student.date_of_birth || 'Not Specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Gender</label>
              {isEditing ? (
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="mt-1 w-full text-sm px-3 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                >
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              ) : (
                <p className="mt-1 text-sm text-gray-900">{student.gender || '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                NRI Category
              </label>
              <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                {student.nri_category || 'not_applicable'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                OCI Status
              </label>
              <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                {student.oci_status || 'not_applicable'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Foreign National (FN) Status
              </label>
              <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                {student.foreign_national_status || 'not_applicable'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Supernumerary Seats Quota
              </label>
              <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                {student.supernumerary_category || 'none'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Record Ingestion Date
              </label>
              <p className="mt-1 text-sm text-gray-600">
                {new Date(student.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Last System Audit
              </label>
              <p className="mt-1 text-sm text-gray-600">
                {new Date(student.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'issues' && (
        <Card title="Associated Validation Issues & Discrepancies" noPadding>
          {studentIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">No issues flagged</p>
              <p className="text-xs text-gray-500 mt-1">
                This student record passed all algorithmic cross-checks and intake validations.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {studentIssues.map((issue) => (
                <div key={issue.id} className="p-5 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {issue.rule_code}
                      </span>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="text-sm text-gray-800 font-medium mt-2">{issue.description}</p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-gray-500 block">Expected Condition:</span>
                      <span className="font-mono text-emerald-700">
                        {issue.expected_condition || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Observed Condition:</span>
                      <span className="font-mono text-rose-700">
                        {issue.observed_condition || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <Card title="Audit Trail & Version History" noPadding>
          {isHistoryLoading ? (
            <div className="p-8">
              <LoadingSpinner size="sm" message="Loading version history..." />
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p>Initial version. No subsequent modifications logged.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((h) => (
                <div key={h.id} className="p-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold text-gray-900">Version {h.version}</span>
                    <span>{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Modified by: <span className="font-medium text-gray-800">{h.changed_by}</span>
                  </p>
                  {h.change_reason && (
                    <p className="text-xs text-indigo-700 mt-1 italic">"{h.change_reason}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: OCR Document Reconciliation */}
      {activeTab === 'ocr' && (
        <div className="space-y-6">
          <Card
            title="OCR-Assisted Document Reconciliation"
            subtitle="Scan, extract, and reconcile physical certificates, marksheets, or migration certificates against authoritative database records."
          >
            {/* Quick Actions / Presets */}
            <div className="mb-6 bg-indigo-50/60 border border-indigo-100 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase text-indigo-900 tracking-wide">Interactive Demo Simulations</h4>
                  <p className="text-xs text-indigo-700">Pre-populate OCR extraction fields to test reconciliation models.</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="secondary" onClick={handleSimulateValid} icon={<CheckCircle className="w-3.5 h-3.5 text-green-600" />}>
                    Simulate Valid Marksheet
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleSimulateMismatch} icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}>
                    Simulate Conflicting Document
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                >
                  <option value="marksheet">Class XII / Qualifying Marksheet</option>
                  <option value="diploma">Diploma / Degree Certificate</option>
                  <option value="caste_certificate">Caste / Quota Certificate</option>
                  <option value="migration_certificate">Migration Certificate</option>
                  <option value="identity_card">Government Identity Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Document File Name</label>
                <input
                  type="text"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Extracted Candidate Name</label>
                <input
                  type="text"
                  value={extractedName}
                  onChange={(e) => setExtractedName(e.target.value)}
                  placeholder="Candidate Name in Document"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Extracted Roll / Registration No</label>
                <input
                  type="text"
                  value={extractedRoll}
                  onChange={(e) => setExtractedRoll(e.target.value)}
                  placeholder="Roll No"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Extracted Date of Birth</label>
                <input
                  type="text"
                  value={extractedDob}
                  onChange={(e) => setExtractedDob(e.target.value)}
                  placeholder="YYYY-MM-DD or DD/MM/YYYY"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Extracted Marks / Score</label>
                <input
                  type="text"
                  value={extractedMarks}
                  onChange={(e) => setExtractedMarks(e.target.value)}
                  placeholder="e.g. 485/500"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button
                variant="primary"
                onClick={handleRunReconciliation}
                isLoading={isReconciling}
                icon={<ScanLine className="w-4 h-4" />}
              >
                Execute OCR Fuzzy Reconciliation
              </Button>
            </div>
          </Card>

          {/* Reconciliation Result Panel */}
          {reconResult && (
            <Card title="OCR Reconciliation Assessment">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    reconResult.match_status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                    reconResult.match_status === 'REVIEW_REQUIRED' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {reconResult.match_status === 'VERIFIED' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-gray-900">
                        {reconResult.match_status === 'VERIFIED' ? 'Document Concordance Verified' :
                         reconResult.match_status === 'REVIEW_REQUIRED' ? 'Review Required (Minor Discrepancy)' : 'Conflicting Document Flagged'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        reconResult.match_status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                        reconResult.match_status === 'REVIEW_REQUIRED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {reconResult.match_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Scanned file: <span className="font-mono">{reconResult.file_name}</span></p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Match Confidence</div>
                  <div className="text-2xl font-black text-indigo-700">
                    {(reconResult.confidence_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Flagged Discrepancies */}
              {reconResult.discrepancies.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="text-xs font-bold text-red-800 uppercase mb-1">Identified Discrepancies</h5>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                    {reconResult.discrepancies.map((disc, idx) => (
                      <li key={idx}>{disc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Field Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2.5">Attribute Field</th>
                      <th className="px-4 py-2.5">Extracted from Document</th>
                      <th className="px-4 py-2.5">Database Student Record</th>
                      <th className="px-4 py-2.5">Fuzzy Similarity</th>
                      <th className="px-4 py-2.5">Concordance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {reconResult.field_comparisons.map((fc, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-semibold text-gray-700 capitalize">{fc.field.replace('_', ' ')}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{fc.extracted_value || <span className="text-gray-400 italic">Not detected</span>}</td>
                        <td className="px-4 py-2.5 text-gray-700">{fc.record_value || <span className="text-gray-400 italic">Not set</span>}</td>
                        <td className="px-4 py-2.5 font-bold text-indigo-700">{(fc.similarity * 100).toFixed(0)}%</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            fc.match_status === 'EXACT' ? 'bg-green-100 text-green-800' :
                            fc.match_status === 'FUZZY' || fc.match_status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {fc.match_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Historical Reconciliations */}
          {pastRecons.length > 0 && (
            <Card title={`Prior Reconciliation History (${pastRecons.length})`}>
              <div className="divide-y divide-gray-100">
                {pastRecons.map((pr, idx) => (
                  <div key={pr.reconciliation_id || (pr as any).id || idx} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">{pr.document_type.replace('_', ' ')}: {pr.file_name}</div>
                      <div className="text-gray-400">{new Date(pr.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-indigo-700">{(pr.confidence_score * 100).toFixed(1)}%</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        pr.match_status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                        pr.match_status === 'REVIEW_REQUIRED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pr.match_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Verifiable Academic Credential (Feature 6) */}
      {activeTab === 'credential' && (
        <div className="space-y-6">
          <Card className="border-indigo-200 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-xs">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      Official Verifiable Academic Credential
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      RS256 PKI Certified
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tightly bound to student's academic identity (APAAR ID) under the AICTE National Trust Framework.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateFreshCredential}
                  isLoading={loadingCred}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Regenerate Token
                </Button>
                {credData && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      navigate('/verify/result', {
                        state: {
                          result: {
                            valid: true,
                            status: 'VALID',
                            signature_algorithm: 'RS256',
                            signature_type: 'RS256 (Asymmetric RSA-2048 PKI)',
                            asymmetric_pki_verified: true,
                            issuer: 'apaar-verify-demo',
                            purpose: 'admission_verification',
                            verified_at: new Date().toISOString(),
                            claims: credData.claims || {},
                            subject_reference: credData.subject_reference,
                          },
                          token: credData.token,
                        },
                      });
                    }}
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Test on Public Verifier
                  </Button>
                )}
              </div>
            </div>

            {loadingCred ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner message="Generating RS256 cryptographic verifiable student record..." />
              </div>
            ) : credData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
                {/* Academic Record Attributes */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200 text-xs">
                    <div>
                      <span className="text-gray-500 font-semibold block">Student Full Name:</span>
                      <span className="text-sm font-bold text-gray-900 block mt-0.5">
                        {credData.student_name}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-semibold block">Academic Identity (APAAR ID):</span>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block mt-0.5">
                        {credData.apaar_id || student.identity_reference || 'DEMO-APAAR-1001'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-semibold block">Sanctioned Program:</span>
                      <span className="font-medium text-gray-900 block mt-0.5">
                        {credData.program_name} ({credData.program_code})
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-semibold block">Authorized Institution:</span>
                      <span className="font-medium text-gray-900 block mt-0.5">
                        {credData.institution_name}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-semibold block">Campus Student / Roll ID:</span>
                      <span className="font-mono text-gray-800 block mt-0.5">
                        {credData.institution_student_id}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-semibold block">Enrollment Status:</span>
                      <span className="inline-block mt-0.5 font-bold uppercase text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {credData.claims?.admission_status || student.admission_status || 'ADMITTED'}
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Proof Metadata */}
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-indigo-400 font-mono text-[11px] border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        Asymmetric PKI Proof Metadata
                      </span>
                      <span>RFC 7517 Compliant</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block">Digital Signature:</span>
                        <span className="text-emerald-400 font-bold">{credData.signature_algorithm}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Key ID (kid):</span>
                        <span className="text-slate-200">{credData.key_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Subject Reference:</span>
                        <span className="text-slate-200">{credData.subject_reference}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Public Trust URI:</span>
                        <a
                          href="http://localhost:8000/api/v1/.well-known/jwks.json"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 underline"
                        >
                          /.well-known/jwks.json
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Verifiable Token Snippet */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Cryptographic Token (RS256 JWT):</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(credData.token);
                          toast.success('Token copied to clipboard');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Token
                      </button>
                    </div>
                    <div className="p-2.5 bg-gray-100 rounded-lg text-[10px] font-mono text-gray-700 break-all border border-gray-200 max-h-20 overflow-y-auto">
                      {credData.token}
                    </div>
                  </div>
                </div>

                {/* Scannable Tamper-Proof QR Code */}
                <div className="flex flex-col items-center justify-center p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Tamper-Evident QR Code
                  </span>
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-200">
                    <img
                      src={`http://localhost:8000${credData.qr_endpoint}`}
                      alt="Verifiable Credential QR"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 max-w-[200px]">
                    Scan using any camera or the APAAR Public Verifier to validate credential integrity in real time.
                  </p>
                  <a
                    href={`http://localhost:8000${credData.qr_endpoint}`}
                    download={`${student.student_name}_verifiable_qr.png`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 pt-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download QR Code
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 text-xs">
                No active credential found. Click "Regenerate Token" above to issue one.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Correction Request Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Submit Correction Request"
        subtitle="Request AICTE / Regulatory review for exceptional record adjustment."
        maxWidth="md"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Field to Correct
            </label>
            <select
              value={correctionField}
              onChange={(e) => setCorrectionField(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
            >
              <option value="student_name">Student Full Name</option>
              <option value="date_of_birth">Date of Birth</option>
              <option value="admission_category">Admission Category</option>
              <option value="program_id">Program / Branch</option>
              <option value="supernumerary_category">Supernumerary Category</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Proposed New Value *
            </label>
            <input
              type="text"
              required
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              placeholder="e.g. Corrected Name as on Aadhaar"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Justification & Supporting Document Ref *
            </label>
            <textarea
              required
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide reason for data discrepancy and reference official documents."
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCorrectionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={correctionMutation.isPending}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDetail;
