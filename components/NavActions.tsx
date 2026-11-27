import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, FileSpreadsheet, BookA, ShieldCheck, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface NavActionsProps {
  onLogout?: () => void;
}

/**
 * Unified top-right navigation bar across TIQR Creator, Data Checker, and Name Dictionary.
 * Keeps tab order, heights, and active states consistent so buttons never shift across pages.
 */
export function NavActions({ onLogout }: NavActionsProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const roleRaw = localStorage.getItem('auth_role');
  const roleNum = roleRaw ? parseInt(roleRaw, 10) : UserRole.USER;
  const isAdmin = roleNum === UserRole.ROOT_ADMIN || roleNum === UserRole.ADMIN;

  const isDashboard = pathname === '/dashboard';
  const isChecker = pathname === '/checker';
  const isNames = pathname === '/names' || pathname === '/dictionary';
  const isAdminPage = pathname === '/admin';

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_login_time');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('auth_name');
    navigate('/');
  };

  const baseBtn =
    'h-8 inline-flex items-center gap-1.5 px-2.5 border text-[9px] font-black uppercase tracking-wider transition-all active:scale-97 whitespace-nowrap shrink-0';
  const activeBtn =
    'bg-[#1E3A8A] border-[#1E3A8A] text-white cursor-default shadow-[0_2px_8px_rgba(30,58,138,0.22)]';
  const inactiveBtn =
    'bg-white border-[#E5E7EB] text-[#1A1A1A] hover:border-black hover:bg-black hover:text-white group';

  return (
    <>
      <button
        type="button"
        onClick={() => !isDashboard && navigate('/dashboard')}
        aria-current={isDashboard ? 'page' : undefined}
        className={`${baseBtn} ${isDashboard ? activeBtn : inactiveBtn}`}
        title="TIQR QR Code Creator"
      >
        <QrCode size={12} className={isDashboard ? 'text-white' : 'text-[#1E3A8A] group-hover:text-white transition-colors'} />
        <span className="hidden sm:inline">TIQR CREATOR</span>
        <span className="sm:hidden">TIQR</span>
      </button>

      <button
        type="button"
        onClick={() => !isChecker && navigate('/checker')}
        aria-current={isChecker ? 'page' : undefined}
        className={`${baseBtn} ${isChecker ? activeBtn : inactiveBtn}`}
        title="Excel Data Checker"
      >
        <FileSpreadsheet size={12} className={isChecker ? 'text-white' : 'text-[#1E3A8A] group-hover:text-white transition-colors'} />
        <span className="hidden sm:inline">DATA CHECKER</span>
        <span className="sm:hidden">CHECKER</span>
      </button>

      <button
        type="button"
        onClick={() => !isNames && navigate('/names')}
        aria-current={isNames ? 'page' : undefined}
        className={`${baseBtn} ${isNames ? activeBtn : inactiveBtn}`}
        title="Myanmar–English Name Dictionary & Transliteration"
      >
        <BookA size={12} className={isNames ? 'text-white' : 'text-[#1E3A8A] group-hover:text-white transition-colors'} />
        <span className="hidden sm:inline">NAME DICTIONARY</span>
        <span className="sm:hidden">NAMES</span>
      </button>

      {isAdmin && (
        <button
          type="button"
          onClick={() => !isAdminPage && navigate('/admin')}
          aria-current={isAdminPage ? 'page' : undefined}
          className={`${baseBtn} ${isAdminPage ? activeBtn : inactiveBtn}`}
          title="System Administration"
        >
          <ShieldCheck size={12} />
          <span className="hidden sm:inline">ADMIN</span>
          <span className="sm:hidden">ADM</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="h-8 inline-flex items-center gap-1.5 px-2.5 bg-white border border-[#E5E7EB] text-[#737373] text-[9px] font-black hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-97 uppercase tracking-wider whitespace-nowrap shrink-0"
        title="Logout"
      >
        <LogOut size={12} />
        <span className="hidden sm:inline">LOGOUT</span>
      </button>
    </>
  );
}
