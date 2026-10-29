import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  GraduationCap,
  ShieldCheck,
  KeyRound,
  Mail,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  CheckCircle2,
  Sparkles,
  Building2,
  Fingerprint,
  Shield,
  Database,
  ChevronRight,
  School,
  Loader2,
  Lock,
  Briefcase,
} from 'lucide-react';
import Button from '../components/ui/Button';

interface DemoPersona {
  displayName: string;
  category: 'operators' | 'aicte' | 'admins' | 'stakeholders' | 'students';
  institutionName: string;
  email: string;
  password: string;
  destination: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: {
    borderHover: string;
    bgHover: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  };
}

const DEMO_PERSONAS: DemoPersona[] = [
  // College Operators
  {
    displayName: 'College Operator (DSCE)',
    category: 'operators',
    institutionName: 'Dayananda Sagar College of Eng.',
    email: 'operator@dsce.edu.in',
    password: 'Demo@1234',
    destination: '/institution',
    icon: Building2,
    theme: {
      borderHover: 'hover:border-emerald-400',
      bgHover: 'hover:bg-emerald-50/50',
      iconBg: 'bg-emerald-50 text-emerald-600',
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
    },
  },
  {
    displayName: 'College Operator (NIT)',
    category: 'operators',
    institutionName: 'National Inst. of Technology',
    email: 'operator@nit-demo.edu',
    password: 'Demo@1234',
    destination: '/institution',
    icon: Building2,
    theme: {
      borderHover: 'hover:border-teal-400',
      bgHover: 'hover:bg-teal-50/50',
      iconBg: 'bg-teal-50 text-teal-600',
      iconColor: 'text-teal-600',
      badgeBg: 'bg-teal-100',
      badgeText: 'text-teal-800',
    },
  },
  {
    displayName: 'College Operator (IIT)',
    category: 'operators',
    institutionName: 'Indian Institute of Technology',
    email: 'operator@iit-demo.edu',
    password: 'Demo@1234',
    destination: '/institution',
    icon: Building2,
    theme: {
      borderHover: 'hover:border-cyan-400',
      bgHover: 'hover:bg-cyan-50/50',
      iconBg: 'bg-cyan-50 text-cyan-600',
      iconColor: 'text-cyan-600',
      badgeBg: 'bg-cyan-100',
      badgeText: 'text-cyan-800',
    },
  },
  {
    displayName: 'College Operator (DEC)',
    category: 'operators',
    institutionName: 'Demo Engineering College',
    email: 'operator@dec-demo.edu',
    password: 'Demo@1234',
    destination: '/institution',
    icon: Building2,
    theme: {
      borderHover: 'hover:border-green-400',
      bgHover: 'hover:bg-green-50/50',
      iconBg: 'bg-green-50 text-green-600',
      iconColor: 'text-green-600',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
    },
  },
  // AICTE Authorities
  {
    displayName: 'AICTE National Admin',
    category: 'aicte',
    institutionName: 'AICTE Central Headquarters',
    email: 'admin@aicte.gov.in',
    password: 'Demo@1234',
    destination: '/aicte',
    icon: ShieldCheck,
    theme: {
      borderHover: 'hover:border-indigo-400',
      bgHover: 'hover:bg-indigo-50/50',
      iconBg: 'bg-indigo-50 text-indigo-600',
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
    },
  },
  {
    displayName: 'AICTE Reviewer',
    category: 'aicte',
    institutionName: 'Compliance Review Desk',
    email: 'reviewer@aicte.gov.in',
    password: 'Demo@1234',
    destination: '/aicte',
    icon: CheckCircle2,
    theme: {
      borderHover: 'hover:border-purple-400',
      bgHover: 'hover:bg-purple-50/50',
      iconBg: 'bg-purple-50 text-purple-600',
      iconColor: 'text-purple-600',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800',
    },
  },
  // Student Portal Persona
  {
    displayName: 'Student (Aarav Sharma)',
    category: 'students',
    institutionName: 'APAAR ID: DEMO-APAAR-1001 (DSCE)',
    email: 'student@dsce.edu.in',
    password: 'Demo@1234',
    destination: '/student',
    icon: GraduationCap,
    theme: {
      borderHover: 'hover:border-amber-400',
      bgHover: 'hover:bg-amber-50/50',
      iconBg: 'bg-amber-50 text-amber-600',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
    },
  },
  // External Stakeholders
  {
    displayName: 'National Testing Agency',
    category: 'stakeholders',
    institutionName: 'NTA Exam & Eligibility Desk',
    email: 'nta.verifier@nta.ac.in',
    password: 'Demo@1234',
    destination: '/stakeholder',
    icon: Briefcase,
    theme: {
      borderHover: 'hover:border-blue-400',
      bgHover: 'hover:bg-blue-50/50',
      iconBg: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
    },
  },
  {
    displayName: 'Corporate Verifier (TCS)',
    category: 'stakeholders',
    institutionName: 'Campus Recruitment Verification',
    email: 'tcs.verify@tcs.com',
    password: 'Demo@1234',
    destination: '/stakeholder',
    icon: Briefcase,
    theme: {
      borderHover: 'hover:border-sky-400',
      bgHover: 'hover:bg-sky-50/50',
      iconBg: 'bg-sky-50 text-sky-600',
      iconColor: 'text-sky-600',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-800',
    },
  },
  // College Administrators
  {
    displayName: 'College Admin (DSCE)',
    category: 'admins',
    institutionName: 'Principal / DSCE Administration',
    email: 'admin@dsce.edu.in',
    password: 'Demo@1234',
    destination: '/institution',
    icon: School,
    theme: {
      borderHover: 'hover:border-blue-400',
      bgHover: 'hover:bg-blue-50/50',
      iconBg: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
    },
  },
  {
    displayName: 'College Admin (IIT)',
    category: 'admins',
    institutionName: 'Dean Academic Affairs (IIT)',
    email: 'admin@iit-demo.edu',
    password: 'Demo@1234',
    destination: '/institution',
    icon: School,
    theme: {
      borderHover: 'hover:border-indigo-400',
      bgHover: 'hover:bg-indigo-50/50',
      iconBg: 'bg-indigo-50 text-indigo-600',
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
    },
  },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePersonaEmail, setActivePersonaEmail] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'operators' | 'aicte' | 'stakeholders' | 'students' | 'admins'>('all');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const performLogin = async (targetEmail: string, targetPass: string, preferredDestination?: string) => {
    setIsSubmitting(true);
    try {
      const success = await login(targetEmail, targetPass);
      if (success) {
        if (preferredDestination) {
          navigate(preferredDestination, { replace: true });
        } else if (from) {
          navigate(from, { replace: true });
        } else if (targetEmail.toLowerCase().includes('student')) {
          navigate('/student', { replace: true });
        } else if (
          targetEmail.toLowerCase().includes('nta') ||
          targetEmail.toLowerCase().includes('tcs') ||
          targetEmail.toLowerCase().includes('verifier')
        ) {
          navigate('/stakeholder', { replace: true });
        } else if (targetEmail.toLowerCase().includes('aicte')) {
          navigate('/aicte', { replace: true });
        } else {
          navigate('/institution', { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
      setActivePersonaEmail(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isSubmitting) return;
    await performLogin(email, password);
  };

  const handle1ClickLogin = async (persona: DemoPersona) => {
    if (isSubmitting) return;
    setEmail(persona.email);
    setPassword(persona.password);
    setActivePersonaEmail(persona.email);
    await performLogin(persona.email, persona.password, persona.destination);
  };

  const filteredPersonas =
    selectedFilter === 'all'
      ? DEMO_PERSONAS
      : DEMO_PERSONAS.filter((p) => p.category === selectedFilter);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* ================= DEMONSTRATION BANNER ================= */}
      <div className="relative z-20 bg-amber-500/10 border-b border-amber-300/60 px-4 py-2.5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-semibold text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>DEMONSTRATION SYSTEM — MoE / AICTE National APAAR Verification & Intake Oversight Platform</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* ================= LEFT BRAND HERO PANEL ================= */}
        <div className="lg:w-[48%] xl:w-[45%] relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
          {/* Ambient subtle glow mesh */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-10 -right-20 w-80 h-80 bg-violet-500/20 rounded-full blur-[90px] pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-950/60 border border-white/20">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  APAAR Verify
                </h1>
                <p className="text-xs text-indigo-200/90 font-medium tracking-wide">
                  One Nation One Student ID • Academic Integrity Platform
                </p>
              </div>
            </div>
          </div>

          {/* Center Pitch */}
          <div className="relative z-10 my-10 lg:my-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              National Academic Trust Network
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Unified Academic Record Verification.
              <span className="block mt-1 bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Every Academic Record.
              </span>
            </h2>
            <p className="text-indigo-200/80 text-sm sm:text-base leading-relaxed mt-5 max-w-lg">
              A comprehensive platform for instant APAAR credential verification, statutory intake quota compliance, and tamper-evident student records management.
            </p>

            {/* Feature Highlights */}
            <div className="mt-8 space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Trusted Verification',
                  description: 'Cryptographically validated academic records and QR authentication.',
                },
                {
                  icon: Database,
                  title: 'Statutory Intake Compliance',
                  description: 'Real-time seat intake monitoring with 9 regulatory validation checks.',
                },
                {
                  icon: Fingerprint,
                  title: 'Zero-Discrepancy Integrity',
                  description: 'AI-assisted resolution desk & multi-stakeholder consent workflows.',
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white">{feat.title}</h3>
                      <p className="text-[11px] sm:text-xs text-indigo-200/70 mt-0.5 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy Architecture Highlight */}
            <div className="mt-8 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-400/20 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-indigo-300 shrink-0" />
              <p className="text-xs text-indigo-200/90">
                Default student record access restricted strictly to Institution & AICTE HQ under DPDP Act.
              </p>
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200/70">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Academic Integrity & Intake Architecture</span>
            </div>
            <span className="text-[11px] font-mono opacity-60">SIH 2026 Production</span>
          </div>
        </div>

        {/* ================= RIGHT LOGIN & 1-CLICK DEMO PANEL ================= */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 bg-[#F8FAFC]">
          <div className="w-full max-w-[560px]">
            {/* Mobile Logo (< lg) */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">APAAR Verify</h2>
                <p className="text-xs text-slate-500">Academic Integrity Platform</p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
                <LockKeyhole className="w-3.5 h-3.5 text-indigo-600" />
                <span>Authorized Sign In</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back<span className="text-indigo-600">.</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your credentials or use the 1-click persona demo cards below.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. operator@dsce.edu.in or admin@aicte.gov.in"
                    className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full h-11 pl-10 pr-11 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full !h-11 !rounded-xl !bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-700 hover:!to-violet-700 !text-white !font-semibold !shadow-md !shadow-indigo-200 transition-all"
                  isLoading={isSubmitting && !activePersonaEmail}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Sign In to Platform</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </span>
                </Button>
              </div>
            </form>

            {/* ================= 1-CLICK DEMONSTRATION PERSONAS ================= */}
            <div className="mt-7 pt-5 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Demonstration Personas</span>
                </p>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'operators', label: 'Operators' },
                      { id: 'aicte', label: 'AICTE' },
                      { id: 'students', label: 'Students' },
                      { id: 'stakeholders', label: 'Stakeholders' },
                      { id: 'admins', label: 'Admins' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedFilter(tab.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                        selectedFilter === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/70'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredPersonas.map((persona) => {
                  const isLoadingThis = isSubmitting && activePersonaEmail === persona.email;
                  const Icon = persona.icon;
                  return (
                    <button
                      key={persona.displayName}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handle1ClickLogin(persona)}
                      className={`group relative text-left p-2.5 rounded-xl bg-white border border-slate-200 ${persona.theme.borderHover} ${persona.theme.bgHover} hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-2.5 disabled:opacity-60`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${persona.theme.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {persona.displayName}
                          </h4>
                          {isLoadingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0 ml-1" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {persona.institutionName}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-[10px] text-slate-400 mt-2">
                Click any persona card above for instant 1-click evaluation access.
              </p>
            </div>

            {/* ================= PUBLIC VERIFICATION PORTAL ================= */}
            <div className="mt-5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Public Credential Verification</p>
                <p className="text-[11px] text-slate-500">Verify degrees & diplomas with QR code or APAAR ID</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/verify')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-indigo-200/80 shadow-xs hover:shadow transition-all whitespace-nowrap"
              >
                <span>Verify Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Security Footer */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>National Academic Integrity & Statutory Oversight Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
