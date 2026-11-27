import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, FileSpreadsheet, BookA, ShieldCheck, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface NavActionsProps {
  onLogout?: () => void;
}

/**
 * Unified top-right navigation — segmented control style.
 * Active tab: navy fill + white text + bottom indicator bar.
 * Inactive tabs: ghost inside a shared tray; hover → navy tint.
 * Logout sits outside the tray as a danger ghost button.
 */
export function NavActions({ onLogout }: NavActionsProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const roleRaw = localStorage.getItem('auth_role');
  const roleNum = roleRaw ? parseInt(roleRaw, 10) : UserRole.USER;
  const isAdmin = roleNum === UserRole.ROOT_ADMIN || roleNum === UserRole.ADMIN;

  const isDashboard = pathname === '/dashboard';
  const isChecker  = pathname === '/checker';
  const isNames    = pathname === '/names' || pathname === '/dictionary';
  const isAdminPage = pathname === '/admin';

  const handleLogout = () => {
    if (onLogout) { onLogout(); return; }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_login_time');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('auth_name');
    navigate('/');
  };

  /* ── shared sizing ── */
  const tabBase =
    'relative h-8 inline-flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 text-[9px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap shrink-0 select-none focus-visible:outline-none';

  const activeTab =
    'bg-[#1E3A8A] text-white z-10';

  const inactiveTab =
    'bg-transparent text-[#555] hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A] active:bg-[#1E3A8A]/20';

  /* bottom indicator bar on active tab */
  const activeIndicator =
    'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-white/60 after:content-[""]';

  return (
    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">

      {/* ── Segmented Nav Tray ── */}
      <nav
        aria-label="Main navigation"
        className="
          flex items-center
          border border-[#D1D5DB]
          bg-[#F3F4F6]
          shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]
          divide-x divide-[#D1D5DB]
          overflow-hidden
        "
      >
        {/* TIQR CREATOR */}
        <button
          type="button"
          onClick={() => !isDashboard && navigate('/dashboard')}
          aria-current={isDashboard ? 'page' : undefined}
          title="TIQR QR Code Creator"
          className={`${tabBase} ${isDashboard ? `${activeTab} ${activeIndicator}` : inactiveTab}`}
        >
          <QrCode
            size={11}
            className={isDashboard ? 'text-white/90' : 'text-[#1E3A8A]'}
          />
          <span className="hidden sm:inline">TIQR CREATOR</span>
          <span className="sm:hidden">TIQR</span>
        </button>

        {/* DATA CHECKER */}
        <button
          type="button"
          onClick={() => !isChecker && navigate('/checker')}
          aria-current={isChecker ? 'page' : undefined}
          title="Excel Data Checker"
          className={`${tabBase} ${isChecker ? `${activeTab} ${activeIndicator}` : inactiveTab}`}
        >
          <FileSpreadsheet
            size={11}
            className={isChecker ? 'text-white/90' : 'text-[#1E3A8A]'}
          />
          <span className="hidden sm:inline">DATA CHECKER</span>
          <span className="sm:hidden">CHECK</span>
        </button>

        {/* NAME DICTIONARY */}
        <button
          type="button"
          onClick={() => !isNames && navigate('/names')}
          aria-current={isNames ? 'page' : undefined}
          title="Myanmar–English Name Dictionary"
          className={`${tabBase} ${isNames ? `${activeTab} ${activeIndicator}` : inactiveTab}`}
        >
          <BookA
            size={11}
            className={isNames ? 'text-white/90' : 'text-[#1E3A8A]'}
          />
          <span className="hidden sm:inline">NAME DICTIONARY</span>
          <span className="sm:hidden">NAMES</span>
        </button>

        {/* ADMIN — only for admins */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => !isAdminPage && navigate('/admin')}
            aria-current={isAdminPage ? 'page' : undefined}
            title="System Administration"
            className={`${tabBase} ${isAdminPage ? `${activeTab} ${activeIndicator}` : inactiveTab}`}
          >
            <ShieldCheck
              size={11}
              className={isAdminPage ? 'text-white/90' : 'text-[#1E3A8A]'}
            />
            <span className="hidden sm:inline">ADMIN</span>
            <span className="sm:hidden">ADM</span>
          </button>
        )}
      </nav>

      {/* ── Logout — outside the tray, danger ghost ── */}
      <button
        type="button"
        onClick={handleLogout}
        title="Sign out"
        className="
          h-8 inline-flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5
          border border-[#E5E7EB] bg-white
          text-[9px] font-black uppercase tracking-wider text-[#9CA3AF]
          hover:border-red-300 hover:bg-red-50 hover:text-red-600
          active:scale-95 transition-all duration-150 whitespace-nowrap shrink-0
        "
      >
        <LogOut size={11} />
        <span className="hidden sm:inline">LOGOUT</span>
      </button>
    </div>
  );
}
