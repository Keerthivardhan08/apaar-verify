import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useStudents, usePrograms, useCreateStudent } from '../../hooks/useApi';
import { StudentRecord } from '../../types';
import DataTable, { Column } from '../../components/ui/DataTable';
import FilterBar, { FilterConfig } from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { UserPlus, Download, Eye, Edit3, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const { getUserInstitutionId } = useAuth();
  const institutionId = getUserInstitutionId() || undefined;

  // Filter & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    admission_category: '',
    record_status: '',
    program_id: '',
  });

  // Modal State for Add Student
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_name: '',
    institution_student_id: '',
    program_id: '',
    admission_cycle: '2024-2025',
    admission_category: 'GENERAL',
    admission_status: 'CONFIRMED',
    date_of_birth: '2004-01-01',
    gender: 'MALE',
    nri_category: 'NONE',
    oci_status: 'NO',
    foreign_national_status: 'NO',
    supernumerary_category: 'NONE',
  });

  const { data: programs = [] } = usePrograms(institutionId);
  const createStudentMutation = useCreateStudent();

  const {
    data: studentsData,
    isLoading,
    isError,
    refetch,
  } = useStudents({
    institution_id: institutionId,
    page,
    size: 10,
    search: search || undefined,
    admission_category: filters.admission_category || undefined,
    record_status: filters.record_status || undefined,
    program_id: filters.program_id || undefined,
  });

  const students = studentsData?.items || [];
  const totalPages = studentsData?.pages || 1;
  const totalItems = studentsData?.total || 0;

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      admission_category: '',
      record_status: '',
      program_id: '',
    });
    setSearch('');
    setPage(1);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name || !formData.institution_student_id || !formData.program_id) {
      toast.error('Please fill in all required fields.');
      return;
    }

    await createStudentMutation.mutateAsync({
      ...formData,
      institution_id: institutionId || 'INST-001',
      record_status: 'submitted',
      identity_verification_status: 'pending',
    });

    setIsAddModalOpen(false);
    setFormData({
      student_name: '',
      institution_student_id: '',
      program_id: '',
      admission_cycle: '2024-2025',
      admission_category: 'GENERAL',
      admission_status: 'CONFIRMED',
      date_of_birth: '2004-01-01',
      gender: 'MALE',
      nri_category: 'NONE',
      oci_status: 'NO',
      foreign_national_status: 'NO',
      supernumerary_category: 'NONE',
    });
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error('No students available to export.');
      return;
    }

    const headers = [
      'Institution Student ID',
      'Name',
      'Program',
      'Cycle',
      'Category',
      'Status',
      'Verification Status',
    ];
    const rows = students.map((s) => [
      s.institution_student_id,
      s.student_name,
      s.program_name || s.program_id,
      s.admission_cycle,
      s.admission_category,
      s.record_status,
      s.identity_verification_status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Students exported successfully');
  };

  // Mask function: Mask sensitive identifier showing last 4 chars (****XXXX)
  const maskId = (idStr: string) => {
    if (!idStr) return '—';
    if (idStr.length <= 4) return idStr;
    return '••••' + idStr.slice(-4);
  };

  // Mask student name: mask last 2 characters
  const maskName = (name: string) => {
    if (!name) return '—';
    if (name.length <= 2) return name;
    return name.slice(0, -2) + '**';
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'program_id',
      label: 'Program',
      type: 'select',
      options: programs.map((p) => ({ label: p.program_name, value: p.id })),
    },
    {
      key: 'admission_category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'General', value: 'GENERAL' },
        { label: 'OBC-NCL', value: 'OBC_NCL' },
        { label: 'SC', value: 'SC' },
        { label: 'ST', value: 'ST' },
        { label: 'EWS', value: 'EWS' },
        { label: 'Management Quota', value: 'MANAGEMENT' },
        { label: 'NRI Quota', value: 'NRI' },
      ],
    },
    {
      key: 'record_status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Flagged', value: 'flagged' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Correction Requested', value: 'correction_requested' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ];

  const columns: Column<StudentRecord>[] = [
    {
      key: 'institution_student_id',
      header: 'Student ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
          {maskId(row.institution_student_id)}
        </span>
      ),
    },
    {
      key: 'student_name',
      header: 'Student Name',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900">{maskName(row.student_name)}</span>
      ),
    },
    {
      key: 'program_name',
      header: 'Program',
      render: (row) => (
        <span className="text-gray-700 text-xs">
          {row.program_name || programs.find((p) => p.id === row.program_id)?.program_name || 'Program'}
        </span>
      ),
    },
    {
      key: 'admission_category',
      header: 'Category',
      render: (row) => (
        <Badge variant="secondary" size="sm">
          {row.admission_category}
        </Badge>
      ),
    },
    {
      key: 'record_status',
      header: 'Record Status',
      render: (row) => <StatusBadge status={row.record_status} />,
    },
    {
      key: 'active_issue_count',
      header: 'Issues',
      render: (row) => {
        const count = row.active_issue_count ?? (row.record_status === 'flagged' ? 1 : 0);
        return count > 0 ? (
          <span className="inline-flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <ShieldAlert className="w-3 h-3 mr-1" />
            {count} issue{count > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-gray-400">None</span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/institution/students/${row.id}`)}
            icon={<Eye className="w-3.5 h-3.5" />}
            title="View Details"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/institution/students/${row.id}?edit=true`)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
            title="Edit Record"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Records</h1>
          <p className="text-sm text-gray-500">
            Search, inspect compliance flags, and manage enrolled student submissions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by student name or roll number..."
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(row) => navigate(`/institution/students/${row.id}`)}
        emptyTitle="No Student Records Found"
        emptyDescription="No student records match the specified filters or search term."
        emptyActionLabel="Clear Filters"
        onEmptyAction={handleClearFilters}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={10}
        onPageChange={(p) => setPage(p)}
      />

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Enrolled Student Record"
        subtitle="Create a single compliant enrollment record manually."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Roll / Student ID *
              </label>
              <input
                type="text"
                required
                value={formData.institution_student_id}
                onChange={(e) => setFormData({ ...formData, institution_student_id: e.target.value })}
                placeholder="e.g. 2024CS1092"
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Academic Program *
              </label>
              <select
                required
                value={formData.program_id}
                onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
              >
                <option value="">Select Program...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.program_name} ({p.program_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Admission Cycle *
              </label>
              <input
                type="text"
                required
                value={formData.admission_cycle}
                onChange={(e) => setFormData({ ...formData, admission_cycle: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Admission Category
              </label>
              <select
                value={formData.admission_category}
                onChange={(e) => setFormData({ ...formData, admission_category: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="OBC_NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
                <option value="MANAGEMENT">MANAGEMENT</option>
                <option value="NRI">NRI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createStudentMutation.isPending}
            >
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Students;
