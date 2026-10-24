import React, { useState, useEffect } from 'react';
import { Award, Printer, ShieldCheck, QrCode, X, ExternalLink, Download } from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { apiClient } from '../../services/api';

interface CertificateData {
  certificate_id: string;
  certificate_number: string;
  award_status: string;
  student_name: string;
  apaar_id: string;
  institution_student_id: string;
  institution_name: string;
  institution_code: string;
  degree_title: string;
  program_name: string;
  program_code: string;
  academic_level: string;
  admission_cycle: string;
  graduation_year: string;
  conferral_date: string;
  classification: string;
  cumulative_grade: string;
  qr_endpoint: string;
  token: string;
  trust_framework: string;
  pki_signature: string;
  signatories: Array<{ role: string; name: string }>;
}

interface DegreeCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const DegreeCertificateModal: React.FC<DegreeCertificateModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      loadCertificate();
    }
  }, [isOpen, studentId]);

  const loadCertificate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<CertificateData>(`/verification/student/${studentId}/certificate`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load degree certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">
              Official Degree Certificate with APAAR ID & Student ID (Feature 10)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
            >
              Print / Save as PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          {loading ? (
            <div className="py-24 text-center">
              <LoadingSpinner message="Retrieving degree certificate and generating tamper-proof QR..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl my-auto">
              <p className="font-semibold">{error}</p>
              <Button variant="outline" size="sm" onClick={loadCertificate} className="mt-3">
                Retry
              </Button>
            </div>
          ) : data ? (
            /* Printable Degree Certificate Sheet */
            <div
              id="printable-certificate"
              className="bg-[#FCFBF7] text-slate-900 w-full max-w-3xl rounded-xl shadow-xl p-8 sm:p-12 relative border-8 border-double border-amber-800/60 print:shadow-none print:border-8 print:p-8"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.03) 0%, transparent 80%)',
              }}
            >
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-amber-800/40 text-xl font-serif">❖</div>
              <div className="absolute top-2 right-2 text-amber-800/40 text-xl font-serif">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-800/40 text-xl font-serif">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-800/40 text-xl font-serif">❖</div>

              {/* Institution Header */}
              <div className="text-center space-y-1.5 pb-6 border-b border-amber-900/20">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-900 text-amber-100 flex items-center justify-center font-serif text-2xl font-bold shadow-inner">
                  {data.institution_code.slice(0, 3)}
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-amber-950 uppercase pt-2">
                  {data.institution_name}
                </h1>
                <p className="text-xs tracking-widest text-slate-600 uppercase font-sans font-semibold">
                  Recognized Degree-Awarding Body • Autonomous Technical Institution
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Certificate Ref: {data.certificate_number} • Reg. Authority: AICTE / MoE
                </p>
              </div>

              {/* Conferral Statement */}
              <div className="text-center py-6 space-y-4">
                <p className="text-sm font-serif italic text-slate-700">
                  By the authority of the Board of Governors and the Senate of the Institute,
                </p>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  {data.student_name}
                </h2>

                {/* DUAL IDENTIFIER COMPLIANCE STRIP (FEATURE 10 MANDATE) */}
                <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-4 py-2 bg-amber-50/80 rounded-lg border border-amber-300 shadow-2xs mx-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase text-amber-900">
                      National APAAR ID:
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-400">
                      {data.apaar_id}
                    </span>
                  </div>

                  <span className="text-amber-400 font-bold hidden sm:inline">•</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase text-slate-700">
                      Student / Roll ID:
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                      {data.institution_student_id}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-serif max-w-lg mx-auto leading-relaxed pt-1">
                  having fulfilled all prescribed academic curriculums and successfully completed the comprehensive
                  evaluations, has been admitted to the degree of
                </p>

                <h3 className="text-xl sm:text-2xl font-serif font-extrabold text-amber-900 uppercase tracking-wide">
                  {data.degree_title}
                </h3>

                <div className="flex items-center justify-center gap-4 text-xs font-sans text-slate-700 pt-1">
                  <span className="bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                    Classification: {data.classification}
                  </span>
                  <span className="bg-slate-100 text-slate-800 font-mono font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                    Grade: {data.cumulative_grade}
                  </span>
                </div>
              </div>

              {/* Lower Section: Verification QR, Seal, Signatures */}
              <div className="pt-6 border-t border-amber-900/20 grid grid-cols-3 items-end gap-4 text-center">
                {/* Left Signatory */}
                <div className="space-y-1">
                  <div className="font-serif italic text-xs text-slate-500 pb-1">
                    [Digitally Signed by Registrar]
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <div className="text-xs font-bold text-slate-900">{data.signatories?.[1]?.name || 'Registrar'}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{data.signatories?.[1]?.role || 'Registrar'}</div>
                  </div>
                </div>

                {/* Center: Tamper-Proof Live Scannable QR Code */}
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="p-1.5 bg-white border border-amber-300 rounded-lg shadow-xs">
                    <img
                      src={`http://localhost:8000${data.qr_endpoint}`}
                      alt="Degree Verification QR"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                    />
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 leading-tight">
                    Scan to Verify Online <br />
                    <span className="text-indigo-600 font-semibold">RS256 PKI Signed</span>
                  </div>
                </div>

                {/* Right Signatory */}
                <div className="space-y-1">
                  <div className="font-serif italic text-xs text-slate-500 pb-1">
                    [Digitally Signed by Director]
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <div className="text-xs font-bold text-slate-900">
                      {data.signatories?.[2]?.name || 'Director'}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      {data.signatories?.[2]?.role || 'Director / Vice-Chancellor'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Trust Watermark */}
              <div className="mt-6 pt-3 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500">
                <span>Award Date: {data.conferral_date}</span>
                <span className="font-mono text-amber-800 font-semibold">
                  AICTE National Depository Verifiable Credential
                </span>
                <span>Graduation Year: {data.graduation_year}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer (hidden when printing) */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Satisfies Government Mandate: APAAR ID printed with Student ID on Degree Award.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Print Certificate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DegreeCertificateModal;
