// ============================================================
// APAAR Verify — API Client & Service Methods
// ============================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import {
  User,
  Institution,
  InstitutionStats,
  InstitutionPortfolio,
  Program,
  IntakeLimit,
  StudentRecord,
  StudentRecordHistory,
  CorrectionRequest,
  UploadBatch,
  ValidationIssue,
  IssueDecisionRequest,
  DashboardSummary,
  IntakeSummary,
  AuditEvent,
  Credential,
  CredentialVerificationResult,
  Notification,
  PaginatedResponse,
  StudentFilterParams,
  IssueFilterParams,
  AuditFilterParams,
  ProviderInfo,
  ProviderSyncResult,
  VerificationPurpose,
  ConsentRecord,
  JWKSResponse,
  PKIMetadata,
  InstitutionalApiKey,
  InstitutionalWebhook,
  FreshnessOverview,
  FreshnessProfile,
  ReconciliationReport,
  ExpandedCorrection,
  BlindedProof,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('apaar_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.response?.data?.message || error.message;

    if (status === 401) {
      localStorage.removeItem('apaar_token');
      localStorage.removeItem('apaar_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error(message || 'Access denied. You do not have permission to perform this action.');
    } else if (status === 500) {
      toast.error('Internal server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Auth Services
// ============================================================

export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> => {
    // Support OAuth2 password flow (form-urlencoded or json)
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch {
      // Fallback to JSON payload if server expects JSON
      const jsonResponse = await apiClient.post('/auth/login', { email, password });
      return jsonResponse.data;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Logout endpoint error or unavailable:', e);
    } finally {
      localStorage.removeItem('apaar_token');
      localStorage.removeItem('apaar_user');
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>('/me');
      return response.data;
    } catch {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    }
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await apiClient.post<{ access_token: string }>('/auth/refresh');
    return response.data;
  },

  registerStudent: async (data: {
    apaar_id: string;
    email: string;
    password: string;
    full_name?: string;
  }): Promise<{ access_token: string; token_type: string; user: User }> => {
    const response = await apiClient.post('/auth/register-student', data);
    return response.data;
  },

  registerStakeholder: async (data: {
    organization_name: string;
    entity_type: string;
    contact_email: string;
    contact_person: string;
    purpose: string;
    password: string;
  }): Promise<{ status: string; message: string; registration_status: string }> => {
    const response = await apiClient.post('/auth/register-stakeholder', data);
    return response.data;
  },
};

// ============================================================
// Institution Services
// ============================================================

export const institutionApi = {
  getInstitutions: async (params?: { state?: string; type?: string; search?: string }): Promise<Institution[]> => {
    const response = await apiClient.get<Institution[] | PaginatedResponse<Institution>>('/institutions', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },

  getInstitution: async (id: string): Promise<Institution> => {
    const response = await apiClient.get<Institution>(`/institutions/${id}`);
    return response.data;
  },

  getInstitutionStats: async (id: string): Promise<InstitutionStats> => {
    const response = await apiClient.get<InstitutionStats>(`/institutions/${id}/stats`);
    return response.data;
  },

  getComplianceDashboard: async (id: string, cycle?: string): Promise<any> => {
    const params = cycle ? { cycle } : {};
    const response = await apiClient.get<any>(`/institutions/${id}/compliance-dashboard`, { params });
    return response.data;
  },

  getInstitutionPortfolio: async (id: string): Promise<InstitutionPortfolio> => {
    const response = await apiClient.get<InstitutionPortfolio>('/institutions/' + id + '/portfolio');
    return response.data;
  },
};

// ============================================================
// Program Services
// ============================================================

export const programApi = {
  getPrograms: async (institutionId?: string): Promise<Program[]> => {
    const params = institutionId ? { institution_id: institutionId } : {};
    const response = await apiClient.get<Program[] | PaginatedResponse<Program>>('/programs', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },

  getProgram: async (id: string): Promise<Program> => {
    const response = await apiClient.get<Program>(`/programs/${id}`);
    return response.data;
  },
};

// ============================================================
// Intake Limits Services
// ============================================================

export const intakeApi = {
  getIntakeLimits: async (programId?: string, cycle?: string): Promise<IntakeLimit[]> => {
    const params: Record<string, string> = {};
    if (programId) params.program_id = programId;
    if (cycle) params.admission_cycle = cycle;
    const response = await apiClient.get<IntakeLimit[] | PaginatedResponse<IntakeLimit>>('/intake-limits', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },
};

// ============================================================
// Student Records Services
// ============================================================

export const studentApi = {
  getStudents: async (params?: StudentFilterParams): Promise<PaginatedResponse<StudentRecord>> => {
    const response = await apiClient.get<PaginatedResponse<StudentRecord> | StudentRecord[]>('/students', { params });
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: params?.page || 1,
        size: params?.size || 10,
        pages: Math.ceil(response.data.length / (params?.size || 10)) || 1,
      };
    }
    return response.data;
  },

  getStudent: async (id: string): Promise<StudentRecord> => {
    const response = await apiClient.get<StudentRecord>(`/students/${id}`);
    return response.data;
  },

  searchInspector: async (query: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/students/search-inspector', { params: { query } });
    return response.data;
  },

    getAcademicDossier: async (apaarId: string): Promise<any> => {
    const response = await apiClient.get<any>('/students/academic-dossier', { params: { apaar_id: apaarId } });
    return response.data;
  },

  getCorrectionRequests: async (params?: { student_id?: string; apaar_id?: string }): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/students/correction-requests', { params });
    return response.data;
  },

  institutionEndorseCorrection: async (workflowId: string, notes: string = ''): Promise<any> => {
    const response = await apiClient.post<any>('/students/correction-requests/' + workflowId + '/institution-endorse', { notes });
    return response.data;
  },

  aicteApproveCorrection: async (workflowId: string, notes: string = ''): Promise<any> => {
    const response = await apiClient.post<any>('/students/correction-requests/' + workflowId + '/aicte-approve', { notes });
    return response.data;
  },
  raiseCorrection: async (data: { student_id: string; field_to_update: string; new_value: string; reason: string }): Promise<any> => {
    const response = await apiClient.post<any>('/students/raise-correction', data);
    return response.data;
  },

  lookupByApaar: async (apaarId: string): Promise<{
    student: StudentRecord;
    program_code: string;
    program_name: string;
    institution_name: string;
    open_issues_count: number;
    open_issues: Array<{
      rule_code: string;
      severity: string;
      description: string;
      affected_field: string;
    }>;
    versions_count: number;
  }> => {
    const response = await apiClient.get('/students/lookup/by-apaar', {
      params: { apaar_id: apaarId },
    });
    return response.data;
  },

  createStudent: async (data: Partial<StudentRecord>): Promise<StudentRecord> => {
    const response = await apiClient.post<StudentRecord>('/students', data);
    return response.data;
  },

  updateStudent: async (id: string, data: Partial<StudentRecord>): Promise<StudentRecord> => {
    const response = await apiClient.put<StudentRecord>(`/students/${id}`, data);
    return response.data;
  },

  getStudentHistory: async (id: string): Promise<StudentRecordHistory[]> => {
    const response = await apiClient.get<StudentRecordHistory[]>(`/students/${id}/history`);
    return response.data;
  },

  requestCorrection: async (
    id: string,
    data: { field_name: string; proposed_value: string; justification: string }
  ): Promise<CorrectionRequest> => {
    const response = await apiClient.post<CorrectionRequest>(`/students/${id}/corrections`, data);
    return response.data;
  },

  getCorrections: async (params?: { institution_id?: string; status?: string }): Promise<CorrectionRequest[]> => {
    const response = await apiClient.get<CorrectionRequest[] | PaginatedResponse<CorrectionRequest>>('/corrections', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },
};

// ============================================================
// Upload Batch Services
// ============================================================

export const uploadApi = {
  uploadCsv: async (
    file: File,
    institutionId: string,
    cycle: string,
    onProgress?: (percent: number) => void
  ): Promise<UploadBatch & { preview_rows?: any[]; validation_errors?: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('institution_id', institutionId);
    formData.append('admission_cycle', cycle);

    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    };

    try {
      const response = await apiClient.post<UploadBatch & { preview_rows?: any[]; validation_errors?: any[] }>(
        '/uploads',
        formData,
        config
      );
      return response.data;
    } catch {
      const response = await apiClient.post<UploadBatch & { preview_rows?: any[]; validation_errors?: any[] }>(
        '/uploads/batch',
        formData,
        config
      );
      return response.data;
    }
  },

  getUploads: async (params?: { institution_id?: string; page?: number; size?: number }): Promise<PaginatedResponse<UploadBatch>> => {
    const response = await apiClient.get<PaginatedResponse<UploadBatch> | UploadBatch[]>('/uploads', { params });
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: params?.page || 1,
        size: params?.size || 10,
        pages: Math.ceil(response.data.length / (params?.size || 10)) || 1,
      };
    }
    return response.data;
  },

  getUpload: async (id: string): Promise<UploadBatch> => {
    const response = await apiClient.get<UploadBatch>(`/uploads/${id}`);
    return response.data;
  },

  getUploadIssues: async (id: string): Promise<ValidationIssue[]> => {
    const response = await apiClient.get<ValidationIssue[] | PaginatedResponse<ValidationIssue>>(`/uploads/${id}/issues`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },

  commitUpload: async (id: string, mode: 'strict' | 'partial' = 'partial'): Promise<UploadBatch> => {
    const response = await apiClient.post<UploadBatch>(`/uploads/${id}/commit`, { mode });
    return response.data;
  },

  downloadErrors: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/uploads/${id}/errors.csv`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================================
// Validation Issues Services
// ============================================================

export const issueApi = {
  getIssues: async (params?: IssueFilterParams): Promise<PaginatedResponse<ValidationIssue>> => {
    const response = await apiClient.get<PaginatedResponse<ValidationIssue> | ValidationIssue[]>('/issues', { params });
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: params?.page || 1,
        size: params?.size || 10,
        pages: Math.ceil(response.data.length / (params?.size || 10)) || 1,
      };
    }
    return response.data;
  },

  getIssue: async (id: string): Promise<ValidationIssue> => {
    const response = await apiClient.get<ValidationIssue>(`/issues/${id}`);
    return response.data;
  },

    getNineRules: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/validation/nine-rules');
    return response.data;
  },
  resolveIssue: async (id: string, resolution_reason: string, action: string = "resolved"): Promise<ValidationIssue> => {
    const response = await apiClient.post<ValidationIssue>(`/issues/${id}/resolve`, { resolution_reason, action });
    return response.data;
  },

  reopenIssue: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/issues/${id}/reopen`, {});
    return response.data;
  },

  runValidation: async (params: { record_id?: string; institution_id?: string; admission_cycle?: string }): Promise<any> => {
    const response = await apiClient.post("/validation/run", params);
    return response.data;
  },

  getRecordComplianceStatus: async (recordId: string): Promise<any> => {
    const response = await apiClient.get(`/validation/record/${recordId}/status`);
    return response.data;
  },
};

