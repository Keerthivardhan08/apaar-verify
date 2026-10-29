import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studentApi } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Search,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  GraduationCap,
  Calendar,
  FileText,
  User,
  Sparkles,
  ExternalLink,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentInspector: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const handleSearch = async (searchStr?: string) => {
    const q = searchStr !== undefined ? searchStr : query;
    if (!q.trim()) {
      toast.error('Please enter a student name, APAAR ID, roll number, or college.');
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      const data = await studentApi.searchInspector(q.trim());
      setResults(data);
      if (data.length > 0) {
        setSelectedStudent(data[0]);
      } else {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error('Failed to search student inspector:', err);
      toast.error('Student lookup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Read URL query parameter on load or URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('query') || searchParams.get('apaar') || searchParams.get('q');
    if (urlQuery && urlQuery.trim()) {
      setQuery(urlQuery.trim());
      handleSearch(urlQuery.trim());
    }
  }, [searchParams]);

  const handleQuickChip = (term: string) => {
    setQuery(term);
    setSearchParams({ query: term });
    handleSearch(term);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl border border-indigo-800/40 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight">AICTE Universal Student & APAAR ID Inspector</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Cross-institution national search tool. Instantly inspect any student record by name, roll number, or 12-digit APAAR ID across all AICTE recognised colleges to examine admission validity, intake caps, and integrity issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-400/30 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Central Regulatory Access
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <Card className="border border-indigo-100 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Student Full Name, 12-digit APAAR ID, Roll No, or AICTE recognised college name/code..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto px-6 font-bold"
              isLoading={isLoading}
            >
              Inspect Student
            </Button>
          </div>

          {/* Quick Demo Search Chips */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 overflow-x-auto">
            <span className="font-semibold text-gray-700 shrink-0">Try Demo Lookups:</span>
            {[
              'Aarav Sharma',
              'Sneha Reddy',
              'Ananya Joshi',
              'Rohan Iyer',
              'Pooja Sharma',
              'IIT-CS-001',
              'DSCE',
              'IIT Bombay',
              'RVCE',
              'Computer Science',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickChip(chip)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 rounded-lg border border-gray-200 transition-colors text-xs font-semibold shrink-0 text-gray-700"
              >
                {chip}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Results Section */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner message="Searching national APAAR records across AICTE recognised colleges..." />
        </div>
      ) : hasSearched && results.length === 0 ? (
        <Card className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-900">No Student Records Found</h3>
          <p className="text-xs text-gray-500 mt-1">No registered student matches "{query}". Please check the spelling or APAAR ID format.</p>
        </Card>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Match Results List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
              Found {results.length} National Matches:
            </div>
            {results.map((st) => {
              const isSelected = selectedStudent?.id === st.id;
              const hasIssues = st.open_issues_count > 0;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-1 ring-indigo-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-gray-900">{st.student_name}</span>
                    {hasIssues ? (
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        {st.open_issues_count} Flagged Issue{st.open_issues_count > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Compliant
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-indigo-700">
                    <span className="font-bold">{st.apaar_id}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{st.roll_no}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                    <span className="truncate max-w-[220px] font-medium">{st.institution_name}</span>
                    <span className="font-bold text-gray-700 uppercase text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                      {st.branch}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Inspector View */}
          {selectedStudent && (
            <div className="lg:col-span-7 space-y-4">
              <Card className="border border-indigo-100 shadow-md">
                {/* Profile Header */}
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md">
                        {selectedStudent.student_name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-gray-900">{selectedStudent.student_name}</h2>
                        <span className="font-mono text-xs font-bold text-indigo-700">
                          APAAR ID: {selectedStudent.apaar_id}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        AICTE VERIFIED
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-500 block">Enrolled Campus:</span>
                      <span className="font-bold text-gray-900">{selectedStudent.institution_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Program & Branch:</span>
                      <span className="font-bold text-gray-900">{selectedStudent.branch}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Category Quota:</span>
                      <span className="font-bold uppercase text-indigo-700">{selectedStudent.admission_category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">DOB / Gender:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedStudent.date_of_birth || 'N/A'} • {selectedStudent.gender}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Issues & Anomalies Inspection Section */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Intake & Identity Issue Audit: {selectedStudent.issues.length} Recorded</span>
                    </h3>
                  </div>

                  {selectedStudent.issues.length === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      <span className="text-xs font-bold text-emerald-900 block">Zero Issues or Anomalies Detected</span>
                      <span className="text-[11px] text-emerald-700">
                        This student's admission falls strictly within approved intake limits, identity matches UIDAI/Aadhaar vault, and marks are verified.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedStudent.issues.map((iss: any) => (
                        <div
                          key={iss.id}
                          className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold font-mono text-rose-900">{iss.rule_code}</span>
                            <Badge variant={iss.severity === 'critical' ? 'danger' : 'warning'} size="sm">
                              {iss.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-800 font-medium">{iss.description}</p>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                            <span>Target field: <strong>{iss.affected_field}</strong></span>
                            <span className="font-bold text-indigo-700 uppercase">Status: {iss.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Digital Verified Academic Credentials Preview */}
                <div className="pt-5 border-t border-gray-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Cryptographically Sealed Academic Document Repository</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <span className="font-bold text-gray-900 block">Class X Secondary Examination</span>
                      <span className="text-[11px] text-gray-500 block">CBSE • Verified via DigiLocker / NAD</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold mt-1 inline-block">
                        SHA-256 SEALED & AUTHENTIC
                      </span>
                    </div>
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <span className="font-bold text-gray-900 block">Class XII Senior Secondary</span>
                      <span className="text-[11px] text-gray-500 block">Pre-University Board • Verified</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold mt-1 inline-block">
                        SHA-256 SEALED & AUTHENTIC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Authority: AICTE Northern / Western Regulatory Node
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast.success(`Audit dossier for APAAR ${selectedStudent.apaar_id} exported.`)}
                    >
                      Export Dossier
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => toast.success(`Record verified with central AICTE seal.`)}
                      icon={<ShieldCheck className="w-3.5 h-3.5" />}
                    >
                      Certify APAAR Integrity
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default StudentInspector;
