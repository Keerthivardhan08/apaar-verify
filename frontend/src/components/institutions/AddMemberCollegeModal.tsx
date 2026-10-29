import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { institutionApi } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Building2,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Layers,
  Award,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface AddMemberCollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ALL_BRANCHES = [
  { code: 'CS', name: 'Computer Science & Engineering', discipline: 'Computer Science' },
  { code: 'IT', name: 'Information Technology', discipline: 'Information Technology' },
  { code: 'AI', name: 'Artificial Intelligence & Machine Learning', discipline: 'Artificial Intelligence' },
  { code: 'DS', name: 'Data Science & Engineering', discipline: 'Data Science' },
  { code: 'EC', name: 'Electronics & Communication', discipline: 'Electronics' },
  { code: 'EE', name: 'Electrical & Electronics Engineering', discipline: 'Electrical' },
  { code: 'ME', name: 'Mechanical Engineering', discipline: 'Mechanical' },
  { code: 'CE', name: 'Civil Engineering', discipline: 'Civil' },
  { code: 'CH', name: 'Chemical Engineering', discipline: 'Chemical' },
  { code: 'AE', name: 'Aerospace & Aeronautical Engineering', discipline: 'Aeronautical' },
  { code: 'RA', name: 'Robotics & Automation', discipline: 'Robotics' },
  { code: 'BT', name: 'Biotechnology & Biochemical Engineering', discipline: 'Biotechnology' },
];

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const AddMemberCollegeModal: React.FC<AddMemberCollegeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [institutionType, setInstitutionType] = useState('STATE_UNIVERSITY');
  const [state, setState] = useState('Karnataka');
  const [city, setCity] = useState('');
  const [naacGrade, setNaacGrade] = useState('A+');
  const [naacCgpa, setNaacCgpa] = useState('3.60');
  const [nbaTier, setNbaTier] = useState('Tier-1');
  const [nbaStatus, setNbaStatus] = useState('Accredited');
  const [eoaRef, setEoaRef] = useState('');
  const [capacity, setCapacity] = useState('120');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    ALL_BRANCHES.map((b) => b.code)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleBranch = (bCode: string) => {
    if (selectedBranches.includes(bCode)) {
      if (selectedBranches.length === 1) {
        toast.error('At least one engineering branch is required.');
        return;
      }
      setSelectedBranches(selectedBranches.filter((c) => c !== bCode));
    } else {
      setSelectedBranches([...selectedBranches, bCode]);
    }
  };

  const selectAllBranches = () => {
    setSelectedBranches(ALL_BRANCHES.map((b) => b.code));
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === autoCode(name)) {
      setCode(autoCode(val));
    }
  };

  const autoCode = (str: string) => {
    const parts = str.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return parts.map((p) => p[0].toUpperCase()).slice(0, 4).join('') + '-01';
    }
    return str.substring(0, 4).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Institution name is required.');
      return;
    }
    if (!code.trim()) {
      toast.error('Institution code is required.');
      return;
    }
    if (!city.trim()) {
      toast.error('City is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        institution_code: code.trim().toUpperCase(),
        institution_type: institutionType,
        state,
        city: city.trim(),
        naac_grade: naacGrade,
        naac_cgpa: naacCgpa,
        nba_tier: nbaTier,
        nba_status: nbaStatus,
        eoa_reference: eoaRef.trim() || undefined,
        default_capacity: parseInt(capacity, 10) || 120,
        branches: selectedBranches,
      };

      await institutionApi.createInstitution(payload);
      toast.success(`Successfully registered ${name.trim()} with ${selectedBranches.length} approved branches!`);
      
      // Reset form
      setName('');
      setCode('');
      setCity('');
      setEoaRef('');
      setSelectedBranches(ALL_BRANCHES.map((b) => b.code));
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to register member college.';
      toast.error(msg);
      console.error('Error adding member college:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New AICTE Member College"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-gray-800">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">AICTE National Institution Registration Desk</h2>
              <p className="text-xs text-indigo-200">
                Onboard recognized engineering institutions with accredited branches and capacity caps.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Official MoE Gate
          </span>
        </div>

        {/* Basic Institution Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Institution Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. National Institute of Advanced Technology & Research"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Institution Permanent Code / AICTE ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NIAT-PUN"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Institution Category / Classification
            </label>
            <select
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="CENTRAL_INSTITUTE">Central Institute (IIT/NIT/IIIT/BITS)</option>
              <option value="STATE_UNIVERSITY">State Technological University (DTU/COEP/Anna/VJTI)</option>
              <option value="PRIVATE_COLLEGE">Private Technical College (RVCE/BMS/DSCE/PSG)</option>
              <option value="AUTONOMOUS_COLLEGE">Autonomous Engineering College</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              State *
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              City / Campus Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pune, Bengaluru, Hyderabad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Accreditation & Regulatory Credentials */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Accreditation & AICTE Approval Reference</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">NAAC Grade</label>
              <select
                value={naacGrade}
                onChange={(e) => setNaacGrade(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              >
                <option value="A++">A++ (Elite)</option>
                <option value="A+">A+ (Superior)</option>
                <option value="A">A (Standard)</option>
                <option value="B++">B++</option>
                <option value="Under Assessment">Under Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">NAAC CGPA</label>
              <input
                type="text"
                value={naacCgpa}
                onChange={(e) => setNaacCgpa(e.target.value)}
                placeholder="e.g. 3.65"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">NBA Status</label>
              <select
                value={nbaStatus}
                onChange={(e) => setNbaStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              >
                <option value="Accredited">Accredited</option>
                <option value="Provisional">Provisional</option>
                <option value="In Process">In Process</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Default Capacity</label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              >
                <option value="60">60 Seats</option>
                <option value="120">120 Seats</option>
                <option value="180">180 Seats</option>
                <option value="240">240 Seats</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              AICTE Extension of Approval (EOA) Sanction Reference
            </label>
            <input
              type="text"
              placeholder={`Auto-assigned: AICTE/EOA/2026-27/${code || 'CODE'}-001`}
              value={eoaRef}
              onChange={(e) => setEoaRef(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg bg-white"
            />
          </div>
        </div>

        {/* Engineering Branches Selection Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Approved Engineering Branches ({selectedBranches.length} selected)</span>
            </label>
            <button
              type="button"
              onClick={selectAllBranches}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
            >
              Select All 12 Branches
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
            {ALL_BRANCHES.map((b) => {
              const isChecked = selectedBranches.includes(b.code);
              return (
                <div
                  key={b.code}
                  onClick={() => toggleBranch(b.code)}
                  className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <div className="truncate">
                    <span className="font-mono font-bold mr-1">{b.code}:</span>
                    <span>{b.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Plus className="w-4 h-4" />}
            className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Register Member College
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberCollegeModal;
