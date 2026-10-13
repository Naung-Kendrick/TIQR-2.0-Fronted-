import React, { useState } from 'react';
import {
  X,
  Settings2,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Calendar,
  Users2,
  Database
} from 'lucide-react';
import { CheckerConfig, ExpectedDateFormat } from '../../lib/dataChecker/types';
import { DEFAULT_CHECKER_CONFIG } from '../../lib/dataChecker/validator';

interface CheckerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CheckerConfig;
  onSaveConfig: (newConfig: CheckerConfig) => void;
  availableHeaders: string[];
}

export const CheckerConfigModal: React.FC<CheckerConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  availableHeaders
}) => {
  const [localConfig, setLocalConfig] = useState<CheckerConfig>(config);
  const [newMalePrefix, setNewMalePrefix] = useState('');
  const [newFemalePrefix, setNewFemalePrefix] = useState('');
  const [activeTab, setActiveTab] = useState<'prefixes' | 'dates' | 'columns'>('prefixes');

  // Keep localConfig updated when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleAddMalePrefix = () => {
    const val = newMalePrefix.trim();
    if (val && !localConfig.prefixRules.malePrefixes.map(p => p.toLowerCase()).includes(val.toLowerCase())) {
      setLocalConfig(prev => ({
        ...prev,
        prefixRules: {
          ...prev.prefixRules,
          malePrefixes: [...prev.prefixRules.malePrefixes, val]
        }
      }));
      setNewMalePrefix('');
    }
  };

  const handleRemoveMalePrefix = (prefixToRemove: string) => {
    setLocalConfig(prev => ({
      ...prev,
      prefixRules: {
        ...prev.prefixRules,
        malePrefixes: prev.prefixRules.malePrefixes.filter(p => p !== prefixToRemove)
      }
    }));
  };

  const handleAddFemalePrefix = () => {
    const val = newFemalePrefix.trim();
    if (val && !localConfig.prefixRules.femalePrefixes.map(p => p.toLowerCase()).includes(val.toLowerCase())) {
      setLocalConfig(prev => ({
        ...prev,
        prefixRules: {
          ...prev.prefixRules,
          femalePrefixes: [...prev.prefixRules.femalePrefixes, val]
        }
      }));
      setNewFemalePrefix('');
    }
  };

  const handleRemoveFemalePrefix = (prefixToRemove: string) => {
    setLocalConfig(prev => ({
      ...prev,
      prefixRules: {
        ...prev.prefixRules,
        femalePrefixes: prev.prefixRules.femalePrefixes.filter(p => p !== prefixToRemove)
      }
    }));
  };

  const handleResetDefaults = () => {
    setLocalConfig(DEFAULT_CHECKER_CONFIG);
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-black" />
            <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider">
              Validation Rules & Settings Configurator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] text-[#737373] hover:text-[#1A1A1A] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E5E7EB] bg-[#FAFAFA] text-[10px] font-black uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('prefixes')}
            className={`flex-1 py-2.5 px-3 border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'prefixes'
                ? 'border-black text-black bg-white'
                : 'border-transparent text-[#737373] hover:text-black'
            }`}
          >
            <Users2 size={12} /> Name Prefixes & Gender
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dates')}
            className={`flex-1 py-2.5 px-3 border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'dates'
                ? 'border-black text-black bg-white'
                : 'border-transparent text-[#737373] hover:text-black'
            }`}
          >
            <Calendar size={12} /> Date (DOB & DOI) Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`flex-1 py-2.5 px-3 border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'columns'
                ? 'border-black text-black bg-white'
                : 'border-transparent text-[#737373] hover:text-black'
            }`}
          >
            <Database size={12} /> Column Mappings
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
          {/* TAB 1: PREFIXES */}
          {activeTab === 'prefixes' && (
            <div className="space-y-5">
              <p className="text-[11px] text-[#737373] leading-relaxed">
                Configure legal name prefixes associated with Male (M) and Female (F) genders. Prefixes are evaluated using boundary-aware prefix rules.
              </p>

              {/* Male Prefixes */}
              <div className="p-4 border border-[#E5E7EB] bg-[#FAFAFA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]">
                    Male (M) Prefixes ({localConfig.prefixRules.malePrefixes.length})
                  </span>
                  <span className="text-[9px] text-[#737373] uppercase font-mono">Requires Gender = 'M'</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {localConfig.prefixRules.malePrefixes.map(p => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#E5E7EB] text-[10px] font-mono font-bold text-[#1A1A1A]"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemoveMalePrefix(p)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newMalePrefix}
                    onChange={e => setNewMalePrefix(e.target.value)}
                    placeholder="Add male prefix (e.g. Ko, Sai)..."
                    className="flex-1 px-3 py-1.5 border border-[#E5E7EB] bg-white text-xs font-mono focus:border-black focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMalePrefix();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddMalePrefix}
                    className="px-3 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black/80 transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>

              {/* Female Prefixes */}
              <div className="p-4 border border-[#E5E7EB] bg-[#FAFAFA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]">
                    Female (F) Prefixes ({localConfig.prefixRules.femalePrefixes.length})
                  </span>
                  <span className="text-[9px] text-[#737373] uppercase font-mono">Requires Gender = 'F'</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {localConfig.prefixRules.femalePrefixes.map(p => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#E5E7EB] text-[10px] font-mono font-bold text-[#1A1A1A]"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemoveFemalePrefix(p)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newFemalePrefix}
                    onChange={e => setNewFemalePrefix(e.target.value)}
                    placeholder="Add female prefix (e.g. Nang, Mi)..."
                    className="flex-1 px-3 py-1.5 border border-[#E5E7EB] bg-white text-xs font-mono focus:border-black focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFemalePrefix();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFemalePrefix}
                    className="px-3 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black/80 transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATES */}
          {activeTab === 'dates' && (
            <div className="space-y-4">
              <div className="p-4 border border-[#E5E7EB] bg-[#FAFAFA] space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] block">
                  Expected Date Format
                </label>
                <select
                  value={localConfig.dateRules.expectedFormat}
                  onChange={e =>
                    setLocalConfig(prev => ({
                      ...prev,
                      dateRules: {
                        ...prev.dateRules,
                        expectedFormat: e.target.value as ExpectedDateFormat
                      }
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#E5E7EB] bg-white font-mono text-xs focus:border-black focus:outline-none"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Day/Month/Year - Myanmar Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (Month/Day/Year)</option>
                </select>
                <p className="text-[10px] text-[#737373]">
                  Default format for interpreting numeric date strings in uploaded Excel/CSV files.
                </p>
              </div>

              <div className="p-4 border border-[#E5E7EB] bg-[#FAFAFA] space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] block">
                  Ambiguous Date Behavior (e.g. 03/04/2000)
                </label>
                <select
                  value={localConfig.dateRules.ambiguousResolution}
                  onChange={e =>
                    setLocalConfig(prev => ({
                      ...prev,
                      dateRules: {
                        ...prev.dateRules,
                        ambiguousResolution: e.target.value as any
                      }
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#E5E7EB] bg-white font-mono text-xs focus:border-black focus:outline-none"
                >
                  <option value="PROMPT">Display Warning & Prompt User For Confirmation (Strict)</option>
                  <option value="FORCE_DD_MM">Always Interpret as DD/MM/YYYY (Day First)</option>
                  <option value="FORCE_MM_DD">Always Interpret as MM/DD/YYYY (Month First)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 border border-[#E5E7EB] bg-[#FAFAFA] space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] block">
                    Minimum Allowed Birth Year
                  </label>
                  <input
                    type="number"
                    value={localConfig.dateRules.minBirthYear}
                    onChange={e =>
                      setLocalConfig(prev => ({
                        ...prev,
                        dateRules: {
                          ...prev.dateRules,
                          minBirthYear: parseInt(e.target.value) || 1900
                        }
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-[#E5E7EB] bg-white font-mono text-xs focus:border-black focus:outline-none"
                  />
                  <p className="text-[9px] text-[#737373]">Birth years earlier than this are flagged as OUT_OF_RANGE_DOB.</p>
                </div>

                <div className="p-4 border border-[#E5E7EB] bg-[#FAFAFA] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] block">
                      Enforce Min Age at Issue
                    </label>
                    <input
                      type="checkbox"
                      checked={localConfig.dateRules.enableMinAgeAtIssue}
                      onChange={e =>
                        setLocalConfig(prev => ({
                          ...prev,
                          dateRules: {
                            ...prev.dateRules,
                            enableMinAgeAtIssue: e.target.checked
                          }
                        }))
                      }
                      className="cursor-pointer"
                    />
                  </div>
                  {localConfig.dateRules.enableMinAgeAtIssue && (
                    <input
                      type="number"
                      value={localConfig.dateRules.minAgeAtIssue}
                      onChange={e =>
                        setLocalConfig(prev => ({
                          ...prev,
                          dateRules: {
                            ...prev.dateRules,
                            minAgeAtIssue: parseInt(e.target.value) || 10
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[#E5E7EB] bg-white font-mono text-xs focus:border-black focus:outline-none"
                    />
                  )}
                  <p className="text-[9px] text-[#737373]">Optional rule to flag documents issued before person was eligible.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLUMNS */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <p className="text-[11px] text-[#737373] leading-relaxed">
                Manually configure which spreadsheet header corresponds to each required data attribute.
              </p>

              <div className="space-y-3">
                {[
                  { key: 'idColumn', label: "Ta'ang Land ID No. Column", required: true },
                  { key: 'nameColumn', label: 'Person Name Column', required: true },
                  { key: 'genderColumn', label: 'Gender Column', required: true },
                  { key: 'dobColumn', label: 'Date of Birth (DOB) Column', required: true },
                  { key: 'doiColumn', label: 'Date of Issue (DOI) Column', required: true }
                ].map(({ key, label, required }) => (
                  <div key={key} className="p-3 border border-[#E5E7EB] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] block">
                        {label}
                      </span>
                      <span className="text-[9px] text-[#737373] font-mono">
                        Current: {(localConfig.columnMapping as any)[key] || 'None'}
                      </span>
                    </div>

                    <select
                      value={(localConfig.columnMapping as any)[key] || ''}
                      onChange={e =>
                        setLocalConfig(prev => ({
                          ...prev,
                          columnMapping: {
                            ...prev.columnMapping,
                            [key]: e.target.value
                          }
                        }))
                      }
                      className="px-3 py-1.5 border border-[#E5E7EB] bg-white font-mono text-xs focus:border-black focus:outline-none min-w-[200px]"
                    >
                      <option value="">-- Select Header --</option>
                      {availableHeaders.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                      {/* Allow custom entry if not in list */}
                      {!availableHeaders.includes((localConfig.columnMapping as any)[key]) &&
                        (localConfig.columnMapping as any)[key] && (
                          <option value={(localConfig.columnMapping as any)[key]}>
                            {(localConfig.columnMapping as any)[key]} (Custom)
                          </option>
                        )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 border border-[#E5E7EB] bg-white hover:bg-red-50 hover:text-red-700 text-[#737373] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <RotateCcw size={12} /> Reset Defaults
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] bg-white text-[#737373] hover:text-black text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black/80 transition-all active:scale-97 flex items-center gap-1.5"
            >
              <Check size={12} /> Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
