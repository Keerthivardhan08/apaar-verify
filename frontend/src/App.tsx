import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Pages
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Institution Pages
import InstitutionLayout from './pages/institution/InstitutionLayout';
import InstitutionOverview from './pages/institution/Overview';
import Students from './pages/institution/Students';
import StudentDetail from './pages/institution/StudentDetail';
import Upload from './pages/institution/Upload';
import UploadHistory from './pages/institution/UploadHistory';
import ValidationIssues from './pages/institution/ValidationIssues';
import Corrections from './pages/institution/Corrections';
import IntakeMonitoring from './pages/institution/IntakeMonitoring';
import Reports from './pages/institution/Reports';
import { InstitutionalApi } from './pages/institution/InstitutionalApi';
import { ApaarQuickDesk } from './pages/institution/ApaarQuickDesk';

// AICTE Pages
import AICTELayout from './pages/aicte/AICTELayout';
import AICTEOverview from './pages/aicte/Overview';
import Institutions from './pages/aicte/Institutions';
import IntegrityMonitoring from './pages/aicte/IntegrityMonitoring';
import ReviewQueue from './pages/aicte/ReviewQueue';
import ReviewDetail from './pages/aicte/ReviewDetail';
import CaseTracking from './pages/aicte/CaseTracking';
import StudentInspector from './pages/aicte/StudentInspector';
import StakeholderApprovals from './pages/aicte/StakeholderApprovals';
import Analytics from './pages/aicte/Analytics';
import IntegrityGraph from './pages/aicte/IntegrityGraph';
import { FreshnessMonitor } from './pages/aicte/FreshnessMonitor';
import InstitutionComplianceDashboard from './pages/aicte/InstitutionComplianceDashboard';

// Student Portal & Stakeholder Workspace
import StudentPortal from './pages/student/StudentPortal';
import StakeholderWorkspace from './pages/stakeholder/StakeholderWorkspace';

// Verification Pages
import VerifyCredential from './pages/verification/VerifyCredential';
import VerificationResult from './pages/verification/VerificationResult';

// Root redirect handler
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading, isAICTEAdmin, isReviewer } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userEmail = user?.email?.toLowerCase() || '';
  const userRoles = user?.roles?.map((r: any) => r.role?.toLowerCase()) || [];

  if (userEmail.includes('student') || userRoles.includes('student')) {
    return <Navigate to="/student" replace />;
  }

  if (
    userEmail.includes('nta') ||
    userEmail.includes('tcs') ||
    userEmail.includes('verifier') ||
    userRoles.includes('stakeholder') ||
    userRoles.includes('verifier')
  ) {
    return <Navigate to="/stakeholder" replace />;
  }

  if (isAICTEAdmin() || isReviewer()) {
    return <Navigate to="/aicte" replace />;
  }

  return <Navigate to="/institution" replace />;
};

// Protected route wrapper
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="System Navigation Error">
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<VerifyCredential />} />
        <Route path="/verify/result" element={<VerificationResult />} />

        {/* Student Portal Gateway */}
        <Route
          path="/student"
          element={
            <RequireAuth>
              <StudentPortal />
            </RequireAuth>
          }
        />

        {/* Stakeholder Verification Workspace */}
        <Route
          path="/stakeholder"
          element={
            <RequireAuth>
              <StakeholderWorkspace />
            </RequireAuth>
          }
        />

        {/* Institution Workspace Routes */}
        <Route
          path="/institution"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route element={<InstitutionLayout />}>
            <Route index element={<InstitutionOverview />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="upload" element={<Upload />} />
            <Route path="apaar-desk" element={<ApaarQuickDesk />} />
            <Route path="uploads" element={<UploadHistory />} />
            <Route path="issues" element={<ValidationIssues />} />
            <Route path="corrections" element={<Corrections />} />
            <Route path="intake" element={<IntakeMonitoring />} />
            <Route path="compliance" element={<InstitutionComplianceDashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="api-keys" element={<InstitutionalApi />} />
          </Route>
        </Route>

        {/* AICTE Command Center Routes */}
        <Route
          path="/aicte"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route element={<AICTELayout />}>
            <Route index element={<AICTEOverview />} />
            <Route path="institutions" element={<Institutions />} />
            <Route path="institutions/:id" element={<InstitutionComplianceDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="student-inspector" element={<StudentInspector />} />
            <Route path="tracking" element={<CaseTracking />} />
            <Route path="stakeholders" element={<StakeholderApprovals />} />
            <Route path="integrity" element={<IntegrityMonitoring />} />
            <Route path="reviews" element={<ReviewQueue />} />
            <Route path="reviews/:id" element={<ReviewDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="graph" element={<IntegrityGraph />} />
            <Route path="freshness" element={<FreshnessMonitor />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
