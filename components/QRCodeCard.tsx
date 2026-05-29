import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Download, ShieldCheck, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { DataRow } from '../types';

interface QRCodeCardProps {
    row: DataRow;
    selectedColumns: string[];
    selectedQRColumns: string[];
    logo: string;
    isSelected?: boolean;
    selectionMode?: boolean;
    onToggleSelect?: (id: string | number) => void;
}

export interface QRCodeCardHandle {
    downloadQR: () => Promise<Blob | null>;
    getFileName: () => string;
}

export const QRCodeCard = forwardRef<QRCodeCardHandle, QRCodeCardProps>(
    ({ row, selectedColumns, selectedQRColumns, logo, isSelected = false, selectionMode = false, onToggleSelect }, ref) => {
        const qrRef = useRef<HTMLDivElement>(null);
        const [isCopied, setIsCopied] = useState(false);

        // Construct QR Data (skip columns with no data)
        const qrValue = selectedQRColumns
            .filter(col => row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '')
            .map(col => `${col}:${row[col]}`)
            .join('|');

        // Identify Fields
        const titleField = selectedColumns[0] || 'Identity Record';
        const displayFields = selectedColumns.slice(1, 6); // Cap at 5 fields

        // Find the best "name" column for file naming
        const nameField = selectedColumns.find(col => col.toLowerCase().includes('name'))
            || selectedColumns[1]
            || titleField;

        const getFileName = () => {
            // Find the ID field — broad match covers "ID No", "ID No.", "ID Number", "No.", "ID", etc.
            const idField = selectedColumns.find(col => {
                const c = col.toLowerCase().replace(/[.\s]/g, '');
                return c === 'idno' || c === 'id' || c === 'idnumber' || c === 'no' || c === 'idno.' || c.startsWith('id');
            });

            const idValue = idField ? String(row[idField] || '').trim() : '';

            if (idValue) {
                // Remove "No - " or "No." prefix if present in the data value
                const cleanedId = idValue.replace(/^No[\s.-]*/i, '').trim();
                return `${cleanedId.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_')}.png`;
            }

            // Fallback: use row index id
            return `QR-${row.id}.png`;
        };

        const downloadQRAsBlob = (): Promise<Blob | null> => {
            return new Promise((resolve) => {
                const canvas = qrRef.current?.querySelector('canvas');
                if (canvas) {
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/png', 1.0);
                } else {
                    resolve(null);
                }
            });
        };

        const downloadQR = () => {
            const canvas = qrRef.current?.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = getFileName();
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            }
        };

        // Expose methods to parent
        useImperativeHandle(ref, () => ({
            downloadQR: downloadQRAsBlob,
            getFileName,
        }));

        const handleCopy = () => {
            navigator.clipboard.writeText(qrValue);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        };

        const handleCardClick = (e: React.MouseEvent) => {
            if (selectionMode && onToggleSelect) {
                e.preventDefault();
                onToggleSelect(row.id);
            }
        };

        return (
            <div
                onClick={handleCardClick}
                className={`group bg-white border hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden h-full ${
                    isSelected
                        ? 'border-black ring-1 ring-black/10'
                        : 'border-[#E5E7EB] hover:border-[#737373]/30 shadow-md'
                } ${selectionMode ? 'cursor-pointer' : ''}`}
            >
                {/* Selection Checkbox */}
                {selectionMode && (
                    <div
                        className="absolute top-3 left-3 z-20"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect?.(row.id);
                        }}
                    >
                        <div
                            className={`w-6 h-6 border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected
                                    ? 'bg-black border-black'
                                    : 'bg-[#FAFAFA] border-[#E5E7EB] hover:border-black backdrop-blur-sm'
                            }`}
                        >
                            {isSelected && (
                                <Check size={14} className="text-white" strokeWidth={3} />
                            )}
                        </div>
                    </div>
                )}

                {/* Selected overlay glow */}
                {isSelected && (
                    <div className="absolute inset-0 bg-black/[0.02] pointer-events-none z-0" />
                )}

                {/* Authenticity Watermark - Guilloche Style */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `url(${logo})`,
                        backgroundPosition: '120% -20%',
                        backgroundSize: '70%',
                        backgroundRepeat: 'no-repeat',
                        filter: 'grayscale(100%)'
                    }}
                />

                {/* Card Header */}
                <div className="px-3 py-2.5 border-b border-[#E5E7EB] flex items-center bg-[#FAFAFA]">
                    <div className={`flex items-center gap-2 overflow-hidden ${selectionMode ? 'ml-7' : ''}`}>
                        <div className="w-7 h-7 bg-white border border-[#E5E7EB] p-0.5 flex items-center justify-center shrink-0">
                            <img src={logo} className="w-full h-full object-contain filter grayscale opacity-80" alt="seal" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] uppercase font-black text-[#737373]/50 tracking-widest leading-none mb-0.5">Official Document</span>
                            <h4 className="text-xs font-bold text-[#1A1A1A] leading-tight break-all">
                                {row[titleField] || "IDENTITY"}
                            </h4>
                        </div>
                    </div>
                </div>

                {/* QR Section */}
                <div className="py-3 px-4 flex flex-col items-center justify-center relative">
                    <div ref={qrRef} className="bg-white p-1 border border-[#E5E7EB] relative z-10">
                        <QRCodeCanvas
                            value={qrValue || "NO_DATA"}
                            size={100}
                            level="M"
                            includeMargin={true}
                            imageSettings={{
                                src: logo,
                                height: 24,
                                width: 24,
                                excavate: true,
                            }}
                            fgColor="#0f172a"
                        />
                    </div>
                </div>

                {/* Data Fields - compact */}
                <div className="px-3 pb-3 mt-auto relative z-10">
                    <div className="space-y-1.5 mb-3 bg-[#FAFAFA] p-2.5 border border-[#E5E7EB]">
                        {displayFields.length > 0 ? displayFields.slice(0, 3).map(col => (
                            <div key={col} className="flex flex-col">
                                <span className="text-[8px] font-bold text-[#737373]/50 uppercase tracking-widest">{col}</span>
                                <span className="text-xs text-[#1A1A1A] font-semibold truncate">
                                    {row[col] || '—'}
                                </span>
                            </div>
                        )) : (
                            <div className="py-1 text-center">
                                <p className="text-[9px] text-[#737373]/40 italic">No fields selected</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); downloadQR(); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-black text-white hover:bg-black/80 transition-all text-[10px] font-bold active:scale-95 uppercase tracking-wider"
                        >
                            <Download size={12} /> Download
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                            className={`px-2.5 py-2 transition-all border ${isCopied
                                    ? 'bg-black text-white border-black'
                                    : 'bg-[#FAFAFA] border-[#E5E7EB] text-[#737373] hover:border-[#737373] hover:text-[#1A1A1A]'
                                }`}
                            title="Copy Data"
                        >
                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);
