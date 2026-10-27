import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, ShieldCheck, KeyRound, Mail, AlertTriangle, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import Button from '../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      if (from) {
        navigate(from, { replace: true });
      } else if (email.includes('aicte')) {
        navigate('/aicte', { replace: true });
      } else {
        navigate('/institution', { replace: true });
      }
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Liquid Glass Ambient Mesh Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Demo Warning Banner */}
      <div className="fixed top-0 inset-x-0 bg-amber-500/90 backdrop-blur-md text-amber-950 px-4 py-2 text-center text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 z-50 border-b border-amber-400/40">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>DEMONSTRATION SYSTEM — Synthetic Data for MoE/AICTE APAAR Verification Prototype</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6 relative z-10 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 border border-white/20">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          APAAR Verify
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-400">
          Academic Data Integrity & Intake Compliance Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
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
                isLoading={isSubmitting}
              >
                Sign In to Platform
              </Button>
            </div>
          </form>

          {/* Quick Demonstration 1-Click Fillers */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Demonstration Personas</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@aicte.gov.in', 'Demo@1234')}
                className="text-left p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/50 hover:border-indigo-400/50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AICTE National Admin</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">admin@aicte.gov.in</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('operator@iit-demo.edu', 'Demo@1234')}
                className="text-left p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 hover:border-emerald-400/50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>College Operator</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">operator@iit-demo.edu</div>
              </button>
            </div>
          </div>

          {/* Public Verifier Link */}
          <div className="mt-6 text-center">
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
