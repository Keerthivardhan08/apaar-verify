import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviews } from '../../hooks/useApi';
import { ValidationIssue } from '../../types';
import Card from '../../components/ui/Card';
import SeverityBadge from '../../components/ui/SeverityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import {
  CheckSquare,
  AlertOctagon,
  ArrowRight,
  UserCheck,
  Building2,
  Calendar,
} from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const { data: reviewsData, isLoading, isError, refetch } = useReviews();

  const issues = reviewsData?.items || [];

  // Priority sort: critical > high > warning > info
  const severityRank: Record<string, number> = {
    critical: 4,
    high: 3,
    warning: 2,
    info: 1,
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const rankA = severityRank[a.severity.toLowerCase()] || 0;
    const rankB = severityRank[b.severity.toLowerCase()] || 0;
    return rankB - rankA;
  });

  const filteredIssues = assigneeFilter
    ? sortedIssues.filter((i) => i.assigned_to === assigneeFilter)
    : sortedIssues;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AICTE Review Queue</h1>
          <p className="text-sm text-gray-500">
            Priority queue for statutory evaluation of flagged discrepancies and institutional appeals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-gray-600 uppercase">Assignee:</label>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white"
          >
            <option value="">All Reviewers</option>
            <option value="unassigned">Unassigned Only</option>
            <option value="me">Assigned to Me</option>
          </select>
        </div>
      </div>

      {/* Queue View Cards */}
      {isLoading ? (
        <LoadingSpinner message="Loading review queue items..." />
      ) : filteredIssues.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-emerald-600" />}
          title="Review Queue is Clear!"
          description="There are no pending regulatory exceptions requiring officer determination at this time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => (
            <Card
              key={issue.id}
              className="hover:border-indigo-300 transition-all cursor-pointer hover:shadow-md"
              onClick={() => navigate(`/aicte/reviews/${issue.id}`)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <SeverityBadge severity={issue.severity} />
                  <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {issue.rule_code}
                  </span>
                </div>
                <StatusBadge status={issue.status} />
              </div>

              <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2">
                {issue.description}
              </h4>

              {/* Evidence Preview Box */}
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs space-y-1 mb-4">
                <div className="flex justify-between text-gray-500">
                  <span>Expected:</span>
                  <span className="font-mono text-emerald-700 truncate max-w-[200px]">
                    {issue.expected_condition || 'Compliant with rule limits'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Observed:</span>
                  <span className="font-mono text-rose-700 truncate max-w-[200px]">
                    {issue.observed_condition || 'Breach detected'}
                  </span>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>{issue.institution_name || 'Institution Node'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-indigo-700 font-semibold"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
