import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../hooks/useAuth';
import { uploadApi } from '../../services/api';
import { UploadBatch } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertOctagon,
  Download,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ApaarQuickDesk } from './ApaarQuickDesk';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { getUserInstitutionId } = useAuth();
  const institutionId = getUserInstitutionId() || 'INST-001';

  const [activeTab, setActiveTab] = useState<'batch' | 'manual'>('batch');
  const [cycle, setCycle] = useState('2024-2025');
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadBatch | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [commitMode, setCommitMode] = useState<'partial' | 'strict'>('partial');
  const [isCommitting, setIsCommitting] = useState(false);

  // Parse CSV text for quick local preview
  const parseCSVPreview = (fileObj: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headerRow = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const rows = lines
          .slice(1, 11)
          .map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
        setHeaders(headerRow);
        setPreviewRows(rows);
      }
    };
    reader.readAsText(fileObj);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (!selected.name.endsWith('.csv')) {
        toast.error('Only CSV files are supported.');
        return;
      }
      setFile(selected);
      setUploadResult(null);
      setValidationErrors([]);
      parseCSVPreview(selected);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'institution_student_id',
      'student_name',
      'date_of_birth',
      'gender',
      'program_code',
      'admission_category',
      'admission_status',
      'aadhaar_hash',
      'email',
      'phone',
      'nri_category',
      'supernumerary_category',
    ];

    const sampleRow = [
      '2024CS001',
      'Arun Sharma',
      '2004-05-15',
      'MALE',
      'CSE-UG-BTECH',
      'GENERAL',
      'CONFIRMED',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'arun.sharma@example.com',
      '9876543210',
      'NONE',
      'NONE',
    ];

    const csvString = [templateHeaders.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'APAAR_Student_Ingestion_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded ingestion template');
  };

  const handleUploadAndValidate = async () => {
    if (!file) {
      toast.error('Please select a CSV file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const result = await uploadApi.uploadCsv(file, institutionId, cycle, (pct) => {
        setUploadProgress(pct);
      });

      setUploadResult(result);
      if (result.validation_errors) {
        setValidationErrors(result.validation_errors);
      } else {
        // Fetch issues for this batch if not in initial response
        try {
          const issues = await uploadApi.getUploadIssues(result.id);
          setValidationErrors(issues);
        } catch {
          // ignore if no issues
        }
      }
      toast.success('Batch validated by compliance engine!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'CSV upload and validation failed.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleCommit = async () => {
    if (!uploadResult) return;

    setIsCommitting(true);
    try {
      await uploadApi.commitUpload(uploadResult.id, commitMode);
      toast.success('Batch successfully committed to official academic registry!');
      navigate('/institution/uploads');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to commit batch.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewRows([]);
    setHeaders([]);
    setUploadResult(null);
    setValidationErrors([]);
  };

  return (
    <div className="space-y-6">
      {/* Upload Workspace Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Data Ingestion & Updates</h1>
          <p className="text-sm text-gray-500">
            Submit new admission batches or perform manual APAAR-gated student profile updates.
          </p>
        </div>

        {activeTab === 'batch' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            icon={<Download className="w-4 h-4" />}
          >
            Download CSV Template
          </Button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('batch')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'batch'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Batch CSV Staged Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'manual'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Manual APAAR Quick Desk
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            GATED
          </span>
        </button>
      </div>

      {activeTab === 'manual' ? (
        <ApaarQuickDesk />
      ) : (
        <>
          {/* Cycle Selector and Upload Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            {/* Cycle Selector */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-gray-700 uppercase">
                Target Admission Cycle:
              </label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-medium"
              >
                <option value="2024-2025">Academic Cycle 2024-2025</option>
                <option value="2023-2024">Academic Cycle 2023-2024</option>
                <option value="2022-2023">Academic Cycle 2022-2023</option>
              </select>
            </div>

            {/* Dropzone */}
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-gray-300 hover:border-indigo-500 bg-gray-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {isDragActive ? 'Drop CSV file here...' : 'Upload Student Ingestion CSV'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Drag and drop your prepared CSV file here, or click to browse files on your computer.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <span>Supported format: .csv</span>
                  <span>•</span>
                  <span>Max file size: 10 MB</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{file.name}</h4>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB • {previewRows.length}+ rows previewed
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    icon={<RotateCcw className="w-4 h-4" />}
                    disabled={isUploading || isCommitting}
                  >
                    Change File
                  </Button>
                  {!uploadResult && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleUploadAndValidate}
                      isLoading={isUploading}
                    >
                      Validate Batch
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Progress indicator */}
            {isUploading && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-indigo-700 font-semibold">
                  <span>Uploading and executing validation rules...</span>
                  <span>{uploadProgress || 50}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress || 50}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* CSV Preview Table */}
          {previewRows.length > 0 && !uploadResult && (
            <Card
              title="CSV Data Preview (First 10 Rows)"
              subtitle="Inspect raw columns before committing to validation"
              noPadding
            >
              <div className="overflow-x-auto max-h-72">
                <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                  <thead className="bg-gray-50 font-semibold text-gray-600">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {previewRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-gray-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Validation Results Card */}
          {uploadResult && (
            <Card
              title="Batch Validation Execution Report"
              subtitle={`Batch ID: ${uploadResult.id}`}
            >
              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-3 text-center mb-6">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-medium">Total Rows</span>
                  <p className="text-xl font-bold text-gray-900 mt-1">{uploadResult.total_rows}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-medium">Valid Rows</span>
                  <p className="text-xl font-bold text-emerald-800 mt-1">
                    {uploadResult.valid_rows}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-xs text-rose-700 font-medium">Invalid / Flagged</span>
                  <p className="text-xl font-bold text-rose-800 mt-1">
                    {uploadResult.invalid_rows}
                  </p>
                </div>
              </div>

              {/* Row-Level Errors List */}
              {validationErrors.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-rose-700 font-semibold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Compliance & Intake Discrepancies ({validationErrors.length})</span>
                  </div>

                  <div className="border border-rose-200 rounded-lg divide-y divide-rose-100 max-h-60 overflow-y-auto bg-rose-50/20">
                    {validationErrors.map((err, i) => (
                      <div key={i} className="p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-gray-900">
                            {err.rule_code || 'RULE_ERR'}
                          </span>
                          <span className="text-rose-600 font-medium capitalize">
                            {err.severity || 'high'}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1">{err.description || err.message}</p>
                        {err.affected_field && (
                          <span className="text-[11px] text-gray-500 font-mono mt-0.5 block">
                            Field: {err.affected_field}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">
                    All records passed regulatory intake limits, category quotas, and APAAR checks!
                  </span>
                </div>
              )}

              {/* Commit Controls */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-semibold text-gray-700">Commit Mode:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="commitMode"
                      value="partial"
                      checked={commitMode === 'partial'}
                      onChange={() => setCommitMode('partial')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Commit Valid Rows Only ({uploadResult.valid_rows})</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="commitMode"
                      value="strict"
                      checked={commitMode === 'strict'}
                      onChange={() => setCommitMode('strict')}
                      disabled={uploadResult.invalid_rows > 0}
                      className="text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                    />
                    <span className={uploadResult.invalid_rows > 0 ? 'text-gray-400' : ''}>
                      Strict (All or Nothing)
                    </span>
                  </label>
                </div>

                <Button
                  variant="primary"
                  onClick={handleCommit}
                  isLoading={isCommitting}
                  disabled={commitMode === 'strict' && uploadResult.invalid_rows > 0}
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Commit Batch to Registry
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Instructions & Rules */}
        <div className="space-y-4">
          <Card title="Ingestion Guidelines">
            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                  1
                </span>
                <span>
                  <strong>Unique IDs:</strong> Each student must possess a unique institution roll
                  number within the admission cycle.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                  2
                </span>
                <span>
                  <strong>Program Intake:</strong> Total enrolled students cannot exceed AICTE
                  approved capacity without supernumerary approval.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                  3
                </span>
                <span>
                  <strong>Category Quotas:</strong> Quota distribution (General, OBC, SC, ST, EWS)
                  must align with statutory state/central reservations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                  4
                </span>
                <span>
                  <strong>APAAR / Aadhaar Hash:</strong> SHA-256 hashed identifiers enable simulated
                  cross-institution duplicate enrollment checks.
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Upload;
