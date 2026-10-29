import React from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import {
  useDashboardSummary,
  useInstitution,
  useUploads,
  useIssues,
  useIntakeSummary,
} from "../../hooks/useApi";

import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import SeverityBadge from "../../components/ui/SeverityBadge";
import EnrolmentChart from "../../components/charts/EnrolmentChart";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorState from "../../components/ui/ErrorState";

import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  UploadCloud,
  ArrowRight,
  School,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  Activity,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
} from "lucide-react";

export const InstitutionOverview: React.FC = () => {
  const navigate = useNavigate();

  const { getUserInstitutionId } = useAuth();

  const institutionId = getUserInstitutionId() || undefined;

  // Dashboard API
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useDashboardSummary({
    institution_id: institutionId,
  });

  // Institution API
  const { data: institution } = useInstitution(institutionId);

  // Uploads API
  const {
    data: uploadsData,
    isLoading: isUploadsLoading,
  } = useUploads({
    institution_id: institutionId,
    size: 5,
  });

  // Issues API
  const {
    data: issuesData,
    isLoading: isIssuesLoading,
  } = useIssues({
    institution_id: institutionId,
    size: 5,
  });

  // Intake API
  const {
    data: intakeData,
    isLoading: isIntakeLoading,
  } = useIntakeSummary({
    institution_id: institutionId,
  });

  if (isSummaryError) {
    return <ErrorState onRetry={refetchSummary} />;
  }

  const institutionName =
    institution?.name || "Academic Institution";

  const recentUploads = uploadsData?.items || [];
  const recentIssues = issuesData?.items || [];

  const totalStudents = summary?.total_records ?? 0;
  const validRecords = summary?.valid_records ?? 0;
  const flaggedRecords = summary?.flagged_records ?? 0;
  const pendingIssues = summary?.pending_review ?? 0;

  const verificationRate =
    totalStudents > 0
      ? ((validRecords / totalStudents) * 100).toFixed(1)
      : "0.0";

  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      subtitle: "Registered student records",
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      background: "bg-blue-50",
      color: "text-blue-600",
      route: "/institution/students",
    },
    {
      title: "Valid Records",
      value: validRecords,
      subtitle: "Successfully validated",
      icon: CheckCircle2,
      gradient: "from-emerald-400 to-green-600",
      background: "bg-emerald-50",
      color: "text-emerald-600",
      route: "/institution/students?record_status=accepted",
    },
    {
      title: "Flagged Records",
      value: flaggedRecords,
      subtitle: "Require attention",
      icon: AlertTriangle,
      gradient: "from-orange-400 to-rose-500",
      background: "bg-orange-50",
      color: "text-orange-600",
      route: "/institution/students?record_status=flagged",
    },
    {
      title: "Pending Issues",
      value: pendingIssues,
      subtitle: "Awaiting resolution",
      icon: Clock3,
      gradient: "from-violet-500 to-purple-600",
      background: "bg-purple-50",
      color: "text-purple-600",
      route: "/institution/issues?status=open",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] space-y-8 animate-fade-in">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />

            <span className="text-xs font-bold tracking-widest uppercase text-indigo-600">
              Institution Workspace
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>

          <p className="text-slate-500 mt-2 text-sm">
            Monitor academic records, verification progress,
            and institutional activity.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">

            <CalendarDays className="w-4 h-4 text-indigo-600" />

            <span className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>

          </div>

        </div>
      </div>

      {/* ================= WELCOME BANNER ================= */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4338CA] via-[#6366F1] to-[#7C3AED] p-7 md:p-10 text-white shadow-xl shadow-indigo-200/40">

        {/* Decorative Elements */}

        <div className="absolute -right-20 -top-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute right-20 -bottom-32 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 mb-5">

              <School className="w-4 h-4" />

              <span className="text-xs font-semibold">
                Institution Code:{" "}
                {institution?.institution_code || "N/A"}
              </span>

            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Welcome to {institutionName}
            </h2>

            <p className="mt-4 text-indigo-100 text-sm md:text-base leading-relaxed">
              Your intelligent academic verification workspace.
              Manage student records, monitor validation,
              track enrollment, and maintain institutional
              compliance with confidence.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">

              <button
                onClick={() => navigate("/institution/upload")}
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-50 hover:-translate-y-0.5 transition-all duration-300"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Student Data
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate("/institution/issues")}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all duration-300"
              >
                <AlertTriangle className="w-4 h-4" />
                View Issues
              </button>

            </div>

          </div>

          {/* Verification Summary */}

          <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl p-6 min-w-[230px]">

            <div className="flex items-center justify-between mb-4">

              <span className="text-sm text-indigo-100">
                Verification Rate
              </span>

              <ShieldCheck className="w-5 h-5 text-white" />

            </div>

            <h3 className="text-4xl font-extrabold">
              {isSummaryLoading ? "—" : `${verificationRate}%`}
            </h3>

            <p className="text-xs text-indigo-100 mt-2">
              Validated student records
            </p>

            <div className="mt-5 h-2 bg-white/20 rounded-full overflow-hidden">

              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, Number(verificationRate))
                  )}%`,
                }}
              />

            </div>

          </div>

        </div>
      </div>

      {/* ================= STATISTICS ================= */}

      <div>

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Key Statistics
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Real-time institutional overview
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full">

            <Activity className="w-3.5 h-3.5" />

            Dashboard Analytics

          </div>

        </div>

        {isSummaryLoading ? (

          <LoadingSpinner message="Loading institution statistics..." />

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            {stats.map((stat) => {

              const Icon = stat.icon;

              return (
                <button
                  key={stat.title}
                  onClick={() => navigate(stat.route)}
                  className="group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex-1">

                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <h3 className="text-3xl font-extrabold text-slate-900 mt-3">
                        {stat.value.toLocaleString()}
                      </h3>

                      <p className="text-xs text-slate-400 mt-2">
                        {stat.subtitle}
                      </p>

                    </div>

                    <div className={`w-12 h-12 rounded-xl ${stat.background} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>

                      <Icon className={`w-6 h-6 ${stat.color}`} />

                    </div>

                  </div>

                  <div className="flex items-center gap-1 mt-5 text-xs font-semibold text-indigo-600">

                    View Details

                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />

                  </div>

                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`} />

                </button>
              );
            })}

          </div>

        )}

      </div>

      {/* ================= ANALYTICS SECTION ================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Enrollment Chart */}

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">

                <BarChart3 className="w-5 h-5 text-indigo-600" />

              </div>

              <div>

                <h3 className="font-bold text-slate-900 text-lg">
                  Program Intake Analytics
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Enrollment vs approved capacity
                </p>

              </div>

            </div>

            <button
              onClick={() => navigate("/institution/intake")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View Analytics
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

          <div className="p-6">

            {isIntakeLoading ? (

              <LoadingSpinner message="Loading intake analytics..." />

            ) : (

              <EnrolmentChart
                data={
                  intakeData?.map((item) => ({
                    program_name: item.program_name,
                    enrolled: item.enrolled_count,
                    capacity: item.approved_capacity,
                    utilization_pct: item.utilization_pct,
                  })) || []
                }
                height={300}
              />

            )}

          </div>

        </div>

        {/* ================= ISSUES PANEL ================= */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-slate-100">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">

                  <AlertTriangle className="w-5 h-5 text-orange-500" />

                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Validation Issues
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Recent discrepancies
                  </p>

                </div>

              </div>

              <button
                onClick={() => navigate("/institution/issues")}
                className="text-indigo-600 hover:text-indigo-800"
                aria-label="View all validation issues"
              >
                <ArrowUpRight className="w-5 h-5" />
              </button>

            </div>

          </div>

          {isIssuesLoading ? (

            <div className="p-8">
              <LoadingSpinner size="sm" />
            </div>

          ) : recentIssues.length === 0 ? (

            <div className="p-10 text-center">

              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">

                <CheckCircle2 className="w-7 h-7 text-emerald-500" />

              </div>

              <h4 className="font-semibold text-slate-800">
                All Clear!
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                No validation issues found.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">

              {recentIssues.map((issue) => (

                <button
                  key={issue.id}
                  onClick={() => navigate("/institution/issues")}
                  className="w-full text-left p-5 hover:bg-slate-50 transition-colors"
                >

                  <div className="flex items-center justify-between gap-2 mb-2">

                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                      {issue.rule_code}
                    </span>

                    <SeverityBadge severity={issue.severity} />

                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">

                    <span className="capitalize">
                      {issue.status}
                    </span>

                    <span>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>

                  </div>

                </button>

              ))}

            </div>

          )}

          <div className="p-4 border-t border-slate-100">

            <button
              onClick={() => navigate("/institution/issues")}
              className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold transition-colors"
            >
              View All Issues
            </button>

          </div>

        </div>

      </div>

      {/* ================= QUICK ACTIONS ================= */}

      <div>

        <div className="mb-5">

          <h2 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Access frequently used tools
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {[
            {
              title: "Upload Records",
              description: "Import student data",
              icon: UploadCloud,
              route: "/institution/upload",
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              title: "Manage Students",
              description: "View student records",
              icon: Users,
              route: "/institution/students",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              title: "Resolve Issues",
              description: "Review flagged records",
              icon: ShieldCheck,
              route: "/institution/issues",
              color: "text-orange-600",
              bg: "bg-orange-50",
            },
            {
              title: "Intake Compliance",
              description: "Monitor approved intake",
              icon: TrendingUp,
              route: "/institution/compliance",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
          ].map((action) => {

            const Icon = action.icon;

            return (

              <button
                key={action.title}
                onClick={() => navigate(action.route)}
                className="group flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left"
              >

                <div className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center shrink-0`}>

                  <Icon className={`w-5 h-5 ${action.color}`} />

                </div>

                <div className="min-w-0 flex-1">

                  <h4 className="font-bold text-slate-900 text-sm">
                    {action.title}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    {action.description}
                  </p>

                </div>

                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />

              </button>

            );

          })}

        </div>

      </div>

      {/* ================= UPLOAD HISTORY ================= */}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">

              <FileSpreadsheet className="w-5 h-5 text-purple-600" />

            </div>

            <div>

              <h3 className="font-bold text-slate-900 text-lg">
                Recent Upload Batches
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Latest student data submissions
              </p>

            </div>

          </div>

          <button
            onClick={() => navigate("/institution/uploads")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View All Uploads
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

        {isUploadsLoading ? (

          <div className="p-10">
            <LoadingSpinner size="sm" />
          </div>

        ) : recentUploads.length === 0 ? (

          <div className="p-12 text-center">

            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">

              <UploadCloud className="w-8 h-8 text-indigo-500" />

            </div>

            <h4 className="font-bold text-slate-800">
              No Uploads Yet
            </h4>

            <p className="text-sm text-slate-500 mt-2">
              Start by uploading your first student data batch.
            </p>

            <div className="mt-5">

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/institution/upload")}
              >
                Upload First Batch
              </Button>

            </div>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-full text-sm text-left">

              <thead className="bg-slate-50 border-b border-slate-100">

                <tr className="text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4 font-semibold">
                    File Name
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Admission Cycle
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Date
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-4 font-semibold text-right">
                    Total
                  </th>

                  <th className="px-6 py-4 font-semibold text-right">
                    Valid
                  </th>

                  <th className="px-6 py-4 font-semibold text-right">
                    Invalid
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {recentUploads.map((batch) => (

                  <tr
                    key={batch.id}
                    onClick={() => navigate("/institution/uploads")}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">

                          <FileSpreadsheet className="w-4 h-4 text-indigo-600" />

                        </div>

                        <span className="font-semibold text-slate-800">
                          {batch.file_name}
                        </span>

                      </div>

                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {batch.admission_cycle}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={batch.status} />
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-slate-700">
                      {batch.total_rows.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                      {batch.valid_rows.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-rose-600">
                      {batch.invalid_rows.toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ================= FOOTER ================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} APAAR Verify • Academic Verification Platform
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-400">

          <ShieldCheck className="w-4 h-4 text-emerald-500" />

          Secure Academic Records Management

        </div>

      </div>

    </div>
  );
};

export default InstitutionOverview;