import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
  Database,
  ChevronRight,
} from "lucide-react";

import Button from "../components/ui/Button";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (
    location.state as {
      from?: {
        pathname?: string;
      };
    } | null
  )?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password || isSubmitting) {
      return;
    }

    setLoginError("");
    setIsSubmitting(true);

    try {
      const success = await login(email.trim(), password);

      if (success) {
        if (from && from.startsWith("/") && !from.startsWith("//")) {
          navigate(from, { replace: true });
        } else if (email.toLowerCase().includes("aicte")) {
          navigate("/aicte", { replace: true });
        } else {
          navigate("/institution", { replace: true });
        }
      } else {
        setLoginError(
          "Unable to sign in. Please check your credentials and try again."
        );
      }
    } catch {
      setLoginError(
        "Something went wrong while signing in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoginError("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* DEMONSTRATION BANNER */}

      <div className="relative z-20 border-b border-amber-200 bg-amber-50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />

          <p className="text-xs font-semibold text-amber-800 sm:text-sm">
            DEMONSTRATION ENVIRONMENT
            <span className="hidden sm:inline">
              {" "}
              — Synthetic Data for MoE / AICTE APAAR Verification Prototype
            </span>
          </p>
        </div>
      </div>

      {/* MAIN LAYOUT */}

      <div className="flex min-h-[calc(100vh-45px)]">
        {/* LEFT BRANDING PANEL */}

        <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-10 text-white lg:flex xl:w-[55%] xl:p-16">
          {/* Background decorations */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* BRAND */}

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-400 to-violet-600 shadow-xl">
              <GraduationCap className="h-8 w-8" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                APAAR Verify
              </h1>

              <p className="mt-1 text-xs tracking-wide text-indigo-200">
                Academic Integrity Platform
              </p>
            </div>
          </div>

          {/* HERO CONTENT */}

          <div className="relative z-10 max-w-xl py-12">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-indigo-300" />

              <span className="text-xs font-semibold tracking-wide text-indigo-100">
                SMART INDIA HACKATHON PROJECT
              </span>
            </div>

            <h2 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
              Building Trust in
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-200 bg-clip-text text-transparent">
                Every Academic
              </span>
              <br />
              Record.
            </h2>

            <p className="mt-7 max-w-lg text-base leading-relaxed text-indigo-100/80">
              A unified platform for academic credential verification,
              student record validation, and institutional compliance
              monitoring.
            </p>

            {/* FEATURES */}

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-indigo-200" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Trusted Verification
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-indigo-200/70">
                    Validate academic credentials with confidence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <Database className="h-5 w-5 text-indigo-200" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Centralized Academic Records
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-indigo-200/70">
                    Manage institutional data in one unified workspace.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <Fingerprint className="h-5 w-5 text-indigo-200" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Academic Integrity
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-indigo-200/70">
                    Identify discrepancies and improve record accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LEFT FOOTER */}

          <div className="relative z-10">
            <div className="mb-6 h-px bg-white/10" />

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-indigo-200/70">
                Academic Record & Intake Integrity
              </span>

              <span className="text-xs text-indigo-200/50">
                SIH Prototype
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}

        <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-5 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-[440px]">
            {/* MOBILE LOGO */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
                <GraduationCap className="h-7 w-7" />
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

            {/* LOGIN HEADING */}

            <div className="mb-9">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5">
                <LockKeyhole className="h-3.5 w-3.5 text-indigo-600" />

                <span className="text-xs font-semibold text-indigo-700">
                  Secure Platform Access
                </span>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Welcome back
                <span className="text-indigo-600">.</span>
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Sign in with your authorized credentials to access the
                APAAR verification dashboard.
              </p>
            </div>

            {/* LOGIN FORM */}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Official Email Address
                </label>

                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLoginError("");
                    }}
                    placeholder="Enter your official email"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="group relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError("");
                    }}
                    placeholder="Enter your password"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* LOGIN ERROR */}

              {loginError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}

              {/* SUBMIT BUTTON */}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                <span className="flex items-center justify-center gap-2">
                  Sign In to Platform

                  {!isSubmitting && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </span>
              </Button>
            </form>

            {/* DIVIDER */}

            <div className="relative my-9">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-slate-50 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Demo Access
                </span>
              </div>
            </div>

            {/* DEMO ACCOUNT CARDS */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* AICTE ADMIN */}

              <button
                type="button"
                onClick={() =>
                  fillCredentials(
                    "admin@aicte.gov.in",
                    "Demo@1234"
                  )
                }
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  AICTE Admin
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  National Administrator
                </p>

                <p className="mt-3 truncate text-[11px] font-medium text-indigo-600">
                  admin@aicte.gov.in
                </p>
              </button>

              {/* INSTITUTION OPERATOR */}

              <button
                type="button"
                onClick={() =>
                  fillCredentials(
                    "operator@iit-demo.edu",
                    "Demo@1234"
                  )
                }
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  Institution
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Institution Operator
                </p>

                <p className="mt-3 truncate text-[11px] font-medium text-emerald-600">
                  operator@iit-demo.edu
                </p>
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              Select a demo account to autofill login credentials.
            </p>

            {/* PUBLIC VERIFICATION */}

            <div className="mt-9 border-t border-slate-200 pt-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Need to verify a credential?
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Access the public verification portal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/verify")}
                  className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                >
                  Verify Now
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* SECURITY FOOTER */}

            <div className="mt-10 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />

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