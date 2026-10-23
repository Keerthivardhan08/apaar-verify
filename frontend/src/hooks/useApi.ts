// ============================================================
// APAAR Verify — React Query Hooks for Data Fetching
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  institutionApi,
  programApi,
  intakeApi,
  studentApi,
  uploadApi,
  issueApi,
  reviewApi,
  dashboardApi,
  verificationApi,
  auditApi,
  notificationApi,
  reportsApi,
} from '../services/api';
import {
  StudentFilterParams,
  IssueFilterParams,
  AuditFilterParams,
  IssueDecisionRequest,
} from '../types';
import toast from 'react-hot-toast';

// ─── Dashboard Queries ───────────────────────────────────────

export const useDashboardSummary = (params?: { institution_id?: string; admission_cycle?: string }) => {
  return useQuery({
    queryKey: ['dashboard-summary', params],
    queryFn: () => dashboardApi.getSummary(params),
  });
};

export const useIntakeSummary = (params?: { institution_id?: string; admission_cycle?: string }) => {
  return useQuery({
    queryKey: ['intake-summary', params],
    queryFn: () => dashboardApi.getIntake(params),
  });
};

export const useDataQualityTrend = (params?: { institution_id?: string; days?: number }) => {
  return useQuery({
    queryKey: ['data-quality-trend', params],
    queryFn: () => dashboardApi.getDataQuality(params),
  });
};

// ─── Institution Queries ─────────────────────────────────────

export const useInstitutions = (params?: { state?: string; type?: string; search?: string }) => {
  return useQuery({
    queryKey: ['institutions', params],
    queryFn: () => institutionApi.getInstitutions(params),
  });
};

export const useInstitution = (id?: string) => {
  return useQuery({
    queryKey: ['institution', id],
    queryFn: () => institutionApi.getInstitution(id!),
    enabled: Boolean(id),
  });
};

export const useInstitutionStats = (id?: string) => {
  return useQuery({
    queryKey: ['institution-stats', id],
    queryFn: () => institutionApi.getInstitutionStats(id!),
    enabled: Boolean(id),
  });
};

// ─── Programs & Intake Queries ───────────────────────────────

export const usePrograms = (institutionId?: string) => {
  return useQuery({
    queryKey: ['programs', institutionId],
    queryFn: () => programApi.getPrograms(institutionId),
  });
};

export const useIntakeLimits = (programId?: string, cycle?: string) => {
  return useQuery({
    queryKey: ['intake-limits', programId, cycle],
    queryFn: () => intakeApi.getIntakeLimits(programId, cycle),
  });
};

// ─── Student Queries & Mutations ─────────────────────────────

export const useStudents = (params?: StudentFilterParams) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentApi.getStudents(params),
  });
};

export const useStudent = (id?: string) => {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.getStudent(id!),
    enabled: Boolean(id),
  });
};

export const useStudentHistory = (id?: string) => {
  return useQuery({
    queryKey: ['student-history', id],
    queryFn: () => studentApi.getStudentHistory(id!),
    enabled: Boolean(id),
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentApi.createStudent,
    onSuccess: () => {
      toast.success('Student record created successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create student record');
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentApi.updateStudent(id, data),
    onSuccess: (_, variables) => {
      toast.success('Student record updated');
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update student');
    },
  });
};

export const useRequestCorrection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { field_name: string; proposed_value: string; justification: string } }) =>
      studentApi.requestCorrection(id, data),
    onSuccess: () => {
      toast.success('Correction request submitted');
      queryClient.invalidateQueries({ queryKey: ['corrections'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to submit correction request');
    },
  });
};

export const useCorrections = (params?: { institution_id?: string; status?: string }) => {
  return useQuery({
    queryKey: ['corrections', params],
    queryFn: () => studentApi.getCorrections(params),
  });
};

// ─── Uploads ─────────────────────────────────────────────────

export const useUploads = (params?: { institution_id?: string; page?: number; size?: number }) => {
  return useQuery({
    queryKey: ['uploads', params],
    queryFn: () => uploadApi.getUploads(params),
  });
};

export const useUpload = (id?: string) => {
  return useQuery({
    queryKey: ['upload', id],
    queryFn: () => uploadApi.getUpload(id!),
    enabled: Boolean(id),
  });
};

export const useUploadIssues = (id?: string) => {
  return useQuery({
    queryKey: ['upload-issues', id],
    queryFn: () => uploadApi.getUploadIssues(id!),
    enabled: Boolean(id),
  });
};

export const useCommitUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: 'strict' | 'partial' }) => uploadApi.commitUpload(id, mode),
    onSuccess: () => {
      toast.success('Upload batch committed successfully');
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to commit upload batch');
    },
  });
};

// ─── Validation Issues & Reviews ─────────────────────────────

export const useIssues = (params?: IssueFilterParams) => {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: () => issueApi.getIssues(params),
  });
};

export const useIssue = (id?: string) => {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => issueApi.getIssue(id!),
    enabled: Boolean(id),
  });
};

export const useResolveIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => issueApi.resolveIssue(id, reason),
    onSuccess: () => {
      toast.success('Issue marked as resolved');
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to resolve issue');
    },
  });
};

export const useReviews = (params?: IssueFilterParams) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewApi.getReviews(params),
  });
};

export const useMakeDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, decision, reason }: { issueId: string; decision: IssueDecisionRequest['decision']; reason: string }) =>
      reviewApi.makeDecision(issueId, decision, reason),
    onSuccess: () => {
      toast.success('Decision recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to record decision');
    },
  });
};

export const useAssignReviewer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, userId }: { issueId: string; userId: string }) => reviewApi.assignReviewer(issueId, userId),
    onSuccess: () => {
      toast.success('Reviewer assigned');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to assign reviewer');
    },
  });
};

// ─── Verification ────────────────────────────────────────────

export const useVerifyToken = () => {
  return useMutation({
    mutationFn: (token: string) => verificationApi.verifyToken(token),
  });
};

// ─── Audit ───────────────────────────────────────────────────

export const useAuditEvents = (params?: AuditFilterParams) => {
  return useQuery({
    queryKey: ['audit-events', params],
    queryFn: () => auditApi.getAuditEvents(params),
  });
};

// ─── Notifications ───────────────────────────────────────────

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: 30000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
