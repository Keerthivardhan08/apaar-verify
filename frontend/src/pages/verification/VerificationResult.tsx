import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CredentialVerificationResult } from '../../types';
import DemoBanner from '../../components/layout/DemoBanner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  GraduationCap,
  Key,
  ExternalLink,
  ShieldCheck,
  EyeOff,
  Lock,
} from 'lucide-react';

export const VerificationResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    result?: CredentialVerificationResult & {
      purpose?: string;
      signature_algorithm?: string;
      signature_type?: string;
      asymmetric_pki_verified?: boolean;
      jwks_uri?: string;
    };
    token?: string;
  } | null;

  // Fallback demo result if navigated directly
  const result = state?.result || {
    valid: true,
    status: 'VALID',
    is_mock_verification: true,
    signature_algorithm: 'RS256',
    signature_type: 'RS256 (Asymmetric RSA-2048 PKI)',
    asymmetric_pki_verified: true,
    issuer: 'apaar-verify-demo',
    purpose: 'admission_verification',
    verified_at: new Date().toISOString(),
    claims: {
      student_name: 'Aditya Verma',
      institution_name: 'Indian Institute of Technology (Demo Campus)',
      program_code: 'CSE-UG-BTECH',
      admission_cycle: '2026-27',
      admission_status: 'admitted',
      _privacy_binding: {
        purpose: 'admission_verification',
        privacy_level: 'Standard Academic Disclosure',
        zero_pii: false,
      },
    },
  };

  const getStatusBadge = () => {
    switch (result.status) {
      case 'VALID':
        return (
          <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-base tracking-wide block">CREDENTIAL VALID</span>
              <span className="text-[11px] text-emerald-600">
                {result.asymmetric_pki_verified
                  ? 'RS256 Asymmetric RSA-2048 PKI Signature Valid'
                  : 'Cryptographically authentic'}
              </span>
            </div>
          </div>
        );
      case 'REVOKED':
        return (
          <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <span className="font-extrabold text-base tracking-wide block">CREDENTIAL REVOKED</span>
              <span className="text-[11px] text-rose-600">Invalidated by issuing authority</span>
            </div>
          </div>
        );
      case 'EXPIRED':
        return (
          <div className="flex items-center space-x-2 text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold text-base tracking-wide block">CREDENTIAL EXPIRED</span>
              <span className="text-[11px] text-amber-600">Validity period has lapsed</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <span className="font-extrabold text-base tracking-wide block">INVALID CREDENTIAL</span>
              <span className="text-[11px] text-red-600">Cryptographic signature mismatch</span>
            </div>
          </div>
        );
    }
  };

  const claims = (result.claims || result.credential?.claims || {}) as Record<string, any>;
  const privacyBinding = claims._privacy_binding;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-700 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">APAAR Verify</h1>
            <p className="text-[11px] text-gray-500">Public Credential Verification Result</p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/verify')}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Verify Another Credential
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <Card className="shadow-lg border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
            {getStatusBadge()}

            <div className="text-right text-xs text-gray-500">
              <span className="block font-semibold text-gray-700">Verification Timestamp:</span>
              <span>{new Date(result.verified_at || Date.now()).toLocaleString()}</span>
            </div>
          </div>

          {/* PKI Trust & Privacy Badge */}
          <div className="my-4 p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs text-indigo-900 gap-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>
                Signed with: <strong className="font-mono">{result.signature_type || 'RS256 (RSA-2048 PKI)'}</strong>
              </span>
            </div>
            <a
              href="/api/v1/.well-known/jwks.json"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 font-mono text-[11px]"
            >
              Inspect Public JWKS <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Large Demonstration Warning */}
          {result.is_mock_verification && (
            <div className="my-4 p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                  Simulated / Sandbox Verification Result
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  This credential was verified in the demonstration sandbox environment. While the cryptographic
                  RS256 signature and JWKS verification are genuine, the academic claim figures are synthetic.
                </p>
              </div>
            </div>
          )}

          {/* Privacy Minimization Banner */}
          {privacyBinding && (
            <div className="my-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Purpose Scope: <strong>{privacyBinding.purpose_name || result.purpose}</strong> ({privacyBinding.privacy_level})
                </span>
              </div>
              {privacyBinding.zero_pii && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  ZERO PII PRESERVED
                </span>
              )}
            </div>
          )}

          {/* Claims Display */}
          {result.valid && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Verified Enrolment Attributes & Claims
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                {claims.student_name && (
                  <div>
                    <span className="text-gray-500 font-semibold block">Student Name:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {claims.student_name}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-gray-500 font-semibold block">Institution:</span>
                  <span className="text-gray-900 font-medium">
                    {claims.institution_name || 'Registered Technical Institution'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold block">Sanctioned Program:</span>
                  <span className="text-gray-900 font-medium">
                    {claims.program_name || claims.program_code || 'B.Tech / Approved Program'}
                  </span>
                </div>

                {claims.admission_cycle && (
                  <div>
                    <span className="text-gray-500 font-semibold block">Admission Cycle:</span>
                    <span className="text-gray-900">{claims.admission_cycle}</span>
                  </div>
                )}

                {claims.admission_status && (
                  <div>
                    <span className="text-gray-500 font-semibold block">Enrollment Status:</span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800 uppercase">
                      {claims.admission_status}
                    </span>
                  </div>
                )}

                {claims.admission_category && (
                  <div>
                    <span className="text-gray-500 font-semibold block">Category:</span>
                    <span className="text-gray-900 uppercase">{claims.admission_category}</span>
                  </div>
                )}
              </div>

              {/* Redacted Fields Disclosure */}
              {privacyBinding?.redacted_fields && privacyBinding.redacted_fields.length > 0 && (
                <div className="p-3 bg-gray-100/70 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-gray-500" />
                    <span>Privacy Protection: The following sensitive fields were excluded for this purpose:</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-700">
                    {privacyBinding.redacted_fields.join(', ')}
                  </span>
                </div>
              )}

              {/* Issuer & Validity Meta */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
                <div>
                  <span className="text-gray-400">Issuer Authority: </span>
                  <span className="font-semibold text-gray-700">
                    {result.issuer || 'apaar-verify-demo'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Verification Protocol: </span>
                  <span className="font-mono font-medium text-indigo-700">
                    {result.signature_type || 'RS256-RFC7517-JWKS'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
            <Link
              to="/verify"
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Verify Another Token
            </Link>

            <Link
              to="/login"
              className="text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              Staff Portal Login
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default VerificationResult;