// ============================================================
// AICTE Reviews Services
// ============================================================

export const reviewApi = {
  getReviews: async (params?: IssueFilterParams): Promise<PaginatedResponse<ValidationIssue>> => {
    const response = await apiClient.get<PaginatedResponse<ValidationIssue> | ValidationIssue[]>('/reviews', { params });
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: params?.page || 1,
        size: params?.size || 10,
        pages: Math.ceil(response.data.length / (params?.size || 10)) || 1,
      };
    }
    return response.data;
  },

  makeDecision: async (issueId: string, decision: IssueDecisionRequest['decision'], reason: string): Promise<ValidationIssue> => {
    const response = await apiClient.post<ValidationIssue>(`/reviews/${issueId}/decision`, {
      decision,
      reason,
    });
    return response.data;
  },

  assignReviewer: async (issueId: string, userId: string): Promise<ValidationIssue> => {
    const response = await apiClient.post<ValidationIssue>(`/reviews/${issueId}/assign`, {
      assigned_to: userId,
    });
    return response.data;
  },

  getCaseTimelines: async (params?: { status_filter?: string; severity_filter?: string }): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/reviews/case-timeline', { params });
    return response.data;
  },

  reopenReview: async (issueId: string, reason: string): Promise<ValidationIssue> => {
    const response = await apiClient.post<ValidationIssue>(`/reviews/${issueId}/reopen`, {
      reason,
    });
    return response.data;
  },
};

