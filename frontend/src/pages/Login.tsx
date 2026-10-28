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
  Sparkles,
  Building2,
  CheckCircle2,
  School,
  Loader2,
  Lock,
  Briefcase,
  UserCheck,
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
    border: string;
    bg: string;
    hoverBg: string;
    hoverBorder: string;
    textColor: string;
    iconColor: string;
  };
}

const DEMO_PERSONAS: DemoPersona[] = [
  // College Operators
  {
    displayName: 'College Operator (DSCE)',
    category: 'operators',
    institutionName: 'Dayananda Sagar College of Engineering',
    email: 'operator@dsce.edu.in',
    password: 'Demo@1234',
    destination: '/institution',
    icon: Building2,
    theme: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/40',
      hoverBg: 'hover:bg-emerald-900/50',
      hoverBorder: 'hover:border-emerald-400/50',
      textColor: 'text-emerald-300 group-hover:text-emerald-200',
      iconColor: 'text-emerald-400',
    },
  },
  {
    displayName: 'College Operator (NIT)',
    category: 'operators',
    institutionName: 'National Institute of Technology (Demo)',
    email: 'operator@nit-demo.edu',
    password: 'Demo@1234',
    destination: '/institution',
    icon: Building2,
    theme: {
      border: 'border-teal-500/30',
      bg: 'bg-teal-950/40',
      hoverBg: 'hover:bg-teal-900/50',
      hoverBorder: 'hover:border-teal-400/50',
      textColor: 'text-teal-300 group-hover:text-teal-200',
      iconColor: 'text-teal-400',
    },
  },
  {
    displayName: 'College Operator (IIT)',
    category: 'operators',
    institutionName: 'Indian Institute of Technology (Demo)',
    email: 'operator@iit-demo.edu',
    password: 'Demo@1234',
    destination: '/institution',
    icon: Building2,
    theme: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/40',
      hoverBg: 'hover:bg-cyan-900/50',
      hoverBorder: 'hover:border-cyan-400/50',
      textColor: 'text-cyan-300 group-hover:text-cyan-200',
      iconColor: 'text-cyan-400',
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
      border: 'border-green-500/30',
      bg: 'bg-green-950/40',
      hoverBg: 'hover:bg-green-900/50',
      hoverBorder: 'hover:border-green-400/50',
      textColor: 'text-green-300 group-hover:text-green-200',
      iconColor: 'text-green-400',
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
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-950/40',
      hoverBg: 'hover:bg-indigo-900/50',
      hoverBorder: 'hover:border-indigo-400/50',
      textColor: 'text-indigo-300 group-hover:text-indigo-200',
      iconColor: 'text-indigo-400',
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
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/40',
      hoverBg: 'hover:bg-purple-900/50',
      hoverBorder: 'hover:border-purple-400/50',
      textColor: 'text-purple-300 group-hover:text-purple-200',
      iconColor: 'text-purple-400',
    },
  },
  // Student Portal Persona
  {
    displayName: 'Student / Candidate (Aarav Sharma)',
    category: 'students',
    institutionName: 'APAAR ID: DEMO-APAAR-1001 (DSCE)',
    email: 'student@dsce.edu.in',
    password: 'Demo@1234',
    destination: '/student',
    icon: GraduationCap,
    theme: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/40',
      hoverBg: 'hover:bg-amber-900/50',
      hoverBorder: 'hover:border-amber-400/50',
      textColor: 'text-amber-300 group-hover:text-amber-200',
      iconColor: 'text-amber-400',
    },
  },
  // External Stakeholders
  {
    displayName: 'National Testing Agency (NTA)',
    category: 'stakeholders',
    institutionName: 'National Exam & Eligibility Agency',
    email: 'nta.verifier@nta.ac.in',
    password: 'Demo@1234',
    destination: '/stakeholder',
    icon: Briefcase,
    theme: {
      border: 'border-blue-500/40',
      bg: 'bg-blue-950/40',
      hoverBg: 'hover:bg-blue-900/50',
      hoverBorder: 'hover:border-blue-400/50',
      textColor: 'text-blue-300 group-hover:text-blue-200',
      iconColor: 'text-blue-400',
    },
  },
  {
    displayName: 'Corporate Verifier (TCS TalentDesk)',
    category: 'stakeholders',
    institutionName: 'Campus Recruitment Verification',
    email: 'tcs.verify@tcs.com',
    password: 'Demo@1234',
    destination: '/stakeholder',
    icon: Briefcase,
    theme: {
      border: 'border-sky-500/40',
      bg: 'bg-sky-950/40',
      hoverBg: 'hover:bg-sky-900/50',
      hoverBorder: 'hover:border-sky-400/50',
      textColor: 'text-sky-300 group-hover:text-sky-200',
      iconColor: 'text-sky-400',
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
      border: 'border-blue-500/30',
      bg: 'bg-blue-950/40',
      hoverBg: 'hover:bg-blue-900/50',
      hoverBorder: 'hover:border-blue-400/50',
      textColor: 'text-blue-300 group-hover:text-blue-200',
      iconColor: 'text-blue-400',
    },
  },
  {
    displayName: 'College Admin (IIT)',
    category: 'admins',
    institutionName: 'Dean of Academic Affairs (IIT)',
    email: 'admin@iit-demo.edu',
    password: 'Demo@1234',
    destination: '/institution',
    icon: School,
    theme: {
      border: 'border-sky-500/30',
      bg: 'bg-sky-950/40',
      hoverBg: 'hover:bg-sky-900/50',
      hoverBorder: 'hover:border-sky-400/50',
      textColor: 'text-sky-300 group-hover:text-sky-200',
      iconColor: 'text-sky-400',
    },
  },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePersonaEmail, setActivePersonaEmail] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'operators' | 'aicte' | 'stakeholders' | 'students' | 'admins'>('all');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const performLogin = async (targetEmail: string, targetPass: string, preferredDestination?: string) => {
    setIsSubmitting(true);
    const success = await login(targetEmail, targetPass);
    setIsSubmitting(false);
    setActivePersonaEmail(null);

    if (success) {
      if (preferredDestination) {
        navigate(preferredDestination, { replace: true });
      } else if (from) {
        navigate(from, { replace: true });
      } else if (targetEmail.includes('student')) {
        navigate('/student', { replace: true });
      } else if (targetEmail.includes('nta') || targetEmail.includes('tcs') || targetEmail.includes('verifier')) {
        navigate('/stakeholder', { replace: true });
      } else if (targetEmail.includes('aicte')) {
        navigate('/aicte', { replace: true });
      } else {
        navigate('/institution', { replace: true });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
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
    <div className="min-h-screen relative flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Liquid Glass Ambient Mesh Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Demo Warning Banner */}
      <div className="fixed top-0 inset-x-0 bg-amber-500/90 backdrop-blur-md text-amber-950 px-4 py-2 text-center text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 z-50 border-b border-amber-400/40">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>DEMONSTRATION SYSTEM — MoE / AICTE National APAAR Verification & Intake Oversight Platform</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mt-6 relative z-10 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 border border-white/20">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          APAAR Verify
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-400">
          One Nation One Student ID • Academic Integrity & Stakeholder Verification Architecture
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        {/* Liquid Glass Container Card */}
        <div className="liquid-glass-dark py-8 px-6 sm:px-10 rounded-3xl border border-white/15 shadow-2xl backdrop-blur-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Official Email Address
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aicte.gov.in"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-3 text-sm font-bold shadow-lg shadow-indigo-600/30"
                isLoading={isSubmitting && !activePersonaEmail}
              >
                Sign In to Platform
              </Button>
            </div>
          </form>

          {/* Quick Demonstration 1-Click Login Personas (ZERO USERNAMES DISPLAYED) */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Demonstration Personas</span>
              </p>

              {/* Category Filter Pills */}
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
                        ? 'bg-indigo-600/80 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Cards Grid (Strictly NO email / username text displayed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredPersonas.map((persona) => {
                const isLoadingThis = isSubmitting && activePersonaEmail === persona.email;
                return (
                  <button
                    key={persona.displayName}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handle1ClickLogin(persona)}
                    className={`text-left p-2.5 rounded-xl border ${persona.theme.border} ${persona.theme.bg} ${persona.theme.hoverBg} ${persona.theme.hoverBorder} transition-all duration-200 group flex flex-col justify-between disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`flex items-center space-x-1.5 text-xs font-bold ${persona.theme.textColor}`}>
                        <persona.icon className={`w-3.5 h-3.5 shrink-0 ${persona.theme.iconColor}`} />
                        <span className="truncate">{persona.displayName}</span>
                      </div>
                      {isLoadingThis && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0 ml-1" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate pl-5">
                      {persona.institutionName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Architecture Highlight */}
          <div className="mt-5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-center">
            <div className="text-[11px] text-indigo-300 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Default student record access restricted strictly to Institution & AICTE HQ.</span>
            </div>
          </div>

          {/* Public Verifier Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/verify')}
              className="inline-flex items-center text-xs font-semibold text-indigo-300 hover:text-white transition-colors"
            >
              <span>Verify an Issued Academic Credential (No Login Required)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
