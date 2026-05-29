import React, { useRef } from 'react';
import {
    Settings2,
    RefreshCw,
    QrCode,
    Eye,
    EyeOff,
    Database
} from 'lucide-react';

interface SidebarProps {
    headers: string[];
    selectedColumns: string[];
    setSelectedColumns: React.Dispatch<React.SetStateAction<string[]>>;
    selectedQRColumns: string[];
    setSelectedQRColumns: React.Dispatch<React.SetStateAction<string[]>>;
    logo: string;
    setLogo: (url: string) => void;
    onClear: () => void;
    defaultLogo: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
    headers,
    selectedColumns,
    setSelectedColumns,
    selectedQRColumns,
    setSelectedQRColumns,
    logo,
    setLogo,
    defaultLogo
}) => {
    const logoInputRef = useRef<HTMLInputElement>(null);

    const toggleDisplay = (header: string) => {
        setSelectedColumns(prev =>
            prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
        );
    };

    const toggleQR = (header: string) => {
        setSelectedQRColumns(prev =>
            prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
        );
    };

    const bulkAction = (type: 'display' | 'qr', action: 'all' | 'none') => {
        const setter = type === 'display' ? setSelectedColumns : setSelectedQRColumns;
        setter(action === 'all' ? [...headers] : []);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => setLogo(evt.target?.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            {/* Branding Section - Clean & Professional */}
            <div className="bg-white/40 backdrop-blur-sm p-5 border border-[#E5E7EB] relative overflow-hidden shadow-sm">
                <label className="text-[10px] font-black text-[#737373] uppercase tracking-widest mb-4 block flex items-center gap-2">
                    <RefreshCw size={10} /> Organization Identity
                </label>

                <div className="flex items-start gap-4">
                    <div
                        className="relative w-20 h-20 bg-white border border-[#E5E7EB] flex items-center justify-center overflow-hidden shrink-0 transition-colors cursor-pointer group hover:border-[#000000]"
                        onClick={() => logoInputRef.current?.click()}
                    >
                        <img src={logo} alt="Seal" className="max-w-full max-h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-[#1A1A1A]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold uppercase tracking-wider">Change</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <button
                            onClick={() => logoInputRef.current?.click()}
                            className="w-full py-2.5 px-3 bg-black text-white text-[10px] font-bold hover:bg-black/80 transition-all active:scale-97 uppercase tracking-wider"
                        >
                            Upload The Logo
                        </button>
                        <button
                            onClick={() => setLogo(defaultLogo)}
                            className="w-full py-2.5 px-3 bg-white hover:bg-[#F3F4F6] text-[#737373] transition-all border border-[#E5E7EB] text-[10px] font-bold uppercase tracking-wider"
                        >
                            Reset Default
                        </button>
                    </div>
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            </div>

            {/* Field Configuration - Structured Table View */}
            <div className="bg-white/40 backdrop-blur-sm border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[calc(100vh-320px)] shadow-sm">
                <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                        <Settings2 size={12} className="text-[#737373]" /> Field Configuration
                    </h3>
                    <span className="text-[9px] font-bold bg-[#FAFAFA] text-[#737373] px-2.5 py-1 border border-[#E5E7EB]">
                        {headers.length} COLUMNS
                    </span>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-[#E5E7EB] bg-[#FAFAFA] text-[9px] font-black text-[#737373] uppercase tracking-widest">
                    <div className="col-span-6 pl-2">Field Name</div>
                    <div className="col-span-3 text-center cursor-pointer hover:text-black transition-colors" onClick={() => bulkAction('display', 'all')}>
                        Show
                    </div>
                    <div className="col-span-3 text-center cursor-pointer hover:text-black transition-colors" onClick={() => bulkAction('qr', 'all')}>
                        Encode
                    </div>
                </div>

                {/* Scrollable Table Body */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                    {headers.length > 0 ? headers.map((header) => {
                        const isShown = selectedColumns.includes(header);
                        const isInQR = selectedQRColumns.includes(header);

                        return (
                            <div key={header} className="grid grid-cols-12 gap-2 items-center p-2 hover:bg-[#F3F4F6] transition-colors group">
                                <div className="col-span-6 pl-2 flex items-center gap-2">
                                    <Database size={10} className="text-[#737373]/30" />
                                    <span className={`text-[10px] font-bold truncate block tracking-tight ${isShown ? 'text-[#1A1A1A]' : 'text-[#737373]/40'}`} title={header}>
                                        {header}
                                    </span>
                                </div>

                                {/* Visual Toggle: Display */}
                                <div className="col-span-3 flex justify-center">
                                    <button
                                        onClick={() => toggleDisplay(header)}
                                        className={`w-8 h-6 flex items-center justify-center transition-all ${isShown ? 'bg-black text-white' : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#F3F4F6] border border-[#E5E7EB]'}`}
                                    >
                                        {isShown ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                </div>

                                {/* Visual Toggle: QR */}
                                <div className="col-span-3 flex justify-center">
                                    <button
                                        onClick={() => toggleQR(header)}
                                        className={`w-8 h-6 flex items-center justify-center transition-all ${isInQR ? 'bg-black text-white' : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#F3F4F6] border border-[#E5E7EB]'}`}
                                    >
                                        <QrCode size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center px-6">
                            <Database size={24} className="text-[#737373]/30 mb-3" />
                            <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">No Database Loaded</p>
                            <p className="text-[10px] text-[#737373]/50 mt-1">Import a file to configure fields</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t border-[#E5E7EB] bg-[#FAFAFA]">
                    <div className="flex gap-2">
                        <button onClick={() => { bulkAction('display', 'all'); bulkAction('qr', 'all') }} className="flex-1 py-2 bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#1A1A1A] text-[9px] font-black uppercase transition-all tracking-wider">
                            Select All
                        </button>
                        <button onClick={() => { bulkAction('display', 'none'); bulkAction('qr', 'none') }} className="flex-1 py-2 bg-white hover:bg-red-50 hover:text-red-600 border border-[#E5E7EB] text-[#737373] text-[9px] font-black uppercase transition-all tracking-wider">
                            Clear All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
