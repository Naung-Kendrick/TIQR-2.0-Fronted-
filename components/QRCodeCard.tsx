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

        // Construct QR Data
        const qrValue = selectedQRColumns
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
            const name = String(row[nameField] || '').trim();
            if (name) {
                return `${name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ')}.png`;
            }
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
                className={`group bg-white rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden h-full ${
                    isSelected
                        ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-blue-100'
                        : 'border-slate-200'
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
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected
                                    ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/30'
                                    : 'bg-white/90 border-slate-300 hover:border-blue-400 hover:bg-blue-50 backdrop-blur-sm'
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
                    <div className="absolute inset-0 bg-blue-500/[0.03] pointer-events-none z-0" />
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
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center bg-slate-50/30">
                    <div className={`flex items-center gap-2 overflow-hidden ${selectionMode ? 'ml-7' : ''}`}>
                        <div className="w-7 h-7 bg-white rounded-md border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                            <img src={logo} className="w-full h-full object-contain filter grayscale opacity-80" alt="seal" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest leading-none mb-0.5">Official Document</span>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight break-all">
                                {row[titleField] || "IDENTITY"}
                            </h4>
                        </div>
                    </div>
                </div>

                {/* QR Section */}
                <div className="py-3 px-4 flex flex-col items-center justify-center relative">
                    <div ref={qrRef} className="bg-white p-1 rounded-md border border-slate-200 shadow-sm relative z-10">
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
                    <div className="space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                        {displayFields.length > 0 ? displayFields.slice(0, 3).map(col => (
                            <div key={col} className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{col}</span>
                                <span className="text-xs text-slate-700 font-semibold truncate">
                                    {row[col] || '—'}
                                </span>
                            </div>
                        )) : (
                            <div className="py-1 text-center">
                                <p className="text-[9px] text-slate-400 italic">No fields selected</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); downloadQR(); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all text-[10px] font-bold shadow-sm active:scale-95 uppercase tracking-wider"
                        >
                            <Download size={12} /> Download
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                            className={`px-2.5 py-2 rounded-md transition-all border ${isCopied
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
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
