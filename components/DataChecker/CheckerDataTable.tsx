import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Calendar,
  User
} from 'lucide-react';
import { ValidatedRow } from '../../lib/dataChecker/types';

interface CheckerDataTableProps {
  rows: ValidatedRow[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onInspectRow: (row: ValidatedRow) => void;
}

type SortColumn = 'rowNumber' | 'rawId' | 'rawName' | 'rawGender' | 'rawDob' | 'rawDoi' | 'status';
type SortDirection = 'asc' | 'desc';

export const CheckerDataTable: React.FC<CheckerDataTableProps> = ({
  rows,
  activeFilter,
  onSelectFilter,
  onInspectRow
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortColumn, setSortColumn] = useState<SortColumn>('rowNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filter logic
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      // 1. Status Filter (from top cards)
      if (activeFilter === 'PASS' && r.status !== 'PASS') return false;
      if (activeFilter === 'FAIL' && r.status !== 'FAIL') return false;
      if (activeFilter === 'WARNING' && r.status !== 'WARNING') return false;
      if (activeFilter === 'ID_ERRORS' && !r.hasIdError) return false;
      if (activeFilter === 'GENDER_MISMATCH' && !r.hasGenderMismatch) return false;
      if (activeFilter === 'DOB_ERRORS' && !r.hasDobError) return false;
      if (activeFilter === 'DOI_ERRORS' && !r.hasDoiError) return false;
      if (activeFilter === 'UNRECOGNIZED_PREFIX' && !r.hasUnrecognizedPrefix) return false;

      // 2. Secondary Category Filter
      if (categoryFilter === 'ID_ERRORS' && !r.hasIdError) return false;
      if (categoryFilter === 'GENDER_MISMATCH' && !r.hasGenderMismatch) return false;
      if (categoryFilter === 'DOB_ERRORS' && !r.hasDobError) return false;
      if (categoryFilter === 'DOI_ERRORS' && !r.hasDoiError) return false;
      if (categoryFilter === 'MISSING_VALUES' && !r.hasMissingValue) return false;
      if (categoryFilter === 'UNRECOGNIZED_PREFIX' && !r.hasUnrecognizedPrefix) return false;
      if (categoryFilter === 'DUPLICATES' && !r.isDuplicate) return false;

      // 3. Search Term
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchesId = r.rawId.toLowerCase().includes(s);
        const matchesName = r.rawName.toLowerCase().includes(s);
        const matchesRow = String(r.rowNumber).includes(s);
        const matchesErrors = [...r.errors, ...r.warnings].some(
          e => e.message.toLowerCase().includes(s) || e.code.toLowerCase().includes(s)
        );

        if (!matchesId && !matchesName && !matchesRow && !matchesErrors) {
          return false;
        }
      }

      return true;
    });
  }, [rows, activeFilter, categoryFilter, searchTerm]);

  // Sort logic
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      if (sortColumn === 'status') {
        // Priority: FAIL > WARNING > PASS
        const priority: Record<string, number> = { FAIL: 3, WARNING: 2, PASS: 1 };
        valA = priority[a.status] || 0;
        valB = priority[b.status] || 0;
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  // Pagination logic
  const totalItems = sortedRows.length;
  const effectivePageSize = pageSize === -1 ? totalItems : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / (effectivePageSize || 1)));
  const pageIndex = Math.min(currentPage, totalPages);
  const startIndex = (pageIndex - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalItems);
  const pageRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown size={11} className="opacity-40" />;
    return sortDirection === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden">
      {/* Control Bar: Tabs, Search, Filters */}
      <div className="p-3 sm:p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Status Filter Tabs: ALL / PASS / FAIL only */}
        <div className="flex items-center gap-1">
          {[
            { id: 'ALL', label: 'All', count: rows.length },
            { id: 'PASS', label: 'Pass', count: rows.filter(r => r.status === 'PASS').length },
            { id: 'FAIL', label: 'Fail', count: rows.filter(r => r.status === 'FAIL' || r.status === 'WARNING').length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onSelectFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-2 ${
                activeFilter === tab.id
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-[#737373] border-[#E5E7EB] hover:text-black hover:bg-[#F3F4F6]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  activeFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F3F4F6] text-[#1A1A1A] border border-[#E5E7EB]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box only */}
        <div className="relative min-w-[220px] sm:min-w-[260px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B0B0]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search ID, name, row..."
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-[#E5E7EB] text-xs font-mono placeholder:font-sans placeholder:text-[10px] placeholder:text-[#B0B0B0] focus:border-black focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-black"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[9px] font-black uppercase tracking-widest text-[#737373]">
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-black transition-colors"
                onClick={() => handleSort('rowNumber')}
              >
                <div className="flex items-center gap-1">
                  <span>Row</span>
                  {getSortIcon('rowNumber')}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-black transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-black transition-colors"
                onClick={() => handleSort('rawId')}
              >
                <div className="flex items-center gap-1">
                  <Fingerprint size={10} />
                  <span>Ta'ang Land ID No.</span>
                  {getSortIcon('rawId')}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-black transition-colors"
                onClick={() => handleSort('rawName')}
              >
                <div className="flex items-center gap-1">
                  <User size={10} />
                  <span>Name & Prefix</span>
                  {getSortIcon('rawName')}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-black transition-colors"
                onClick={() => handleSort('rawGender')}
              >
                <div className="flex items-center gap-1">
                  <span>Gender</span>
                  {getSortIcon('rawGender')}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-black transition-colors"
                onClick={() => handleSort('rawDob')}
              >
                <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  <span>Date of Birth</span>
                  {getSortIcon('rawDob')}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-black transition-colors"
                onClick={() => handleSort('rawDoi')}
              >
                <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  <span>Date of Issue</span>
                  {getSortIcon('rawDoi')}
                </div>
              </th>
              <th className="py-2.5 px-3">Validation Findings</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] bg-white">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#737373]">
                  <AlertOctagon size={24} className="mx-auto mb-2 opacity-30 text-[#737373]" />
                  <p className="text-xs font-bold uppercase tracking-wider">No matching records found</p>
                  <p className="text-[10px] mt-1">Try adjusting the filter criteria or clear the search query.</p>
                </td>
              </tr>
            ) : (
              pageRows.map(row => {
                const allIssues = [...row.errors, ...row.warnings];

                return (
                  <tr
                    key={row.rowNumber}
                    className="hover:bg-[#F3F4F6]/70 transition-colors group cursor-pointer"
                    onClick={() => onInspectRow(row)}
                  >
                    {/* Row # */}
                    <td className="py-2.5 px-3 font-mono text-[10px] font-bold text-[#737373] whitespace-nowrap">
                      #{row.rowNumber}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                          row.status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : row.status === 'FAIL'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {row.status === 'PASS' && <CheckCircle2 size={9} />}
                        {row.status === 'FAIL' && <AlertOctagon size={9} />}
                        {row.status === 'WARNING' && <AlertTriangle size={9} />}
                        {row.status}
                      </span>
                    </td>

                    {/* Ta'ang Land ID No. */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono text-xs font-black tracking-wider ${
                            row.hasIdError ? 'text-red-600 bg-red-50 px-1 border border-red-200' : 'text-[#1A1A1A]'
                          }`}
                        >
                          {row.rawId || <span className="text-[#737373] italic">&lt;MISSING&gt;</span>}
                        </span>
                        {row.rawId && row.rawId.length !== 19 && (
                          <span className="text-[8px] font-mono text-red-600 font-bold">
                            ({row.rawId.length}d)
                          </span>
                        )}
                        {row.isDuplicate && (
                          <span className="text-[7px] font-black uppercase px-1 bg-amber-100 text-amber-800 border border-amber-300">
                            DUP
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name & Matched Prefix */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#1A1A1A] text-xs">
                          {row.rawName || <span className="text-[#737373] italic">&lt;EMPTY&gt;</span>}
                        </span>
                        {row.matchedPrefix && (
                          <span className="text-[8px] font-mono font-bold uppercase px-1 bg-[#FAFAFA] border border-[#E5E7EB] text-[#737373]">
                            [{row.matchedPrefix}]
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Gender (Actual vs Expected) */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {row.hasGenderMismatch ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-bold text-red-600 line-through">
                            {row.rawGender || '—'}
                          </span>
                          <span className="text-[8px] text-[#737373]">→</span>
                          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-1 border border-blue-200">
                            {row.expectedGender}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                          {row.rawGender || <span className="text-[#737373] italic">—</span>}
                        </span>
                      )}
                    </td>

                    {/* DOB */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-mono text-xs ${
                            row.hasDobError ? 'text-red-600 font-bold bg-red-50 px-1 border border-red-200' : 'text-[#1A1A1A]'
                          }`}
                        >
                          {String(row.rawDob ?? '') || <span className="text-[#737373] italic">—</span>}
                        </span>
                        {row.dobResult?.isAmbiguous && (
                          <span className="text-[7px] font-black px-1 bg-amber-100 text-amber-800 border border-amber-300">
                            AMBIGUOUS
                          </span>
                        )}
                      </div>
                    </td>

                    {/* DOI */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`font-mono text-xs ${
                          row.hasDoiError ? 'text-red-600 font-bold bg-red-50 px-1 border border-red-200' : 'text-[#1A1A1A]'
                        }`}
                      >
                        {String(row.rawDoi ?? '') || <span className="text-[#737373] italic">—</span>}
                      </span>
                    </td>

                    {/* Validation Findings */}
                    <td className="py-2.5 px-3 max-w-xs">
                      {allIssues.length === 0 ? (
                        <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {allIssues.map((issue, i) => (
                            <span
                              key={i}
                              title={issue.message}
                              className={`text-[8px] font-mono font-bold uppercase px-1 py-0.2 border truncate max-w-[200px] ${
                                issue.severity === 'ERROR'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {issue.code}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onInspectRow(row);
                        }}
                        className="px-2 py-1 bg-white border border-[#E5E7EB] hover:border-black text-[9px] font-bold uppercase tracking-wider text-[#1A1A1A] transition-all"
                      >
                        <Eye size={10} className="inline mr-1" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Summary Footer */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFAFA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-[10px] text-[#737373] font-bold uppercase tracking-wider">
          Showing <span className="text-black font-mono">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
          <span className="text-black font-mono">{endIndex}</span> of{' '}
          <span className="text-black font-mono">{totalItems}</span> filtered records (Total:{' '}
          <span className="font-mono">{rows.length}</span>)
        </div>

        <div className="flex items-center gap-3">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#737373] font-bold uppercase">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-[#E5E7EB] font-mono text-xs focus:border-black focus:outline-none"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="-1">All</option>
            </select>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageIndex <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 border border-[#E5E7EB] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F3F4F6] text-[#1A1A1A] transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="px-2 font-mono text-[10px] font-bold">
              {pageIndex} / {totalPages}
            </span>
            <button
              type="button"
              disabled={pageIndex >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-[#E5E7EB] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F3F4F6] text-[#1A1A1A] transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
