<<<<<<< HEAD
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
=======
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)
import {
  GraduationCap,
  ShieldCheck,
  KeyRound,
  Mail,
  AlertTriangle,
  ArrowRight,
<<<<<<< HEAD
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
=======
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
} from "lucide-react";

import Button from "../components/ui/Button";
>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
<<<<<<< HEAD
  const [activePersonaEmail, setActivePersonaEmail] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'operators' | 'aicte' | 'stakeholders' | 'students' | 'admins'>('all');
=======

>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

<<<<<<< HEAD
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
=======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const success = await login(email, password);

      if (success) {
        if (from) {
          navigate(from, { replace: true });
        } else if (email.toLowerCase().includes("aicte")) {
          navigate("/aicte", { replace: true });
        } else {
          navigate("/institution", { replace: true });
        }
>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)
      }
    } finally {
      setIsSubmitting(false);
    }
  };

<<<<<<< HEAD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await performLogin(email, password);
=======
  const fillCredentials = (
    demoEmail: string,
    demoPass: string
  ) => {
    setEmail(demoEmail);
    setPassword(demoPass);
>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)
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
<<<<<<< HEAD
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
=======
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      {/* ========================================
          DEMONSTRATION BANNER
      ======================================== */}

      <div className="relative z-20 bg-amber-50 border-b border-amber-200 px-4 py-2.5">

        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">

          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />

          <p className="text-[11px] sm:text-xs font-semibold text-amber-800">
            DEMONSTRATION ENVIRONMENT
            <span className="hidden sm:inline">
              {" "}— Synthetic data for MoE / AICTE APAAR Verification Prototype
            </span>
          </p>

        </div>

      </div>

      {/* ========================================
          MAIN LAYOUT
      ======================================== */}

      <div className="min-h-[calc(100vh-41px)] flex">

        {/* ========================================
            LEFT BRANDING PANEL
        ======================================== */}

        <div
          className="
            hidden lg:flex
            lg:w-[52%]
            xl:w-[55%]
            relative
            overflow-hidden
            bg-gradient-to-br
            from-[#0B1120]
            via-[#172554]
            to-[#312E81]
            text-white
            flex-col
            justify-between
            p-10
            xl:p-16
          "
        >

          {/* Decorative background */}

          <div
            aria-hidden="true"
            className="
              absolute
              -top-40
              -right-40
              w-[500px]
              h-[500px]
              rounded-full
              bg-indigo-500/20
              blur-[100px]
              pointer-events-none
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              bottom-0
              -left-40
              w-[450px]
              h-[450px]
              rounded-full
              bg-purple-500/20
              blur-[100px]
              pointer-events-none
            "
          />

          {/* Grid decoration */}

          <div
            aria-hidden="true"
            className="
              absolute inset-0
              opacity-[0.04]
              pointer-events-none
            "
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Brand */}

          <div className="relative z-10">

            <div className="flex items-center gap-4">

              <div
                className="
                  w-14 h-14
                  rounded-2xl
                  bg-gradient-to-br
                  from-indigo-400
                  to-violet-600
                  flex items-center
                  justify-center
                  shadow-xl
                  shadow-indigo-900/40
                  border border-white/20
                "
              >
                <GraduationCap className="w-8 h-8 text-white" />
>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)
              </div>

              <div>

                <h1 className="text-2xl font-extrabold tracking-tight">
                  APAAR Verify
                </h1>

                <p className="text-xs text-indigo-200 mt-1 tracking-wide">
                  Academic Integrity Platform
                </p>

              </div>

            </div>

<<<<<<< HEAD
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
=======
          </div>

          {/* Main hero */}

          <div className="relative z-10 max-w-xl py-12">

            {/* Badge */}

            <div
              className="
                inline-flex items-center gap-2
                px-4 py-2
                rounded-full
                bg-white/10
                border border-white/15
                backdrop-blur-md
                mb-8
              "
            >

              <Sparkles className="w-4 h-4 text-indigo-300" />

              <span className="text-xs font-semibold text-indigo-100 tracking-wide">
                SMART INDIA HACKATHON 3.0
              </span>

            </div>

            {/* Heading */}

            <h2
              className="
                text-4xl
                xl:text-5xl
                2xl:text-6xl
                font-extrabold
                tracking-tight
                leading-[1.15]
              "
            >
              Building Trust in

              <br />

              <span
                className="
                  bg-gradient-to-r
                  from-[#A5B4FC]
                  via-[#C4B5FD]
                  to-[#E9D5FF]
                  bg-clip-text
                  text-transparent
                "
              >
                Every Academic
              </span>

              <br />

              Record.

            </h2>

            <p className="text-indigo-100/80 text-base xl:text-lg leading-relaxed mt-7 max-w-lg">

              A unified platform for academic credential
              verification, student record validation,
              and institutional compliance monitoring.

            </p>

            {/* Feature list */}

            <div className="mt-10 space-y-5">

              {[
                {
                  icon: ShieldCheck,
                  title: "Trusted Verification",
                  description:
                    "Validate academic credentials with confidence.",
                },
                {
                  icon: Database,
                  title: "Centralized Records",
                  description:
                    "Manage academic data in one unified workspace.",
                },
                {
                  icon: Fingerprint,
                  title: "Academic Integrity",
                  description:
                    "Identify discrepancies and maintain record accuracy.",
                },
              ].map((feature) => {

                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4 group"
                  >

                    <div
                      className="
                        w-11 h-11
                        rounded-xl
                        bg-white/10
                        border border-white/10
                        flex items-center justify-center
                        shrink-0
                        group-hover:bg-white/20
                        transition-all duration-300
                      "
                    >

                      <Icon className="w-5 h-5 text-indigo-200" />

                    </div>

                    <div>

                      <h3 className="text-sm font-semibold text-white">
                        {feature.title}
                      </h3>

                      <p className="text-xs text-indigo-200/70 mt-1 leading-relaxed">
                        {feature.description}
                      </p>

                    </div>

                  </div>
                );
              })}

>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)
            </div>

          </div>

<<<<<<< HEAD
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
=======
          {/* Bottom branding */}

          <div className="relative z-10">

            <div className="h-px bg-white/10 mb-6" />

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Shield className="w-4 h-4 text-indigo-300" />

                <span className="text-xs text-indigo-200/70">
                  Academic Record & Intake Integrity
                </span>

              </div>

              <span className="text-xs text-indigo-200/50">
                Prototype v3.0
              </span>

            </div>

>>>>>>> 8f82353 (Enhance UI UX with modern login and dashboard design)
          </div>

        </div>

        {/* ========================================
            RIGHT LOGIN PANEL
        ======================================== */}

        <div
          className="
            flex-1
            flex flex-col
            justify-center
            items-center
            px-5
            sm:px-10
            lg:px-12
            py-12
            bg-[#F8FAFC]
          "
        >

          <div className="w-full max-w-[440px]">

            {/* Mobile logo */}

            <div className="lg:hidden flex items-center gap-3 mb-10">

              <div
                className="
                  w-11 h-11
                  rounded-xl
                  bg-gradient-to-br
                  from-indigo-600
                  to-violet-600
                  flex items-center justify-center
                  text-white
                  shadow-lg
                  shadow-indigo-200
                "
              >

                <GraduationCap className="w-6 h-6" />

              </div>

              <div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  APAAR Verify
                </h2>

                <p className="text-xs text-slate-500">
                  Academic Integrity Platform
                </p>

              </div>

            </div>

            {/* Login heading */}

            <div className="mb-9">

              <div
                className="
                  inline-flex items-center gap-2
                  px-3 py-1.5
                  rounded-full
                  bg-indigo-50
                  border border-indigo-100
                  mb-5
                "
              >

                <LockKeyhole className="w-3.5 h-3.5 text-indigo-600" />

                <span className="text-xs font-semibold text-indigo-700">
                  Secure Platform Access
                </span>

              </div>

              <h2
                className="
                  text-3xl
                  sm:text-4xl
                  font-extrabold
                  text-slate-900
                  tracking-tight
                "
              >
                Welcome back
                <span className="text-indigo-600">.</span>
              </h2>

              <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                Sign in with your authorized credentials to
                access the APAAR verification dashboard.
              </p>

            </div>

            {/* ========================================
                LOGIN FORM
            ======================================== */}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Official Email Address
                </label>

                <div className="relative group">

                  <Mail
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      w-[18px] h-[18px]
                      text-slate-400
                      group-focus-within:text-indigo-600
                      transition-colors
                      pointer-events-none
                    "
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your official email"
                    className="
                      w-full
                      h-14
                      pl-12 pr-4
                      bg-white
                      border border-slate-200
                      rounded-xl
                      text-sm text-slate-900
                      placeholder:text-slate-400
                      shadow-sm
                      outline-none
                      focus:border-indigo-500
                      focus:ring-4
                      focus:ring-indigo-500/10
                      hover:border-slate-300
                      transition-all duration-200
                    "
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Password
                </label>

                <div className="relative group">

                  <KeyRound
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      w-[18px] h-[18px]
                      text-slate-400
                      group-focus-within:text-indigo-600
                      transition-colors
                      pointer-events-none
                    "
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="
                      w-full
                      h-14
                      pl-12 pr-12
                      bg-white
                      border border-slate-200
                      rounded-xl
                      text-sm text-slate-900
                      placeholder:text-slate-400
                      shadow-sm
                      outline-none
                      focus:border-indigo-500
                      focus:ring-4
                      focus:ring-indigo-500/10
                      hover:border-slate-300
                      transition-all duration-200
                    "
                  />

                  {/* Show/hide password */}

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="
                      absolute right-4 top-1/2
                      -translate-y-1/2
                      text-slate-400
                      hover:text-indigo-600
                      transition-colors
                    "
                  >

                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}

                  </button>

                </div>

              </div>

              {/* Submit button */}

              <div className="pt-2">

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="
                    w-full
                    !h-14
                    !rounded-xl
                    !bg-gradient-to-r
                    !from-indigo-600
                    !to-violet-600
                    hover:!from-indigo-700
                    hover:!to-violet-700
                    !text-white
                    !font-semibold
                    !shadow-lg
                    !shadow-indigo-200/60
                    hover:!shadow-xl
                    hover:!shadow-indigo-200
                    transition-all duration-300
                  "
                  isLoading={isSubmitting}
                >

                  <span className="flex items-center justify-center gap-2">
                    Sign In to Platform

                    {!isSubmitting && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </span>

                </Button>

              </div>

            </form>

            {/* ========================================
                DIVIDER
            ======================================== */}

            <div className="relative my-9">

              <div className="absolute inset-0 flex items-center">

                <div className="w-full border-t border-slate-200" />

              </div>

              <div className="relative flex justify-center">

                <span className="bg-[#F8FAFC] px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Demo Access
                </span>

              </div>

            </div>

            {/* ========================================
                DEMO ACCOUNT CARDS
            ======================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* AICTE */}

              <button
                type="button"
                onClick={() =>
                  fillCredentials(
                    "admin@aicte.gov.in",
                    "Demo@1234"
                  )
                }
                className="
                  group
                  relative
                  text-left
                  p-4
                  rounded-2xl
                  bg-white
                  border border-slate-200
                  hover:border-indigo-300
                  hover:bg-indigo-50/50
                  hover:shadow-lg
                  hover:shadow-indigo-100/50
                  hover:-translate-y-0.5
                  transition-all duration-300
                "
              >

                <div className="flex items-center justify-between mb-4">

                  <div
                    className="
                      w-11 h-11
                      rounded-xl
                      bg-indigo-50
                      flex items-center justify-center
                      group-hover:bg-indigo-100
                      transition-colors
                    "
                  >

                    <ShieldCheck className="w-5 h-5 text-indigo-600" />

                  </div>

                  <ChevronRight
                    className="
                      w-4 h-4
                      text-slate-300
                      group-hover:text-indigo-600
                      group-hover:translate-x-1
                      transition-all
                    "
                  />

                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  AICTE Admin
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  National Administrator
                </p>

                <p className="text-[11px] text-indigo-600 mt-3 font-medium truncate">
                  admin@aicte.gov.in
                </p>

              </button>

              {/* Institution */}

              <button
                type="button"
                onClick={() =>
                  fillCredentials(
                    "operator@iit-demo.edu",
                    "Demo@1234"
                  )
                }
                className="
                  group
                  relative
                  text-left
                  p-4
                  rounded-2xl
                  bg-white
                  border border-slate-200
                  hover:border-emerald-300
                  hover:bg-emerald-50/50
                  hover:shadow-lg
                  hover:shadow-emerald-100/50
                  hover:-translate-y-0.5
                  transition-all duration-300
                "
              >

                <div className="flex items-center justify-between mb-4">

                  <div
                    className="
                      w-11 h-11
                      rounded-xl
                      bg-emerald-50
                      flex items-center justify-center
                      group-hover:bg-emerald-100
                      transition-colors
                    "
                  >

                    <Building2 className="w-5 h-5 text-emerald-600" />

                  </div>

                  <ChevronRight
                    className="
                      w-4 h-4
                      text-slate-300
                      group-hover:text-emerald-600
                      group-hover:translate-x-1
                      transition-all
                    "
                  />

                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  Institution
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Institution Operator
                </p>

                <p className="text-[11px] text-emerald-600 mt-3 font-medium truncate">
                  operator@iit-demo.edu
                </p>

              </button>

            </div>

            <p className="text-center text-[11px] text-slate-400 mt-4">
              Select a demo account to autofill login credentials.
            </p>

            {/* ========================================
                PUBLIC VERIFICATION
            ======================================== */}

            <div className="mt-9 pt-7 border-t border-slate-200">

              <div
                className="
                  flex flex-col sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-4
                "
              >

                <div>

                  <p className="text-sm font-semibold text-slate-800">
                    Need to verify a credential?
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Access the public verification portal.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => navigate("/verify")}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-indigo-600
                    hover:text-indigo-800
                    transition-colors
                    whitespace-nowrap
                  "
                >

                  Verify Now

                  <ArrowRight className="w-4 h-4" />

                </button>

              </div>

            </div>

            {/* ========================================
                SECURITY FOOTER
            ======================================== */}

            <div className="mt-10 flex items-center justify-center gap-2">

              <CheckCircle2 className="w-4 h-4 text-emerald-500" />

              <span className="text-xs text-slate-400">
                Authorized access only
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;