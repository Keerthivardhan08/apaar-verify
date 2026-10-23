import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Webhook, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  Send, 
  Code, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { institutionalApi } from '../../services/api';
import { InstitutionalApiKey, InstitutionalWebhook } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

export const InstitutionalApi: React.FC = () => {
  const { user } = useAuth();
  const instId = user?.roles?.find(r => r.institution_id)?.institution_id || '';

  const [keys, setKeys] = useState<InstitutionalApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<InstitutionalWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  // New key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('Campus ERP Main Connector');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Webhook modal
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://erp.campus.edu/api/webhooks/apaar');

  // SIS simulation
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  useEffect(() => {
    if (instId) {
      loadData();
    }
  }, [instId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kList, wList] = await Promise.all([
        institutionalApi.listKeys(instId).catch(() => []),
        institutionalApi.listWebhooks(instId).catch(() => []),
      ]);
      setKeys(kList);
      setWebhooks(wList);
    } catch {
      toast.error('Failed to load integration keys and webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newKey = await institutionalApi.createKey({
        institution_id: instId,
        key_name: keyName,
        permissions: ['student:read', 'student:write', 'batch:upload'],
      });
      setGeneratedSecret(newKey.api_key_secret || null);
      toast.success('Institutional API Key generated successfully');
      loadData();
    } catch {
      toast.error('Failed to generate institutional API key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key? Ingestion from this key will immediately stop.')) return;
    try {
      await institutionalApi.revokeKey(id);
      toast.success('API key revoked');
      loadData();
    } catch {
      toast.error('Failed to revoke API key');
    }
  };

  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await institutionalApi.registerWebhook({
        institution_id: instId,
        target_url: webhookUrl,
        event_types: ['issue.flagged', 'review.decided', 'intake.warning'],
      });
      toast.success('SIS Webhook registered');
      setShowWebhookModal(false);
      loadData();
    } catch {
      toast.error('Failed to register webhook');
    }
  };

  const handleSimulateSisPush = async () => {
    if (keys.length === 0) {
      toast.error('Please generate an API key first before testing the direct ERP push.');
      return;
    }
    setSimulating(true);
    setSimResult(null);
    try {
      // In simulation mode, use active key or demo header
      const sampleKey = generatedSecret || `${keys[0].api_key_prefix}simulated_secret`;
      const res = await institutionalApi.pushSisRecords(sampleKey, {
        admission_cycle: '2026-27',
        records: [
          {
            institution_student_id: `ERP-${Date.now().toString().slice(-4)}`,
            student_name: 'Ananya Deshmukh',
            program_id: '00000000-0000-0000-0000-000000000000', // resolved server-side
            admission_cycle: '2026-27',
            admission_category: 'general',
            admission_status: 'admitted',
            identity_reference: `DEMO-SIS-${Date.now().toString().slice(-4)}`,
          },
        ],
      });
      setSimResult(res);
      toast.success('Direct ERP batch ingested and validated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'ERP batch push simulation error');
    } finally {
      setSimulating(false);
    }
  };

  const copySecret = () => {
    if (generatedSecret) {
      navigator.clipboard.writeText(generatedSecret);
      setCopied(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Campus ERP & SIS Direct Integration Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Approved Institutional APIs
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Machine-to-Machine REST endpoints for campus management systems (SAP, Oracle, PeopleSoft, Ellucian, bespoke ERPs).
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedSecret(null);
            setShowKeyModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Generate New API Key
        </button>
      </div>

      {/* Active API Keys */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Active Campus ERP Credentials</h2>
          </div>
          <span className="text-xs text-gray-500">
            {keys.length} Key{keys.length !== 1 ? 's' : ''} Configured
          </span>
        </div>

        {keys.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs">
            No institutional API keys generated yet. Click "Generate New API Key" above to connect your campus ERP.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 mt-2">
            {keys.map((k) => (
              <div key={k.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-semibold text-gray-900">{k.key_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      {k.api_key_prefix}••••••••••••
                    </span>
                    <span className="text-gray-400">Created: {new Date(k.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {k.permissions.map((p) => (
                      <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                        {p}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleRevokeKey(k.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Revoke Key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">SIS Real-Time Webhooks</h2>
          </div>
          <button
            onClick={() => setShowWebhookModal(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            + Register Webhook URL
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-xs">
            No active webhooks configured. Register a callback URL to receive real-time discrepancy alerts directly into your campus SIS.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 mt-2">
            {webhooks.map((w) => (
              <div key={w.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-gray-800 font-medium block">{w.target_url}</span>
                  <div className="flex gap-1 mt-1">
                    {w.event_types.map((ev) => (
                      <span key={ev} className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-gray-600 font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">ACTIVE</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Machine-to-Machine Integration Documentation & Testing */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
          <Code className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900">Direct Ingestion Specification</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="text-xs space-y-3">
            <p className="text-gray-600 leading-relaxed">
              Your institutional ERP can directly push student enrollment batches in JSON format without manual CSV uploads.
            </p>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 font-mono text-[11px]">
              <div><strong className="text-indigo-700">POST</strong> /api/v1/institution-api/v1/sis/push-records</div>
              <div><strong className="text-gray-500">Header:</strong> X-Institution-API-Key: inst_live_...</div>
              <div><strong className="text-gray-500">Content-Type:</strong> application/json</div>
            </div>
          </div>

          <div className="bg-gray-900 text-gray-200 p-4 rounded-lg font-mono text-[11px] overflow-x-auto">
            <div className="text-gray-400 mb-2">// Sample JSON Ingestion Payload</div>
            <pre>{JSON.stringify({
              admission_cycle: "2026-27",
              records: [
                {
                  institution_student_id: "IITD-2026-CSE-099",
                  student_name: "Aakash Mehta",
                  admission_category: "general",
                  admission_status: "admitted",
                  identity_reference: "DEMO-AAKASH-099"
                }
              ]
            }, null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* Key Modal */}
      {showKeyModal && (
        <Modal
          isOpen={showKeyModal}
          onClose={() => {
            setShowKeyModal(false);
            setGeneratedSecret(null);
          }}
          title={generatedSecret ? "Institutional API Key Created" : "Generate Institutional API Key"}
        >
          {generatedSecret ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Make sure to copy your API key secret now. You will not be able to see it again.</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={generatedSecret}
                  className="w-full font-mono p-3 bg-gray-100 border border-gray-300 rounded-lg text-xs"
                />
                <button
                  onClick={copySecret}
                  className="absolute right-2 top-2 p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="pt-3 flex justify-end">
                <Button variant="primary" onClick={() => setShowKeyModal(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Key Description / Client Name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowKeyModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Generate Secret</Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <Modal
          isOpen={showWebhookModal}
          onClose={() => setShowWebhookModal(false)}
          title="Register SIS Webhook Target"
        >
          <form onSubmit={handleRegisterWebhook} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Target Callback URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowWebhookModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Register Callback</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InstitutionalApi;