// ============================================================
// Dashboard Services
// ============================================================

export const dashboardApi = {
  getSummary: async (params?: { institution_id?: string; admission_cycle?: string }): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/dashboard/summary', { params });
    return response.data;
  },

  getIntake: async (params?: { institution_id?: string; admission_cycle?: string }): Promise<IntakeSummary[]> => {
    const response = await apiClient.get<any>('/dashboard/intake', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.programs && Array.isArray(response.data.programs)) {
      return response.data.programs;
    }
    return [];
  },

  getDataQuality: async (params?: { institution_id?: string; days?: number }): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/dashboard/data-quality', { params });
    return response.data;
  },

  getInstitutionsList: async (): Promise<Institution[]> => {
    return institutionApi.getInstitutions();
  },
};

// ============================================================
// Verification Services
// ============================================================

export const verificationApi = {
  verifyByIdentifier: async (params: { identifier: string; purpose?: string; stakeholder_type?: string }): Promise<any> => {
    const response = await apiClient.post('/verification/verify-identifier', params);
    return response.data;
  },
  requestVerification: async (
    recordId: string,
    purpose: string,
    claims: Record<string, any>
  ): Promise<Credential> => {
    const response = await apiClient.post<Credential>('/verification/request', {
      record_id: recordId,
      purpose,
      claims,
    });
    return response.data;
  },

  getCredentialStatus: async (id: string): Promise<Credential> => {
    const response = await apiClient.get<Credential>(`/verification/credentials/${id}`);
    return response.data;
  },

  getCredentialQR: async (id: string): Promise<{ qr_data: string; credential_token: string }> => {
    const response = await apiClient.get<{ qr_data: string; credential_token: string }>(`/verification/credentials/${id}/qr`);
    return response.data;
  },

  revokeCredential: async (id: string, reason: string): Promise<Credential> => {
    const response = await apiClient.post<Credential>(`/verification/credentials/${id}/revoke`, { reason });
    return response.data;
  },

  verifyToken: async (token: string): Promise<CredentialVerificationResult> => {
    try {
      const response = await apiClient.post<CredentialVerificationResult>('/verification/verify-token', { token });
      return response.data;
    } catch {
      const response = await apiClient.post<CredentialVerificationResult>('/verification/verify', { token });
      return response.data;
    }
  },

  getStudentCredential: async (recordId: string): Promise<any> => {
    const response = await apiClient.get(`/verification/student/${recordId}/credential`);
    return response.data;
  },

  generateStudentCredential: async (recordId: string): Promise<any> => {
    const response = await apiClient.post(`/verification/student/${recordId}/generate`);
    return response.data;
  },
};

