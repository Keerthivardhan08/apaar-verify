import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graphApi } from '../../services/api';
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
  Sparkles,
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
      return await graphApi.getGraphData(selectedCycle);
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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white rounded-xl shadow-md shadow-indigo-600/25 border border-indigo-400/30">
              <Network className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Admission Integrity Graph
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Topological network graph mapping technical institutions, academic programs, student enrollments, and cross-institution duplicate clusters.
          </p>
        </div>

        {/* Cycle filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Admission Cycle:</label>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="2026-27">2026-27 (Current)</option>
            <option value="2025-26">2025-26</option>
            <option value="all">All Cycles</option>
          </select>
        </div>
      </div>

      {/* Explanatory Policy Alert */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl text-amber-900 text-sm flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950 text-xs sm:text-sm">Explainable Graph Intelligence Disclaimer</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Relationships are mapped directly from authenticated institutional submissions. Highlighted cross-institution matches represent investigation leads requiring formal human review — they do not constitute automatic findings of duplicate fraud.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="liquid-glass p-4 rounded-2xl border border-white/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Institutions</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data.summary.institutions_count}</div>
        </div>

        <div className="liquid-glass p-4 rounded-2xl border border-white/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Programs</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data.summary.programs_count}</div>
        </div>

        <div className="liquid-glass p-4 rounded-2xl border border-white/70 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mapped Records</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data.summary.students_count}</div>
        </div>

        <div className="liquid-glass p-4 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/40">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cross-Matches</span>
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900">{data.summary.cross_matches_count} Alert</div>
        </div>
      </div>

      {/* Main Interactive Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Node Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search entity or APAAR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    filterType === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('institution')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    filterType === 'institution' ? 'bg-indigo-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Institutions
                </button>
                <button
                  onClick={() => setFilterType('program')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    filterType === 'program' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Programs
                </button>
                <button
                  onClick={() => setFilterType('student')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    filterType === 'student' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Students
                </button>
              </div>
            </div>

            {/* Visual Node Grid */}
            <div className="min-h-[460px] p-5 liquid-glass-dark rounded-2xl border border-slate-800 overflow-y-auto space-y-6">
              {/* Highlight cross matches banner if any */}
              {crossLinks.length > 0 && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-center justify-between text-xs text-rose-200 shadow-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Cross-Institution Link Detected: An identity reference matches across distinct institutions in cycle {data.cycle}.</span>
                  </div>
                  <span className="font-mono bg-rose-900 px-2 py-0.5 rounded text-[10px] text-rose-100 font-bold shrink-0">CRITICAL LEAD</span>
                </div>
              )}

              {/* Institutions Section */}
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-2.5">
                  Institutions Level ({filteredNodes.filter((n) => n.type === 'institution').length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredNodes
                    .filter((n) => n.type === 'institution')
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedNode?.id === node.id
                            ? 'bg-indigo-950 border-indigo-400 ring-2 ring-indigo-500/50 scale-[1.02]'
                            : 'bg-slate-850/80 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-bold text-white truncate">{node.label}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span className="font-mono">{node.code}</span>
                          <span className="text-[10px] bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-300 font-medium">{node.state}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Programs Section */}
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-2.5">
                  Academic Programs ({filteredNodes.filter((n) => n.type === 'program').length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredNodes
                    .filter((n) => n.type === 'program')
                    .map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedNode?.id === node.id
                            ? 'bg-purple-950 border-purple-400 ring-2 ring-purple-500/50 scale-[1.02]'
                            : 'bg-slate-850/70 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-200 truncate">{node.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{node.code}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Students Section */}
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-2.5">
                  Enrolled Student Entities ({filteredNodes.filter((n) => n.type === 'student').length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredNodes
                    .filter((n) => n.type === 'student')
                    .map((node) => {
                      const isCrossMatch = node.label.toLowerCase().includes('duplicate') || node.label.toLowerCase().includes('ananya');
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isCrossMatch
                              ? 'bg-rose-950/70 border-rose-600 shadow-sm shadow-rose-950 ring-1 ring-rose-500'
                              : node.severity === 'critical'
                              ? 'bg-amber-950/60 border-amber-600'
                              : 'bg-slate-850/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
                          } ${selectedNode?.id === node.id ? 'ring-2 ring-white scale-[1.02]' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white truncate">{node.label}</span>
                            {isCrossMatch && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
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
          <Card className="p-5 sticky top-20">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200/60 pb-3 mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-600" />
              <span>Graph Entity Inspector</span>
            </h3>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Type: {selectedNode.type}
                  </span>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">{selectedNode.label}</div>
                  {selectedNode.code && (
                    <div className="text-xs font-mono text-slate-600 mt-1">Code: {selectedNode.code}</div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {selectedNode.student_id && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Student ID</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedNode.student_id}</span>
                    </div>
                  )}

                  {selectedNode.masked_identity && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">APAAR / Identity Hash</span>
                      <span className="font-bold text-indigo-700 font-mono">{selectedNode.masked_identity}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Discrepancy Status</span>
                    <span
                      className={`font-bold capitalize ${
                        selectedNode.severity === 'critical'
                          ? 'text-rose-600'
                          : selectedNode.severity === 'high'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {selectedNode.severity}
                    </span>
                  </div>

                  {selectedNode.issue_count !== undefined && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Linked Validation Issues</span>
                      <span className="font-bold text-slate-800">{selectedNode.issue_count}</span>
                    </div>
                  )}
                </div>

                {selectedNode.type === 'student' && (
                  <div className="pt-2">
                    <a
                      href="/aicte/reviews"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-bold hover:from-indigo-500 hover:to-indigo-600 transition-all duration-200 shadow-md shadow-indigo-600/20"
                    >
                      <span>Open in Review Queue</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Network className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-600" />
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
