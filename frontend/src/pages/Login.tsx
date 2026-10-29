import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
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
  UserPlus,
  FileText,
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
    institutionName: '12-Digit APAAR ID: 9876-5432-1011 (DSCE)',
    email: '9876-5432-1011',
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
  // Navigation & Authentication
  const [authMode, setAuthMode] = useState<'login' | 'register_student' | 'register_stakeholder'>('login');

  // Sign In State
  const [identifier, setIdentifier] = useState(''); // Email or APAAR ID
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePersonaEmail, setActivePersonaEmail] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'operators' | 'aicte' | 'stakeholders' | 'students' | 'admins'>('all');
  const [stakeholderNotice, setStakeholderNotice] = useState<string | null>(null);

  // Student Registration State
  const [studentApaar, setStudentApaar] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Stakeholder Registration State
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('CORPORATE_EMPLOYER');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [orgPurpose, setOrgPurpose] = useState('');
  const [orgPassword, setOrgPassword] = useState('');

  const { login, registerStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const performLogin = async (targetIdentifier: string, targetPass: string, preferredDestination?: string) => {
    setIsSubmitting(true);
    setStakeholderNotice(null);
    try {
      const success = await login(targetIdentifier, targetPass);
      if (success) {
        if (preferredDestination) {
          navigate(preferredDestination, { replace: true });
        } else if (from) {
          navigate(from, { replace: true });
        } else if (targetIdentifier.toLowerCase().includes('student') || targetIdentifier.toUpperCase().includes('APAAR')) {
          navigate('/student', { replace: true });
        } else if (
          targetIdentifier.toLowerCase().includes('nta') ||
          targetIdentifier.toLowerCase().includes('tcs') ||
          targetIdentifier.toLowerCase().includes('verifier')
        ) {
          navigate('/stakeholder', { replace: true });
        } else if (targetIdentifier.toLowerCase().includes('aicte')) {
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password || isSubmitting) return;
    await performLogin(identifier, password);
  };

  const handle1ClickLogin = async (persona: DemoPersona) => {
    if (isSubmitting) return;
    setIdentifier(persona.email);
    setPassword(persona.password);
    setActivePersonaEmail(persona.email);
    await performLogin(persona.email, persona.password, persona.destination);
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentApaar || !studentEmail || !studentPassword || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await registerStudent({
        apaar_id: studentApaar.trim(),
        full_name: studentName.trim() || undefined,
        email: studentEmail.trim().toLowerCase(),
        password: studentPassword,
      });

      if (success) {
        navigate('/student', { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStakeholderRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !contactEmail || !orgPassword || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await authApi.registerStakeholder({
        organization_name: orgName.trim(),
        entity_type: orgType,
        contact_person: contactPerson.trim(),
        contact_email: contactEmail.trim().toLowerCase(),
        purpose: orgPurpose.trim() || 'Academic Credential & Intake Verification',
        password: orgPassword,
      });

      toast.success(res.message, { duration: 6000 });
      setStakeholderNotice(res.message);
      setIdentifier(contactEmail.trim().toLowerCase());
      setAuthMode('login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit organization registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPersonas =
    selectedFilter === 'all'
      ? DEMO_PERSONAS
      : DEMO_PERSONAS.filter((p) => p.category === selectedFilter);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* ================= DEMONSTRATION BANNER ================= */}
      <div className="relative z-20 bg-amber-500/10 border-b border-amber-300/60 px-4 py-2 backdrop-blur-sm">
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
          <div className="relative z-10 my-8 lg:my-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              National Academic Trust Network
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Unified Academic Record Verification.
              <span className="block mt-1 bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Every Academic Record.
              </span>
            </h2>
            <p className="text-indigo-200/80 text-sm sm:text-base leading-relaxed mt-4 max-w-lg">
              Support for instant Student APAAR ID login, auto-approved student consent management, and one-time statutory AICTE authorization for corporate & exam verifiers.
            </p>

            {/* Feature Highlights */}
            <div className="mt-7 space-y-3.5">
              {[
                {
                  icon: GraduationCap,
                  title: 'Student APAAR ID Direct Login',
                  description: 'Students can authenticate directly using their 12-digit APAAR ID with instant auto-approval.',
                },
                {
                  icon: ShieldCheck,
                  title: 'AICTE Stakeholder Authorization',
                  description: 'External employers and testing agencies submit one-time registration for AICTE approval.',
                },
                {
                  icon: Database,
                  title: 'Intake Quota & Regulatory Compliance',
                  description: 'Automated 9-rule validation checks against statutory AICTE seat intake ceilings.',
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
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
            <div className="mt-7 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-400/20 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-indigo-300 shrink-0" />
              <p className="text-xs text-indigo-200/90">
                DPDP Act Compliant: Access strictly requires student consent and statutory AICTE credential authority.
              </p>
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="relative z-10 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200/70">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Academic Integrity & Intake Architecture</span>
            </div>
            <span className="text-[11px] font-mono opacity-60">SIH 2026 Production</span>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL (SIGN IN / REGISTER) ================= */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-8 bg-[#F8FAFC]">
          <div className="w-full max-w-[560px]">
            {/* Mobile Logo (< lg) */}
            <div className="lg:hidden flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">APAAR Verify</h2>
                <p className="text-xs text-slate-500">Academic Integrity Platform</p>
              </div>
            </div>

            {/* Auth Mode Tabs Switcher */}
            <div className="mb-6 bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In (Email / APAAR)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register_student')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'register_student'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Register Student</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register_stakeholder')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'register_stakeholder'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Register Stakeholder</span>
              </button>
            </div>

            {/* Stakeholder Pending Notice Banner if just registered */}
            {stakeholderNotice && authMode === 'login' && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Registration Submitted for AICTE Review</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">{stakeholderNotice}</p>
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW 1: SIGN IN (EMAIL OR APAAR ID)
            ======================================================== */}
            {authMode === 'login' && (
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
                    <LockKeyhole className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Authorized Sign In</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back<span className="text-indigo-600">.</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Sign in with your <span className="font-semibold text-slate-700">Official Email</span> or <span className="font-semibold text-indigo-600">Student APAAR ID</span>.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label htmlFor="identifier" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Official Email or Student APAAR ID
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        autoComplete="username"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. 9876-5432-1011 or operator@dsce.edu.in"
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
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
                        placeholder="Enter your account password"
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

                {/* Quick Registration Links */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register_student')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register Student (Instant)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register_stakeholder')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Register Stakeholder (AICTE)</span>
                  </button>
                </div>

                {/* 1-Click Demonstration Personas */}
                <div className="mt-6 pt-5 border-t border-slate-200">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[230px] overflow-y-auto pr-1">
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
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW 2: STUDENT REGISTRATION (INSTANT AUTO-APPROVAL)
            ======================================================== */}
            {authMode === 'register_student' && (
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant Auto-Approved Registration</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Student Registration
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Enter your APAAR ID to link your academic record. Once registered, your account is immediately approved for instant login.
                  </p>
                </div>

                <form onSubmit={handleStudentRegister} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="studentApaar" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        APAAR ID *
                      </label>
                      <span className="text-[10px] text-indigo-600 font-semibold">Try: 9876-5432-1011</span>
                    </div>
                    <div className="relative group">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                      <input
                        id="studentApaar"
                        name="studentApaar"
                        type="text"
                        required
                        value={studentApaar}
                        onChange={(e) => setStudentApaar(e.target.value)}
                        placeholder="e.g. 9876-5432-1011 (12-Digit APAAR ID)"
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="studentName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Student Full Name (Optional)
                    </label>
                    <div className="relative group">
                      <input
                        id="studentName"
                        name="studentName"
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Aarav Sharma (Auto-fetched if found in APAAR ledger)"
                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="studentEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Student Email Address *
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                      <input
                        id="studentEmail"
                        name="studentEmail"
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="e.g. aarav@dsce.edu.in"
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="studentPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Create Password *
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                      <input
                        id="studentPassword"
                        name="studentPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Create a strong account password"
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

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                    <p className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero-Wait Automatic Approval</span>
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Upon completing registration, your student portal session will open immediately without waiting for administrator approval.
                    </p>
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full !h-11 !rounded-xl !bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-700 hover:!to-teal-700 !text-white !font-semibold !shadow-md !shadow-emerald-200 transition-all"
                      isLoading={isSubmitting}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>Register & Instant Sign In</span>
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                      </span>
                    </Button>
                  </div>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ← Already registered? Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW 3: STAKEHOLDER REGISTRATION (AICTE APPROVAL WORKFLOW)
            ======================================================== */}
            {authMode === 'register_stakeholder' && (
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Statutory AICTE Approval Required</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Stakeholder Registration
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Corporate employers, exam bodies, and verification agencies must complete one-time onboarding for AICTE authorization.
                  </p>
                </div>

                <form onSubmit={handleStakeholderRegister} className="space-y-3">
                  <div>
                    <label htmlFor="orgName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Organization / Corporate Name *
                    </label>
                    <div className="relative group">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                      <input
                        id="orgName"
                        name="orgName"
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Infosys Campus Screening Desk"
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="orgType" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Entity Type *
                      </label>
                      <select
                        id="orgType"
                        name="orgType"
                        value={orgType}
                        onChange={(e) => setOrgType(e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition-all"
                      >
                        <option value="CORPORATE_EMPLOYER">Corporate Employer / IT</option>
                        <option value="GOVERNMENT_EXAM_BODY">Government Exam Agency</option>
                        <option value="VERIFICATION_AGENCY">Background Screening Desk</option>
                        <option value="FINANCIAL_INSTITUTION">Bank / Student Loan Entity</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contactPerson" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Contact Person *
                      </label>
                      <input
                        id="contactPerson"
                        name="contactPerson"
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="e.g. Rajesh Nair (VP HR)"
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Official Corporate Email *
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                      <input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. verification@infosys.com"
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="orgPurpose" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Primary Verification Purpose *
                    </label>
                    <input
                      id="orgPurpose"
                      name="orgPurpose"
                      type="text"
                      required
                      value={orgPurpose}
                      onChange={(e) => setOrgPurpose(e.target.value)}
                      placeholder="e.g. Campus Recruitment Academic Credential Verification"
                      className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 hover:border-slate-300 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="orgPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Create Password *
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                      <input
                        id="orgPassword"
                        name="orgPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={orgPassword}
                        onChange={(e) => setOrgPassword(e.target.value)}
                        placeholder="Create account password"
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

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>One-Time AICTE Statutory Authorization</span>
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Your registration will be queued for review in the AICTE Command Center. Once approved by AICTE HQ, credential verification queries will be unlocked.
                    </p>
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full !h-11 !rounded-xl !bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-700 hover:!to-violet-700 !text-white !font-semibold !shadow-md !shadow-indigo-200 transition-all"
                      isLoading={isSubmitting}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>Submit for AICTE Approval</span>
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                      </span>
                    </Button>
                  </div>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ← Already registered? Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ================= PUBLIC VERIFICATION PORTAL ================= */}
            <div className="mt-5 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
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
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
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