// ============================================================
// Audit Services
// ============================================================

export const auditApi = {
  getAuditEvents: async (params?: AuditFilterParams): Promise<PaginatedResponse<AuditEvent>> => {
    let response;
    try {
      response = await apiClient.get<PaginatedResponse<AuditEvent> | AuditEvent[]>('/audit', { params });
    } catch {
      response = await apiClient.get<PaginatedResponse<AuditEvent> | AuditEvent[]>('/audit/events', { params });
    }

    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        page: params?.page || 1,
        size: params?.size || 10,
        pages: Math.ceil(response.data.length / (params?.size || 10)) || 1,
      };
    }
    return response.data;
  },
};

// ============================================================
// Notifications Services
// ============================================================

export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[] | PaginatedResponse<Notification>>('/notifications');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },
};

// ============================================================
// Reports Services
// ============================================================

export const reportsApi = {
  downloadEnrolmentReport: async (params: { institution_id?: string; admission_cycle?: string }): Promise<Blob> => {
    const response = await apiClient.get('/reports/enrolment.csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadIntegrityReport: async (params: { institution_id?: string; admission_cycle?: string }): Promise<Blob> => {
    const response = await apiClient.get('/reports/integrity.csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  getReportPreview: async (type: string, params: Record<string, any>): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/reports/preview/${type}`, { params });
    return response.data;
  },
};

// ============================================================
// Phase 2: External Integrations, PKI Trust, & Consent Services
// ============================================================

export const integrationsApi = {
  getProviders: async (): Promise<ProviderInfo[]> => {
    const response = await apiClient.get<ProviderInfo[]>('/integrations/providers');
    return response.data;
  },

  syncProvider: async (
    providerKey: string,
    body?: { institution_id?: string; admission_cycle?: string; force_refresh?: boolean }
  ): Promise<ProviderSyncResult> => {
    const response = await apiClient.post<ProviderSyncResult>(`/integrations/${providerKey}/sync`, body || {});
    return response.data;
  },
};

export const trustFrameworkApi = {
  getJwks: async (): Promise<JWKSResponse> => {
    const response = await apiClient.get<JWKSResponse>('/.well-known/jwks.json');
    return response.data;
  },

  getPkiMetadata: async (): Promise<PKIMetadata> => {
    const response = await apiClient.get<PKIMetadata>('/.well-known/pki/metadata');
    return response.data;
  },
};

export const consentApi = {
  getPurposes: async (): Promise<VerificationPurpose[]> => {
    const response = await apiClient.get<VerificationPurpose[]>('/consent/purposes');
    return response.data;
  },

  createConsent: async (data: {
    student_id: string;
    purpose: string;
    expires_in_days?: number;
    requester_entity?: string;
    notes?: string;
  }): Promise<ConsentRecord> => {
    const response = await apiClient.post<ConsentRecord>('/consent', data);
    return response.data;
  },

  getStudentConsents: async (studentId: string): Promise<ConsentRecord[]> => {
    const response = await apiClient.get<ConsentRecord[]>(`/consent/student/${studentId}`);
    return response.data;
  },

  revokeConsent: async (consentId: string): Promise<{ message: string; consent_id: string }> => {
    const response = await apiClient.delete<{ message: string; consent_id: string }>(`/consent/${consentId}`);
    return response.data;
  },

  getStakeholders: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/consent/stakeholders');
    return response.data;
  },

  toggleStakeholderApproval: async (id: string): Promise<any> => {
    const response = await apiClient.post<any>(`/consent/stakeholders/${id}/toggle-approval`);
    return response.data;
  },

  getStudentRequests: async (apaarId: string): Promise<any> => {
    const response = await apiClient.get<any>('/consent/student-requests', { params: { apaar_id: apaarId } });
    return response.data;
  },

  decideStudentConsent: async (data: { apaar_id: string; stakeholder_id: string; decision: string }): Promise<any> => {
    const response = await apiClient.post<any>('/consent/student-requests/decide', data);
    return response.data;
  },

    submitStakeholderReview: async (data: {
    apaar_id: string;
    stakeholder_id: string;
    stakeholder_name: string;
    reviewer_name: string;
    verdict: string;
    review_notes: string;
  }): Promise<any> => {
    const response = await apiClient.post<any>('/consent/stakeholder-review', data);
    return response.data;
  },

  getStakeholderReviews: async (apaarId: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/consent/stakeholder-reviews', { params: { apaar_id: apaarId } });
    return response.data;
  },
  stakeholderQuery: async (apaarId: string, stakeholderId: string): Promise<any> => {
    const response = await apiClient.get<any>('/consent/stakeholder-query', {
      params: { apaar_id: apaarId, stakeholder_id: stakeholderId },
    });
    return response.data;
  },
};

// ============================================================
// Phase 3: Institutional APIs, Reference Master & Freshness Services
// ============================================================

export const institutionalApi = {
  createKey: async (data: {
    institution_id: string;
    key_name: string;
    permissions?: string[];
  }): Promise<InstitutionalApiKey> => {
    const response = await apiClient.post<InstitutionalApiKey>('/institution-api/keys', data);
    return response.data;
  },

  listKeys: async (institutionId?: string): Promise<InstitutionalApiKey[]> => {
    const response = await apiClient.get<InstitutionalApiKey[]>('/institution-api/keys', {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  revokeKey: async (keyId: string): Promise<{ message: string; key_id: string }> => {
    const response = await apiClient.delete<{ message: string; key_id: string }>(`/institution-api/keys/${keyId}`);
    return response.data;
  },

  registerWebhook: async (data: {
    institution_id: string;
    target_url: string;
    event_types?: string[];
  }): Promise<InstitutionalWebhook> => {
    const response = await apiClient.post<InstitutionalWebhook>('/institution-api/webhooks', data);
    return response.data;
  },

  listWebhooks: async (institutionId?: string): Promise<InstitutionalWebhook[]> => {
    const response = await apiClient.get<InstitutionalWebhook[]>('/institution-api/webhooks', {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  pushSisRecords: async (
    apiKey: string,
    data: { admission_cycle: string; records: any[] }
  ): Promise<any> => {
    const response = await apiClient.post('/institution-api/v1/sis/push-records', data, {
      headers: { 'X-Institution-API-Key': apiKey },
    });
    return response.data;
  },
};

export const freshnessApi = {
  getOverview: async (): Promise<FreshnessOverview> => {
    const response = await apiClient.get<FreshnessOverview>('/freshness/overview');
    return response.data;
  },

  getInstitutionProfile: async (institutionId: string): Promise<FreshnessProfile> => {
    const response = await apiClient.get<FreshnessProfile>(`/freshness/institution/${institutionId}`);
    return response.data;
  },
};

export const referenceDataApi = {
  listMasters: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/reference-data/masters');
    return response.data;
  },

  syncMaster: async (source: string): Promise<any> => {
    const response = await apiClient.post(`/reference-data/sync/${source}`);
    return response.data;
  },

  getReconciliation: async (
    cycle: string = '2026-27',
    institutionId?: string
  ): Promise<ReconciliationReport> => {
    const response = await apiClient.get<ReconciliationReport>('/reference-data/reconciliation', {
      params: { admission_cycle: cycle, institution_id: institutionId },
    });
    return response.data;
  },
};

export const correctionWorkflowApi = {
  apaarQuickUpdate: async (data: {
    apaar_id: string;
    proposed_changes: Record<string, any>;
    operator_notes: string;
    document_reference?: string;
  }): Promise<{
    status: string;
    message: string;
    student_id: string;
    student_name: string;
    apaar_id: string;
    workflows: Array<{
      workflow_id: string;
      field_name: string;
      original_value: string;
      proposed_value: string;
    }>;
    workflow_status: string;
  }> => {
    const response = await apiClient.post('/corrections-workflow/apaar-quick-update', data);
    return response.data;
  },

  submitProposal: async (data: {
    record_id: string;
    field_name: string;
    proposed_value: string;
    operator_notes: string;
  }): Promise<any> => {
    const response = await apiClient.post('/corrections-workflow/submit', data);
    return response.data;
  },

  institutionAdminAction: async (
    workflowId: string,
    data: { decision: string; notes: string }
  ): Promise<any> => {
    const response = await apiClient.post(`/corrections-workflow/${workflowId}/institution-action`, data);
    return response.data;
  },

  aicteReviewerAction: async (
    workflowId: string,
    data: { decision: string; notes: string }
  ): Promise<any> => {
    const response = await apiClient.post(`/corrections-workflow/${workflowId}/aicte-action`, data);
    return response.data;
  },

  listWorkflows: async (params?: { institution_id?: string; stage?: string }): Promise<ExpandedCorrection[]> => {
    const response = await apiClient.get<ExpandedCorrection[]>('/corrections-workflow', { params });
    return response.data;
  },
};

export const privacyExchangeApi = {
  getPredicates: async (): Promise<Array<{ predicate: string; description: string }>> => {
    const response = await apiClient.get('/privacy-exchange/predicates');
    return response.data;
  },

  issueBlindedProof: async (data: {
    record_id: string;
    predicate: string;
    verifier_audience: string;
  }): Promise<BlindedProof> => {
    const response = await apiClient.post<BlindedProof>('/privacy-exchange/blinded-proof', data);
    return response.data;
  },

  verifyBlindedProof: async (proofToken: string): Promise<any> => {
    const response = await apiClient.post('/privacy-exchange/verify-proof', { proof_token: proofToken });
    return response.data;
  },
};

// ============================================================
// Phase 4: Risk Scoring, Trends & OCR Document Reconciliation
// ============================================================

export interface InstitutionRiskScore {
  institution_id: string;
  institution_code: string;
  institution_name: string;
  composite_risk_score: number;
  risk_tier: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK';
  trend: 'increasing' | 'stable' | 'improving';
  metrics: {
    total_records: number;
    flagged_records: number;
    anomaly_rate_pct: number;
    open_issues_total: number;
    critical_issues: number;
    high_issues: number;
    warning_issues: number;
    info_issues: number;
    cross_institution_duplicates: number;
    intake_exceeded_flags: number;
    category_inconsistencies: number;
  };
  factor_breakdown: {
    anomaly_density_score: number;
    severity_index: number;
    duplicate_cluster_risk: number;
    intake_breach_risk: number;
  };
  regulatory_recommendation: string;
}

export interface StudentRiskScore {
  student_id: string;
  student_name: string;
  institution_student_id: string;
  risk_score: number;
  risk_tier: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK';
  open_issues_count: number;
  risk_factors: string[];
}

export interface DocumentReconciliationResult {
  reconciliation_id: string;
  student_id: string;
  student_name: string;
  document_type: string;
  file_name: string;
  confidence_score: number;
  match_status: 'VERIFIED' | 'REVIEW_REQUIRED' | 'MISMATCH_FLAGGED';
  discrepancies: string[];
  field_comparisons: Array<{
    field: string;
    extracted_value: string;
    record_value: string;
    similarity: number;
    match_status: string;
    weight: number;
  }>;
  extracted_data: Record<string, any>;
  created_at: string;
}

export const riskScoringApi = {
  getRiskScores: async (): Promise<InstitutionRiskScore[]> => {
    const response = await apiClient.get<InstitutionRiskScore[]>('/analytics/risk-scores');
    return response.data;
  },

  getInstitutionRisk: async (institutionId: string): Promise<InstitutionRiskScore> => {
    const response = await apiClient.get<InstitutionRiskScore>(`/analytics/risk-scores/${institutionId}`);
    return response.data;
  },

  getStudentRisk: async (studentId: string): Promise<StudentRiskScore> => {
    const response = await apiClient.get<StudentRiskScore>(`/analytics/risk-scores/students/${studentId}`);
    return response.data;
  },
};

export const analyticsV2Api = {
  getTrends: async (params?: { institution_id?: string; cycle?: string }): Promise<any> => {
    const response = await apiClient.get('/analytics/trends', { params });
    return response.data;
  },

  getModelPerformance: async (): Promise<any> => {
    const response = await apiClient.get('/analytics/model-performance');
    return response.data;
  },
};

export const ocrApi = {
  reconcileDocument: async (data: {
    student_id: string;
    document_type: string;
    file_name: string;
    extracted_data: Record<string, any>;
  }): Promise<DocumentReconciliationResult> => {
    const response = await apiClient.post<DocumentReconciliationResult>('/ocr/reconcile-document', data);
    return response.data;
  },

  getReconciliations: async (studentId: string): Promise<DocumentReconciliationResult[]> => {
    const response = await apiClient.get<DocumentReconciliationResult[]>(`/ocr/reconciliations/${studentId}`);
    return response.data;
  },
};

export const graphApi = {
  getGraphData: async (cycle: string = '2026-27'): Promise<any> => {
    const response = await apiClient.get('/graph/data', {
      params: { admission_cycle: cycle },
    });
    return response.data;
  },
};
