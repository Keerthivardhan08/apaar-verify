import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Lock, 
  FileText, 
  Zap, 
  Copy, 
  Check 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { integrationsApi, trustFrameworkApi, consentApi } from '../../services/api';
import { ProviderInfo, ProviderSyncResult, PKIMetadata, VerificationPurpose } from '../../types';

export const Integrations: React.FC = () => {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [pkiMeta, setPkiMeta] = useState<PKIMetadata | null>(null);
  const [purposes, setPurposes] = useState<VerificationPurpose[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sync state
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<ProviderSyncResult | null>(null);
  const [selectedCycle, setSelectedCycle] = useState('2026-27');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [provs, meta, purps] = await Promise.all([
        integrationsApi.getProviders().catch(() => []),
        trustFrameworkApi.getPkiMetadata().catch(() => null),
        consentApi.getPurposes().catch(() => []),
      ]);
      setProviders(provs);
      setPkiMeta(meta);
      setPurposes(purps);
    } catch (err) {
      toast.error('Failed to load integration and PKI telemetry');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (providerKey: string) => {
    setSyncingProvider(providerKey);
    setSyncResult(null);
    try {
      const result = await integrationsApi.syncProvider(providerKey, {
        admission_cycle: selectedCycle,
        force_refresh: forceRefresh,
      });
      setSyncResult(result);
      toast.success(`Sync completed with ${result.provider_display}: ${result.records_updated} updated`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Provider synchronization failed');
    } finally {
      setSyncingProvider(null);
    }
  };

  const copyJwksUrl = () => {
    const url = `${window.location.origin}/api/v1/.well-known/jwks.json`;
    navigator.clipboard.writeText(url);
    setCopiedKey(true);
    toast.success('Public JWKS URL copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Identity Providers & Cryptographic Trust Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Phase 2 Architecture
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Pluggable verification adapters, high-assurance mTLS synchronization, RFC 7517 JWKS, and purpose-bound privacy protection.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Telemetry
        </button>
      </div>

      {/* Provider Adapter Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-600" />
          Registered Identity Verification Providers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map((prov) => {
            const isSyncing = syncingProvider === prov.key;
            return (
              <div
                key={prov.key}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{prov.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">key: {prov.key}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        prov.status === 'healthy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      {prov.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                    {prov.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Auth Protocol:</span>
                      <span className="font-mono text-gray-700 font-medium">{prov.auth_mechanism}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Average Latency:</span>
                      <span className="font-mono text-gray-700 font-medium">{prov.latency_ms} ms</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Gateway Scope:</span>
                      <span className="text-gray-700 font-medium capitalize">{prov.environment.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleSync(prov.key)}
                    disabled={isSyncing}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-indigo-600 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing Records...' : `Sync via ${prov.name.split(' ')[0]}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Execution & Results Card */}
      {syncResult && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 bg-gradient-to-r from-white via-indigo-50/20 to-white">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                Batch Synchronization Result — {syncResult.provider_display}
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-mono">Sync ID: {syncResult.sync_id.slice(0, 8)}...</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Records Processed</span>
              <p className="text-xl font-bold text-gray-900">{syncResult.records_processed}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Verified / Updated</span>
              <p className="text-xl font-bold text-green-600">{syncResult.records_updated}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Unmatched / Failed</span>
              <p className="text-xl font-bold text-amber-600">{syncResult.records_failed}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Sync Latency</span>
              <p className="text-xl font-bold text-indigo-600">{syncResult.duration_ms} ms</p>
            </div>
          </div>

          {syncResult.details_sample && syncResult.details_sample.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Sample Record Verification Telemetry
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Student Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Submitted Identifier</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Assigned Status</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Provider Digital Reference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {syncResult.details_sample.map((row) => (
                      <tr key={row.student_id}>
                        <td className="px-3 py-2 font-medium text-gray-900">{row.student_name}</td>
                        <td className="px-3 py-2 font-mono text-gray-600">{row.identifier_ref}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              row.status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : row.status === 'mock_verified'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-500">{row.provider_reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Asymmetric PKI Trust Framework Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Asymmetric Cryptographic Trust Framework (PKI)
              </h2>
              <p className="text-xs text-gray-500">
                Credentials are cryptographically signed using RS256 with managed 2048-bit RSA keys.
              </p>
            </div>
          </div>
          <button
            onClick={copyJwksUrl}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            {copiedKey ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
            Copy Public JWKS Endpoint
          </button>
        </div>

        {pkiMeta && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Active Key ID (kid):</span>
                <span className="font-mono font-bold text-indigo-700">{pkiMeta.key_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Signature Algorithm:</span>
                <span className="font-mono text-gray-800 font-semibold">{pkiMeta.algorithm}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Key Type & Size:</span>
                <span className="text-gray-800 font-medium">{pkiMeta.key_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Intended Usage:</span>
                <span className="text-gray-800 font-medium">{pkiMeta.key_usage}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Dynamic Discovery:</span>
                <a
                  href="/api/v1/.well-known/jwks.json"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                >
                  /.well-known/jwks.json <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 text-gray-200 font-mono text-[11px] overflow-x-auto">
              <div className="flex justify-between items-center text-gray-400 border-b border-gray-800 pb-2 mb-2">
                <span>RFC 7517 Public JWK Structure</span>
                <span className="text-green-400">STATUS: ACTIVE</span>
              </div>
              <pre>{JSON.stringify(pkiMeta.jwk, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Purpose & Consent Binding Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Purpose-Bound Minimal Claim Disclosure Policy
          </h2>
        </div>
        <p className="text-xs text-gray-600 mb-4">
          In compliance with Data Minimization and Purpose Limitation principles, verifiers only receive claims necessary for their specific authorized purpose.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purposes.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-gray-900 text-sm">{p.name}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                  {p.privacy_score}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{p.description}</p>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-[11px] font-medium text-gray-600">Disclosed Claims:</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {p.permitted_claims.map((claim) => (
                    <span
                      key={claim}
                      className="inline-block px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono text-gray-700"
                    >
                      {claim}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
