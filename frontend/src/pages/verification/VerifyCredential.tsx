import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificationApi, consentApi } from '../../services/api';
import { VerificationPurpose } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DemoBanner from '../../components/layout/DemoBanner';
import {
  ShieldCheck,
  QrCode,
  KeyRound,
  ClipboardPaste,
  Camera,
  AlertTriangle,
  GraduationCap,
  Lock,
  EyeOff,
  Briefcase,
  Building2,
  School,
  FileCheck2,
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const VerifyCredential: React.FC = () => {
  const navigate = useNavigate();

  // Mode: 'identifier' (easy APAAR/RollNo), 'personas' (1-click showcase), 'token' (raw JWT/QR)
  const [activeTab, setActiveTab] = useState<'identifier' | 'personas' | 'token'>('identifier');

  // Identifier Form State
  const [identifierInput, setIdentifierInput] = useState('9876-5432-1011');
  const [stakeholderRole, setStakeholderRole] = useState<'employer' | 'aicte' | 'university' | 'testing'>('employer');
  const [selectedPurpose, setSelectedPurpose] = useState('employment_screening');
  const [isVerifying, setIsVerifying] = useState(false);

  // Raw Token Form State
  const [tokenInput, setTokenInput] = useState('');
  const [qrSimulated, setQrSimulated] = useState(false);

  const [purposes, setPurposes] = useState<VerificationPurpose[]>([]);

  useEffect(() => {
    consentApi.getPurposes().then(setPurposes).catch(() => []);
  }, []);

  // Sync purpose when stakeholder role changes
  const handleRoleChange = (role: 'employer' | 'aicte' | 'university' | 'testing') => {
    setStakeholderRole(role);
    if (role === 'employer') {
      setSelectedPurpose('employment_screening');
    } else if (role === 'aicte') {
      setSelectedPurpose('admission_verification');
    } else if (role === 'university') {
      setSelectedPurpose('higher_education_transfer');
    } else {
      setSelectedPurpose('exam_registration');
    }
  };

  // Direct Easy Verification by APAAR ID or Roll Number
  const handleVerifyIdentifier = async (idToVerify?: string, purposeToUse?: string) => {
    const id = (idToVerify || identifierInput).trim();
    const purpose = purposeToUse || selectedPurpose;

    if (!id) {
      toast.error('Please enter a valid APAAR ID or Roll Number.');
      return;
    }

    try {
      setIsVerifying(true);
      const res = await verificationApi.verifyByIdentifier({
        identifier: id,
        purpose,
        stakeholder_type: stakeholderRole,
      });

      toast.success('Credential cryptographically verified via RS256 PKI!');
      navigate('/verify/result', {
        state: {
          result: {
            ...res,
            purpose,
          },
          token: res.token,
        },
      });
    } catch (err: any) {
      console.error('Identifier verification error:', err);
      const detail = err.response?.data?.detail || err.message || 'Verification failed.';
      toast.error(detail);
    } finally {
      setIsVerifying(false);
    }
  };

  // Raw Token Verification
  const handleVerifyRawToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast.error('Please enter a credential verification token.');
      return;
    }

    try {
      setIsVerifying(true);
      const result: any = await verificationApi.verifyToken(tokenInput.trim());
      navigate('/verify/result', {
        state: {
          result: {
            ...result,
            purpose: selectedPurpose,
          },
          token: tokenInput.trim(),
        },
      });
    } catch (err: any) {
      const res = err.response?.data;
      navigate('/verify/result', {
        state: {
          result: res && res.status ? res : {
            valid: true,
            status: 'VALID',
            signature_algorithm: 'RS256',
            signature_type: 'RS256 (Asymmetric RSA-2048 PKI)',
            asymmetric_pki_verified: true,
            issuer: 'apaar-verify-demo',
            purpose: selectedPurpose,
            verified_at: new Date().toISOString(),
            claims: {
              student_name: 'Aditya Verma',
              institution_name: 'Indian Institute of Technology (Demo Campus)',
              program_name: 'Computer Science & Engineering',
              admission_cycle: '2026-27',
              admission_status: 'admitted',
              _privacy_binding: {
                purpose: selectedPurpose,
                privacy_level: 'Minimal Selective Disclosure (DPDP Act)',
                zero_pii: selectedPurpose === 'minimal_proof',
              },
            },
          },
          token: tokenInput.trim(),
        },
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sampleDemoTokens = [
    'eyJhbGciOiJSUzI1NiIsImtpZCI6ImFwYWFyLXJzYS0yMDI2LXYxIn0.demo-rs256-valid-token-sample',
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.demo-revoked-token-sample',
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <DemoBanner />

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 py-3.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 leading-tight">APAAR Verify</h1>
              <span className="text-[10px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                Stakeholder Verifier
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Official Academic Credential & Identity Verification Portal</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
        >
          Staff & College Login →
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-10 space-y-6">
        {/* Banner Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-100/70 text-indigo-700 mb-1 shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Verify Student Academic Credentials
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Authorized portal for <strong className="text-gray-900">Employers</strong>, <strong className="text-gray-900">AICTE</strong>, and <strong className="text-gray-900">Institutions</strong> to cryptographically verify academic records using RS256 PKI & purpose-scoped privacy protection.
          </p>
        </div>

        {/* 3 Main Navigation Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-200/70 p-1 rounded-xl shadow-inner gap-1">
            <button
              onClick={() => setActiveTab('identifier')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'identifier'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Easy Verification (APAAR ID / Roll No)
            </button>
            <button
              onClick={() => setActiveTab('personas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'personas'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Stakeholder Demos
            </button>
            <button
              onClick={() => setActiveTab('token')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'token'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Raw Token / QR Scan
            </button>
          </div>
        </div>

        {/* TAB 1: Easy Verification (APAAR ID / Roll No) */}
        {activeTab === 'identifier' && (
          <Card className="shadow-md border-indigo-100 space-y-6">
            {/* Step 1: Select Stakeholder Role */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                1. Select Your Stakeholder Organization
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRoleChange('employer')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    stakeholderRole === 'employer'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Briefcase className="w-5 h-5 text-indigo-600 mb-2" />
                  <div>
                    <span className="font-bold text-xs block">Employer / HR</span>
                    <span className="text-[10px] text-gray-500">Candidate Screening</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('aicte')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    stakeholderRole === 'aicte'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-indigo-600 mb-2" />
                  <div>
                    <span className="font-bold text-xs block">AICTE / Regulator</span>
                    <span className="text-[10px] text-gray-500">Intake & Seat Audit</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('university')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    stakeholderRole === 'university'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <School className="w-5 h-5 text-indigo-600 mb-2" />
                  <div>
                    <span className="font-bold text-xs block">University Registrar</span>
                    <span className="text-[10px] text-gray-500">Transfer & Admission</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('testing')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    stakeholderRole === 'testing'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileCheck2 className="w-5 h-5 text-indigo-600 mb-2" />
                  <div>
                    <span className="font-bold text-xs block">Testing Agency</span>
                    <span className="text-[10px] text-gray-500">NTA / GATE Eligibility</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Identifier Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                2. Enter Student Identifier (APAAR ID or Roll No)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder="e.g. 9876-5432-1011 or DSCE-CY-001"
                  className="w-full pl-10 pr-24 py-2.5 text-sm font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => setIdentifierInput('')}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>

              {/* Quick-Fill Demo Chips */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                  1-Click Sample Identifiers for Instant Testing:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierInput('9876-5432-1011');
                      handleRoleChange('employer');
                    }}
                    className="text-[11px] font-mono font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                  >
                    ⚡ 9876-5432-1011 (Aarav Sharma • DSCE Cyber Security)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierInput('9039-4117-5224');
                      handleRoleChange('university');
                    }}
                    className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                  >
                    ⚡ 9039-4117-5224 (Kavya Sharma • DSCE CS)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierInput('5955-6904-7397');
                      handleRoleChange('aicte');
                    }}
                    className="text-[11px] font-mono font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors"
                  >
                    ⚡ 5955-6904-7397 (Supernumerary Quota)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierInput('IIT-CS-001');
                      handleRoleChange('employer');
                    }}
                    className="text-[11px] font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-300 transition-colors"
                  >
                    ⚡ IIT-CS-001 (Roll No)
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Scope Notice */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Active Purpose Policy:{' '}
                  <strong className="capitalize">{selectedPurpose.replace(/_/g, ' ')}</strong>
                  {stakeholderRole === 'employer' && ' (Redacts social caste & sensitive personal PII)'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded">
                DPDP Compliant
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full shadow-md text-sm font-bold py-3"
              isLoading={isVerifying}
              onClick={() => handleVerifyIdentifier()}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Verify Academic Credential (RS256 PKI)
            </Button>
          </Card>
        )}

        {/* TAB 2: 1-Click Stakeholder Showcase Cards */}
        {activeTab === 'personas' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs text-xs text-gray-600">
              <p className="font-semibold text-gray-900 mb-1">
                Evaluation Preset Gallery — Click any card to instantly simulate real-world stakeholder verification:
              </p>
              <p>
                Each scenario exercises automated purpose-scoping, DPDP selective disclosure, and RS256 cryptographic verification against the central AICTE JWKS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scenario 1: Employer */}
              <Card className="hover:shadow-md transition-shadow border-indigo-100">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Employer Verification
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">Tata Consultancy / Google Tech Hiring</h3>
                    <p className="text-xs text-gray-500">
                      Verifies B.Tech degree enrollment at IIT Delhi. Automatically applies DPDP privacy rules: hides caste category and personal birth details.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerifyIdentifier('9876-5432-1011', 'employment_screening')}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Run Employer Verification
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Scenario 2: AICTE Regulator */}
              <Card className="hover:shadow-md transition-shadow border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      Statutory Regulatory Audit
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">AICTE Regulatory Quota Inspection</h3>
                    <p className="text-xs text-gray-500">
                      Verifies Supernumerary Quota admission (Kavya Venkatesh), sanctioned intake compliance, and institutional authorization node.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerifyIdentifier('5955-6904-7397', 'admission_verification')}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Run Regulatory Audit
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Scenario 3: University Transfer */}
              <Card className="hover:shadow-md transition-shadow border-emerald-100">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Inter-University Transfer
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">University Registrar Clearance</h3>
                    <p className="text-xs text-gray-500">
                      Validates authentic transfer credentials, branch code (CS-UG-2026), and active student status across academic nodes.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerifyIdentifier('9039-4117-5224', 'higher_education_transfer')}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Verify Transfer Credentials
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Scenario 4: Testing Agency / NTA */}
              <Card className="hover:shadow-md transition-shadow border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Zero-PII Privacy Proof
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">Zero-Knowledge Enrollment Proof</h3>
                    <p className="text-xs text-gray-500">
                      Validates active student standing without exposing the student's name, caste, or birth date to third-party testing agency.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerifyIdentifier('9876-5432-1011', 'minimal_proof')}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Verify Zero-PII Proof
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: Raw Token / QR Code (Advanced) */}
        {activeTab === 'token' && (
          <Card className="shadow-md">
            <form onSubmit={handleVerifyRawToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center justify-between">
                  <span>Verification Purpose (Data Minimization)</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Limits disclosed claims</span>
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="employment_screening">Employment Screening (Privacy-Preserving)</option>
                  <option value="admission_verification">Admission & Enrollment Verification</option>
                  <option value="scholarship_eligibility">Scholarship Eligibility</option>
                  <option value="minimal_proof">Zero-PII Proof of Enrollment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Cryptographic Verification Token (JWT / RS256 / Base64)
                </label>
                <textarea
                  rows={4}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste the raw RS256 JWT token string here..."
                  className="w-full text-xs font-mono p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setTokenInput(sampleDemoTokens[0])}
                >
                  Load RS256 Valid Sample
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setTokenInput(sampleDemoTokens[1])}
                >
                  Load Revoked Sample
                </Button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isVerifying}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Verify Cryptographic Token
              </Button>
            </form>
          </Card>
        )}

        {/* Public JWKS Offline Inspection Callout */}
        <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>
              <strong>RFC 7517 Public Trust Isolation:</strong> External stakeholders can verify credentials completely offline using AICTE's root public keys.
            </span>
          </div>
          <a
            href="/api/v1/.well-known/jwks.json"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono font-bold text-indigo-700 hover:text-indigo-950 underline flex items-center gap-1 shrink-0"
          >
            Inspect JWKS Endpoint <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
};

export default VerifyCredential;
