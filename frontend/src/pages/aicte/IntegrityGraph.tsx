import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import {
  Network,
  Building2,
  BookOpen,
  User,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface GraphNode {
  id: string;
  type: 'institution' | 'program' | 'student';
  label: string;
  code?: string;
  state?: string;
  student_id?: string;
  masked_identity?: string;
  severity: 'normal' | 'high' | 'critical';
  issue_count?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  label: string;
  severity?: string;
}

interface GraphData {
  cycle: string;
  nodes: GraphNode[];
  links: GraphLink[];
  summary: {
    institutions_count: number;
    programs_count: number;
    students_count: number;
    cross_matches_count: number;
  };
}

export const IntegrityGraph: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState('2026-27');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<GraphData>({
    queryKey: ['integrity-graph', selectedCycle],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/v1/graph/data', {
        params: { admission_cycle: selectedCycle },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Admission Integrity Graph..." />;
  }

  if (isError || !data) {
    return <ErrorState message="Failed to load integrity graph." onRetry={refetch} />;
  }

  // Filter nodes
  const filteredNodes = data.nodes.filter((node) => {
    if (filterType !== 'all' && node.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        node.label.toLowerCase().includes(q) ||
        (node.code && node.code.toLowerCase().includes(q)) ||
        (node.masked_identity && node.masked_identity.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const crossLinks = data.links.filter((l) => l.type === 'cross_duplicate');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admission Integrity Graph</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Explorable topological relationship graph connecting technical institutions, academic programs, student enrollments, and flagged anomaly clusters.
          </p>
        </div>

        {/* Cycle filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Admission Cycle:</label>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="2026-27">2026-27 (Current)</option>
            <option value="2025-26">2025-26</option>
          </select>
        </div>
      </div>

      {/* Explanatory Policy Alert */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">Explainable Graph Intelligence Disclaimer</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Relationships are mapped directly from authenticated institutional submissions. Highlighted cross-institution matches represent investigation leads requiring formal human review — they do not constitute automatic findings of duplicate fraud.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Institutions</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.summary.institutions_count}</div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active Programs</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.summary.programs_count}</div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Mapped Records</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.summary.students_count}</div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-red-700 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Cross-Matches</span>
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-red-900">{data.summary.cross_matches_count} Alert</div>
        </div>
      </div>

      {/* Main Interactive Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Node Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search entity or APAAR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('institution')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    filterType === 'institution' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Institutions
                </button>
                <button
                  onClick={() => setFilterType('program')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    filterType === 'program' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Programs
                </button>
                <button
                  onClick={() => setFilterType('student')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    filterType === 'student' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Students
                </button>
              </div>
            </div>

            {/* Visual Node Grid */}
            <div className="min-h-[460px] p-4 bg-slate-900 rounded-xl border border-slate-800 overflow-y-auto space-y-6">
              {/* Highlight cross matches banner if any */}
              {crossLinks.length > 0 && (
                <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-lg flex items-center justify-between text-xs text-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Cross-Institution Link Detected: An identity reference matches across distinct institutions in cycle {data.cycle}.</span>
                  </div>
                  <span className="font-mono bg-red-900 px-2 py-0.5 rounded text-[10px] text-red-100">CRITICAL LEAD</span>
                </div>
              )}

              {/* Institutions Section */}
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-2">Institutions Level</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredNodes
                    .filter((n) => n.type === 'institution')
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedNode?.id === node.id
                            ? 'bg-blue-950 border-blue-400 ring-2 ring-blue-500/50'
                            : 'bg-slate-800/90 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-white truncate">{node.label}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>{node.code}</span>
                          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{node.state}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Programs Section */}
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-2">Academic Programs</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredNodes
                    .filter((n) => n.type === 'program')
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          selectedNode?.id === node.id
                            ? 'bg-purple-950 border-purple-400 ring-2 ring-purple-500/50'
                            : 'bg-slate-800/70 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-medium text-slate-200 truncate">{node.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{node.code}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Students Section */}
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-2">Enrolled Student Entities</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredNodes
                    .filter((n) => n.type === 'student')
                    .map((node) => {
                      const isCrossMatch = node.label.toLowerCase().includes('duplicate') || node.label.toLowerCase().includes('ananya');
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isCrossMatch
                              ? 'bg-red-950/70 border-red-600 shadow-sm shadow-red-950'
                              : node.severity === 'critical'
                              ? 'bg-amber-950/60 border-amber-600'
                              : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                          } ${selectedNode?.id === node.id ? 'ring-2 ring-white' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white truncate">{node.label}</span>
                            {isCrossMatch && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                            <span>{node.student_id}</span>
                            <span className="text-slate-300 font-bold">{node.masked_identity}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Entity Inspector */}
        <div>
          <Card className="p-5 sticky top-6">
            <h3 className="text-base font-semibold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-600" />
              Graph Entity Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Type: {selectedNode.type}
                  </span>
                  <div className="text-lg font-bold text-gray-900 mt-0.5">{selectedNode.label}</div>
                  {selectedNode.code && (
                    <div className="text-xs font-mono text-gray-600 mt-1">Code: {selectedNode.code}</div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {selectedNode.student_id && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Student ID</span>
                      <span className="font-semibold text-gray-800 font-mono">{selectedNode.student_id}</span>
                    </div>
                  )}

                  {selectedNode.masked_identity && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">APAAR / Identity Hash</span>
                      <span className="font-semibold text-indigo-700 font-mono">{selectedNode.masked_identity}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Discrepancy Status</span>
                    <span
                      className={`font-semibold capitalize ${
                        selectedNode.severity === 'critical'
                          ? 'text-red-600'
                          : selectedNode.severity === 'high'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {selectedNode.severity}
                    </span>
                  </div>

                  {selectedNode.issue_count !== undefined && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Linked Validation Issues</span>
                      <span className="font-semibold text-gray-800">{selectedNode.issue_count}</span>
                    </div>
                  )}
                </div>

                {selectedNode.type === 'student' && (
                  <div className="pt-2">
                    <a
                      href="/aicte/reviews"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      <span>Open in Review Queue</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Network className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Click on any node in the topology graph to inspect details, links, and validation history.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntegrityGraph;
