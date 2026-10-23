import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, ShieldCheck, KeyRound, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Demo Warning Banner */}
      <div className="fixed top-0 inset-x-0 bg-amber-500 text-amber-950 px-4 py-2 text-center text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>DEMONSTRATION SYSTEM — Synthetic Data for MoE/AICTE APAAR Verification Prototype</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          APAAR Verify
        </h2>
        <p className="mt-1 text-center text-sm text-gray-600">
          Academic Record & Intake Integrity Regulatory Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-200 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Official Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
                  placeholder="officer@institution.edu or admin@aicte.gov.in"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* Demo account quick login helper */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
              Quick Demonstration Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@aicte.gov.in', 'Demo@1234')}
                className="text-left p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AICTE National Admin</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">admin@aicte.gov.in</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('operator@iit-demo.edu', 'Demo@1234')}
                className="text-left p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Institution Operator</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">operator@iit-demo.edu</div>
              </button>
            </div>
          </div>

          {/* Credential verifier public link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/verify')}
              className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-indigo-700 transition-colors"
            >
              <span>Verify an Issued Academic Credential</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
